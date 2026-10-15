import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, MessageSquare, RotateCcw, Send } from 'lucide-react';
import { AdminSupportConversation, SupportMessage, User } from '../types';
import { supportApi } from '../services/api';

interface AdminSupportInboxProps {
  admin: User | null;
}

export const AdminSupportInbox: React.FC<AdminSupportInboxProps> = ({ admin }) => {
  const [conversations, setConversations] = useState<AdminSupportConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const next = await supportApi.getConversations(showResolved);
      setConversations(next);
      setError('');
    } catch {
      setError('โหลดรายการข้อความติดต่อ Admin ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [showResolved]);

  const loadMessages = useCallback(async (userId: string) => {
    try {
      setMessages(await supportApi.getConversationMessages(userId));
      setError('');
    } catch {
      setError('โหลดบทสนทนานี้ไม่สำเร็จ');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void loadConversations();
    const interval = window.setInterval(() => void loadConversations(), 5000);
    return () => window.clearInterval(interval);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedUserId);
    const interval = window.setInterval(() => void loadMessages(selectedUserId), 4000);
    return () => window.clearInterval(interval);
  }, [loadMessages, selectedUserId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const selectedConversation = conversations.find((item) => item.userId === selectedUserId);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = content.trim();
    if (!selectedUserId || !message || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await supportApi.sendAdminMessage(selectedUserId, message);
      setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
      setContent('');
      await loadConversations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'ส่งข้อความตอบกลับไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  const handleConversationStatus = async () => {
    if (!selectedConversation || updatingStatus) return;
    setUpdatingStatus(true);
    setError('');
    try {
      await supportApi.setConversationResolved(selectedConversation.userId, !selectedConversation.isResolved);
      setSelectedUserId(null);
      await loadConversations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เปลี่ยนสถานะบทสนทนาไม่สำเร็จ');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <section className="mt-6 mb-6 overflow-hidden rounded-xl border border-hairline bg-canvas shadow-tinted-xs">
      <header className="flex items-center gap-2 border-b border-hairline bg-surface px-4 py-3">
        <MessageSquare className="h-4 w-4 text-primary" />
        <div>
          <h2 className="text-sm font-bold text-ink">ข้อความติดต่อ Admin</h2>
          <p className="text-[11px] text-ink-tertiary">ตอบกลับผู้ใช้ที่ติดต่อเรื่องบัญชีและการปลดแบน</p>
        </div>
      </header>
      <div className="flex gap-2 border-b border-hairline px-4 py-2">
        <button
          type="button"
          onClick={() => {
            setSelectedUserId(null);
            setShowResolved(false);
          }}
          aria-pressed={!showResolved}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            !showResolved ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-surface-soft'
          }`}
        >
          กำลังดำเนินการ
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedUserId(null);
            setShowResolved(true);
          }}
          aria-pressed={showResolved}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            showResolved ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-surface-soft'
          }`}
        >
          แก้ไขแล้ว
        </button>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-accent-red">
          <AlertTriangle className="h-4 w-4 shrink-0" />{error}
        </p>
      )}
      <div className="grid min-h-[360px] md:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.6fr)]">
        <aside className="max-h-64 overflow-y-auto border-b border-hairline md:max-h-[440px] md:border-b-0 md:border-r">
          {loading ? (
            <p className="p-5 text-center text-xs text-ink-tertiary">กำลังโหลด…</p>
          ) : conversations.length === 0 ? (
            <p className="p-5 text-center text-xs text-ink-tertiary">{showResolved ? 'ยังไม่มีบทสนทนาที่แก้ไขแล้ว' : 'ยังไม่มีข้อความติดต่อ'}</p>
          ) : conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedUserId(conversation.userId)}
              className={`block w-full border-b border-hairline px-4 py-3 text-left transition hover:bg-surface-soft ${
                selectedUserId === conversation.userId ? 'bg-surface-soft' : 'bg-canvas'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-ink">{conversation.user.name}</span>
                {conversation.user.isBanned && <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-accent-red">ถูกแบน</span>}
              </span>
              <span className="mt-0.5 block truncate text-[10px] text-ink-tertiary">{conversation.user.studentId} · {conversation.user.email}</span>
              <span className="mt-1 block truncate text-[11px] text-ink-secondary">{conversation.latestMessage?.content}</span>
            </button>
          ))}
        </aside>

        <div className="flex min-h-[360px] flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b border-hairline bg-surface/50 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-ink">
                    {selectedConversation.isResolved ? 'บทสนทนาที่แก้ไขแล้ว' : 'บทสนทนากับผู้ใช้'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleConversationStatus()}
                    disabled={updatingStatus}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                      selectedConversation.isResolved
                        ? 'border border-hairline bg-white text-ink-secondary hover:bg-surface-soft'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {selectedConversation.isResolved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {selectedConversation.isResolved ? 'เปิดอีกครั้ง' : 'แก้ไขแล้ว'}
                  </button>
                </div>
              </div>
              <div ref={messagesContainerRef} className="h-64 flex-1 space-y-3 overflow-y-auto bg-surface/40 px-4 py-4 md:max-h-[320px]" aria-live="polite">
                {messages.map((message) => {
                  const mine = message.senderId === admin?.id;
                  return (
                    <div key={message.id} className={`flex items-center gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-left ${mine ? 'rounded-br-sm bg-ink text-white' : 'rounded-bl-sm border border-hairline bg-white text-ink'}`}>
                        {!mine && <p className="mb-1 text-left text-[10px] font-semibold opacity-70">{message.sender.name}</p>}
                        <p className="whitespace-pre-wrap break-words text-left text-xs">{message.content}</p>
                        <time className={`mt-1 block text-right text-[10px] ${mine ? 'text-white/65' : 'text-ink-tertiary'}`} dateTime={message.createdAt}>
                          {new Date(message.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
              {!selectedConversation.isResolved && <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-hairline p-3">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  maxLength={2000}
                  rows={2}
                  placeholder="พิมพ์ข้อความตอบกลับ…"
                  aria-label="ข้อความตอบกลับ"
                  className="min-h-10 flex-1 resize-y rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <button type="submit" disabled={!content.trim() || sending} aria-label="ส่งข้อความตอบกลับ" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-white transition hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-40">
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">ส่ง</span>
                </button>
              </form>}
            </>
          ) : (
            <p className="flex flex-1 items-center justify-center px-4 py-8 text-center text-xs text-ink-tertiary">เลือกบทสนทนาจากรายการเพื่ออ่านข้อความและตอบกลับ</p>
          )}
        </div>
      </div>
    </section>
  );
};
