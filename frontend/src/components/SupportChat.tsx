import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { SupportMessage, User } from '../types';
import { supportApi } from '../services/api';

interface SupportChatProps {
  user: User;
}

export const SupportChat: React.FC<SupportChatProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      setMessages(await supportApi.getMyMessages());
      setError('');
    } catch {
      setError('โหลดข้อความถึง Admin ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(), 4000);
    return () => window.clearInterval(interval);
  }, [isOpen, loadMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = content.trim();
    if (!message || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await supportApi.sendMessage(message);
      setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
      setContent('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'ส่งข้อความถึง Admin ไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent-red px-6 py-2.5 text-sm font-semibold text-white shadow-tinted-xs transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      >
        <MessageSquare className="h-4 w-4" />
        ติดต่อ Admin
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-chat-title"
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-hairline bg-white shadow-2xl sm:rounded-2xl"
          >
            <header className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <div>
                <h2 id="support-chat-title" className="font-semibold text-ink">ติดต่อ Admin</h2>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-2 text-ink-secondary transition hover:bg-surface-soft" aria-label="ปิดหน้าต่างแชต">
                <X className="h-4 w-4" />
              </button>
            </header>
            <div ref={messagesContainerRef} className="h-80 space-y-3 overflow-y-auto bg-surface/50 px-4 py-4" aria-live="polite">
              {loading ? (
                <p className="py-8 text-center text-sm text-ink-tertiary">กำลังโหลดข้อความ…</p>
              ) : messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-ink-tertiary">ส่งข้อความถึง Admin เพื่อขอปลดระงับบัญชีได้เลย</p>
              ) : messages.map((message) => {
                const mine = message.senderId === user.id;
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-left ${mine ? 'rounded-br-sm bg-ink text-white' : 'rounded-bl-sm border border-hairline bg-white text-ink'}`}>
                      {!mine && <p className="mb-1 text-left text-[11px] font-semibold opacity-70">Admin</p>}
                      <p className="whitespace-pre-wrap break-words text-left text-sm">{message.content}</p>
                      <time className={`mt-1 block text-right text-[10px] ${mine ? 'text-white/65' : 'text-ink-tertiary'}`} dateTime={message.createdAt}>
                        {new Date(message.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </div>
                  </div>
                );
              })}
            </div>
            {error && <p role="alert" className="px-4 pt-2 text-xs text-accent-red">{error}</p>}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-hairline p-3">
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
                placeholder="พิมพ์ข้อความ… (Enter เพื่อส่ง)"
                aria-label="ข้อความถึง Admin"
                className="min-h-11 flex-1 resize-y rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              />
              <button type="submit" disabled={!content.trim() || sending} aria-label="ส่งข้อความ" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-40">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">ส่ง</span>
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
};
