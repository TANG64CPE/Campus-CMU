import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bell, MessageCircle, MessageSquare, X } from 'lucide-react';
import { ChatMessage, ChatThread, User } from '../types';
import { reservationApi } from '../services/api';
import { ReservationChat } from './ReservationChat';

interface ChatInboxProps {
  user: User;
}

const readSavedMessages = (key: string): Record<string, string> => {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
};

export const ChatInbox: React.FC<ChatInboxProps> = ({ user }) => {
  const storageKey = `campusmart.chat.read.v1.${user.id}`;
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [lastRead, setLastRead] = useState<Record<string, string>>(() => readSavedMessages(storageKey));
  const [isOpen, setIsOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [toast, setToast] = useState<ChatThread | null>(null);
  const [loadError, setLoadError] = useState('');
  const previousLatestIds = useRef<Record<string, string | undefined>>({});
  const hasLoadedOnce = useRef(false);
  const selectedThreadId = useRef<string | null>(null);
  const toastTimeout = useRef<number | undefined>(undefined);

  const markRead = useCallback((threadId: string, createdAt?: string) => {
    if (!createdAt) return;
    setLastRead((current) => {
      if (current[threadId] && new Date(current[threadId]).getTime() >= new Date(createdAt).getTime()) {
        return current;
      }
      const next = { ...current, [threadId]: createdAt };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const handleMessagesLoaded = useCallback((threadId: string, messages: ChatMessage[]) => {
    const latest = messages[messages.length - 1];
    if (latest) markRead(threadId, latest.createdAt);
  }, [markRead]);

  const handleActiveThreadMessagesLoaded = useCallback((messages: ChatMessage[]) => {
    const threadId = selectedThreadId.current;
    if (threadId) handleMessagesLoaded(threadId, messages);
  }, [handleMessagesLoaded]);

  const loadThreads = useCallback(async () => {
    try {
      const nextThreads = await reservationApi.getChatThreads();
      const latestIds: Record<string, string | undefined> = {};

      if (hasLoadedOnce.current) {
        for (const thread of nextThreads) {
          const latest = thread.latestMessage;
          if (
            latest &&
            latest.senderId !== user.id &&
            latest.id !== previousLatestIds.current[thread.id] &&
            selectedThreadId.current !== thread.id
          ) {
            setToast(thread);
            window.clearTimeout(toastTimeout.current);
            toastTimeout.current = window.setTimeout(() => setToast(null), 6000);
            break;
          }
        }
      }

      for (const thread of nextThreads) latestIds[thread.id] = thread.latestMessage?.id;
      previousLatestIds.current = latestIds;
      hasLoadedOnce.current = true;
      setThreads(nextThreads);
      setLoadError('');
    } catch {
      setLoadError('โหลดรายการแชตไม่สำเร็จ');
    }
  }, [user.id]);

  useEffect(() => {
    void loadThreads();
    const interval = window.setInterval(() => void loadThreads(), 5000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(toastTimeout.current);
    };
  }, [loadThreads]);

  useEffect(() => {
    const syncReadState = (event: StorageEvent) => {
      if (event.key === storageKey) setLastRead(readSavedMessages(storageKey));
    };
    window.addEventListener('storage', syncReadState);
    return () => window.removeEventListener('storage', syncReadState);
  }, [storageKey]);

  const unreadCount = useMemo(() => threads.reduce((count, thread) => {
    const latest = thread.latestMessage;
    const lastReadAt = lastRead[thread.id];
    const isUnread = Boolean(
      latest &&
      latest.senderId !== user.id &&
      (!lastReadAt || new Date(latest.createdAt).getTime() > new Date(lastReadAt).getTime())
    );
    return count + (isUnread ? 1 : 0);
  }, 0), [lastRead, threads, user.id]);

  const openThread = (thread: ChatThread) => {
    setIsOpen(true);
    setSelectedThread(thread);
    selectedThreadId.current = thread.id;
    markRead(thread.id, thread.latestMessage?.createdAt);
    setToast(null);
  };

  const closeInbox = () => {
    setIsOpen(false);
    setSelectedThread(null);
    selectedThreadId.current = null;
  };

  const returnToThreadList = () => {
    setSelectedThread(null);
    selectedThreadId.current = null;
  };

  return (
    <>
      {toast && !isOpen && (
        <button
          type="button"
          onClick={() => openThread(toast)}
          className="fixed bottom-[88px] right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-hairline bg-white p-4 text-left shadow-tinted-lg transition hover:-translate-y-0.5"
          aria-label={`ข้อความใหม่จาก ${toast.otherParticipant.name}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white"><Bell className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-ink">ข้อความใหม่จาก {toast.otherParticipant.name}</span>
            <span className="block truncate text-xs text-ink-secondary">{toast.product.title}: {toast.latestMessage?.content}</span>
          </span>
          <span className="rounded-full bg-accent-red px-2 py-0.5 text-[10px] font-bold text-white">1</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:bg-ink-deep focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={unreadCount ? `เปิดแชต มี ${unreadCount} ข้อความที่ยังไม่ได้อ่าน` : 'เปิดแชต'}
      >
        <MessageCircle className="h-5 w-5" />
        <span>แชต</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-end sm:justify-end sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInbox();
          }}
        >
          <section role="dialog" aria-modal="true" aria-label="กล่องข้อความ" className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-hairline bg-white shadow-2xl sm:max-h-[min(720px,calc(100vh-2.5rem))] sm:rounded-2xl">
            <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
              {selectedThread && (
                <button type="button" onClick={returnToThreadList} className="rounded-full p-1.5 text-ink-secondary transition hover:bg-surface-soft" aria-label="กลับไปรายการแชต">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold text-ink">{selectedThread ? selectedThread.otherParticipant.name : 'ข้อความ'}</h2>
                <p className="truncate text-xs text-ink-tertiary">{selectedThread ? selectedThread.product.title : 'แชตจากการจองสินค้า'}</p>
              </div>
              <button type="button" onClick={closeInbox} className="rounded-full p-2 text-ink-secondary transition hover:bg-surface-soft hover:text-ink" aria-label="ปิดกล่องข้อความ">
                <X className="h-5 w-5" />
              </button>
            </header>

            {selectedThread ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <ReservationChat
                  reservationId={selectedThread.id}
                  currentUserId={user.id}
                  onMessagesLoaded={handleActiveThreadMessagesLoaded}
                />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {loadError ? (
                  <p className="p-6 text-center text-sm text-accent-red">{loadError}</p>
                ) : threads.length ? (
                  <ul className="divide-y divide-hairline">
                    {threads.map((thread) => {
                      const latest = thread.latestMessage;
                      const isUnread = Boolean(
                        latest && latest.senderId !== user.id &&
                        (!lastRead[thread.id] || new Date(latest.createdAt).getTime() > new Date(lastRead[thread.id]).getTime())
                      );
                      return (
                        <li key={thread.id}>
                          <button type="button" onClick={() => openThread(thread)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-surface-soft">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline bg-surface-soft text-ink-secondary">
                              {thread.product.imageUrl ? <img src={thread.product.imageUrl} alt="" className="h-full w-full object-cover" /> : <MessageSquare className="h-4 w-4" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-ink">{thread.otherParticipant.name}</span>
                                {isUnread && <span className="rounded-full bg-accent-red px-2 py-0.5 text-[10px] font-bold text-white">1</span>}
                              </span>
                              <span className="block truncate text-xs text-ink-secondary">{thread.product.title}</span>
                              <span className={`mt-0.5 block truncate text-xs ${isUnread ? 'font-semibold text-ink' : 'text-ink-tertiary'}`}>
                                {latest ? latest.content : 'เริ่มคุยเรื่องนัดรับสินค้า'}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <MessageCircle className="mx-auto mb-3 h-8 w-8 text-ink-tertiary" />
                    <p className="text-sm font-semibold text-ink">ยังไม่มีแชต</p>
                    <p className="mt-1 text-xs text-ink-tertiary">แชตจะปรากฏที่นี่เมื่อมีการจองสินค้า</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};
