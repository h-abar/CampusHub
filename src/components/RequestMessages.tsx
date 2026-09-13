import { useEffect, useRef, useState } from 'react';
import { Landmark, Send, User } from 'lucide-react';
import type { ServiceRequest } from '../types';
import { sendRequestMessage, markRequestMessagesRead } from '../utils/storage';
import { formatDate } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  request: ServiceRequest;
  viewer: 'manager' | 'requester';
  viewerName: string;
  onUpdated?: () => void;
  compact?: boolean;
}

const timeOf = (iso: string, isAr: boolean) =>
  new Date(iso).toLocaleTimeString(isAr ? 'ar-SA' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

export default function RequestMessages({ request, viewer, viewerName, onUpdated, compact }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const messages = request.messages || [];

  useEffect(() => {
    markRequestMessagesRead(request.id, viewer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.id, request.messages?.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    sendRequestMessage(request.id, viewer, viewerName, text);
    setText('');
    onUpdated?.();
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
          <Landmark className="w-3.5 h-3.5 text-primary-700" />
          {isAr ? 'الرسائل الداخلية' : 'Internal Messages'}
        </span>
        <span className="text-[10px] text-slate-400">{messages.length} {isAr ? 'رسالة' : 'msgs'}</span>
      </div>

      <div className={`space-y-2.5 p-3.5 overflow-y-auto bg-slate-50/50 ${compact ? 'max-h-48' : 'max-h-64'}`}>
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-4">
            {isAr
              ? 'لا توجد رسائل بعد — ابدأ المحادثة مع ' + (viewer === 'manager' ? 'مقدم الطلب' : 'إدارة المركز')
              : 'No messages yet — start the conversation'}
          </p>
        )}
        {messages.map((m) => {
          const mine =
            (viewer === 'manager' && m.from === 'manager') ||
            (viewer === 'requester' && m.from === 'requester');
          const sys = m.from === 'system';
          if (sys) {
            return (
              <div key={m.id} className="text-center">
                <span className="inline-block text-[10px] text-slate-500 bg-slate-200/70 rounded-full px-3 py-1">
                  {m.text} · {formatDate(m.at.split('T')[0], language)} {timeOf(m.at, isAr)}
                </span>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
                  mine
                    ? 'bg-primary-700 text-white rounded-ts-sm'
                    : 'bg-white text-ink-800 border border-slate-200 rounded-te-sm'
                }`}
              >
                <div className={`text-[10px] font-bold mb-0.5 flex items-center gap-1 ${mine ? 'text-secondary-200' : 'text-primary-700'}`}>
                  <User className="w-3 h-3" />
                  {m.senderName}
                </div>
                <div className="leading-relaxed break-words">{m.text}</div>
                <div className={`text-[9px] mt-1 ${mine ? 'text-white/60' : 'text-slate-400'}`} dir="ltr">
                  {formatDate(m.at.split('T')[0], language)} · {timeOf(m.at, isAr)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          className="input-field !py-2 text-sm flex-1"
          placeholder={isAr ? 'اكتب رسالتك...' : 'Type your message...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!text.trim()}
          className="btn-primary !p-2.5 disabled:opacity-40"
          title={isAr ? 'إرسال' : 'Send'}
        >
          <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
