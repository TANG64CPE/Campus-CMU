import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { ChatMessage } from '../types';
import { reservationApi } from '../services/api';

interface ReservationChatProps {
  reservationId: string;
  currentUserId: string;
  onMessagesLoaded?: (messages: ChatMessage[]) => void;
}

export const ReservationChat: React.FC<ReservationChatProps> = ({ reservationId, currentUserId, onMessagesLoaded }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const firstLoad = useRef(true);

  const loadMessages = useCallback(async () => {
    try {
      const next = await reservationApi.getMessages(reservationId);
      setMessages(next);
      onMessagesLoaded?.(next);
      setError('');
      if (firstLoad.current) {
        firstLoad.current = false;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'โหลดข้อความไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [onMessagesLoaded, reservationId]);

  useEffect(() => {
    firstLoad.current = true;
    setLoading(true);
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(), 4000);
    return () => window.clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const message = content.trim();
    if (!message || sending) return;
    setSending(true);
    setError('');
    try {
      const sent = await reservationApi.sendMessage(reservationId, message);
      setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
      setContent('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'ส่งข้อความไม่สำเร็จ');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-hairline bg-canvas shadow-tinted-xs" aria-label="แชตการจอง">
      <header className="flex items-center gap-2 border-b border-hairline px-4 py-3">
        <h3 className="font-semibold text-ink">แชตผู้ซื้อกับผู้ขาย</h3>
      </header>

      <div className="h-72 space-y-3 overflow-y-auto bg-surface/50 px-4 py-4" aria-live="polite">
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-tertiary">กำลังโหลดข้อความ…</p>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-tertiary">เริ่มคุยเรื่องนัดรับสินค้าได้เลย</p>
        ) : messages.map((message) => {
          const mine = message.senderId === currentUserId;
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${mine ? 'rounded-br-sm bg-ink text-white' : 'rounded-bl-sm border border-hairline bg-white text-ink'}`}>
                {!mine && <p className="mb-1 text-[11px] font-semibold opacity-70">{message.sender.name}</p>}
                <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                <time className={`mt-1 block text-right text-[10px] ${mine ? 'text-white/65' : 'text-ink-tertiary'}`} dateTime={message.createdAt}>
                  {new Date(message.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
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
          aria-label="ข้อความ"
          className="min-h-11 flex-1 resize-y rounded-lg border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary"
        />
        <button type="submit" disabled={!content.trim() || sending} aria-label="ส่งข้อความ" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-deep disabled:cursor-not-allowed disabled:opacity-40">
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">ส่ง</span>
        </button>
      </form>
    </section>
  );
};
