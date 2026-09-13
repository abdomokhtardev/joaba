import React, { useState } from 'react';
import { MessageSquare, Reply, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SupportTab = ({ tickets = [], onReplyTicket, onDeleteTicket }) => {
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'replied'
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const filteredTickets = tickets.filter((t) => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'replied') return t.status === 'replied';
    return true;
  });

  const handleStartReply = (ticket) => {
    setReplyingId(ticket.id);
    setReplyText(ticket.adminReply || '');
  };

  const handleSendReply = (ticketId) => {
    if (!replyText.trim()) return toast.error('يرجى كتابة نص الرد.');
    if (onReplyTicket) {
      onReplyTicket(ticketId, replyText.trim());
      setReplyingId(null);
      setReplyText('');
    }
  };

  const getTypeBadge = (type) => {
    if (type === 'suggestion') return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px]">💡 اقتراح</span>;
    if (type === 'complaint') return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px]">⚠️ مشكلة</span>;
    return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px]">❓ استفسار</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl text-slate-50 font-bold">الشكاوى والتوصيات 💬</h2>
          <p className="text-xs text-slate-400 mt-0.5">متابعة رسائل واستفسارات المستخدمين والرد عليها.</p>
        </div>

        {/* Filter */}
        <div className="flex bg-black/30 p-1 rounded-xl border border-glass-border self-start sm:self-center">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'pending'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            الجديدة ({tickets.filter((t) => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('replied')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'replied'
              ? 'bg-emerald-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            تم الرد ({tickets.filter((t) => t.status === 'replied').length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === 'all'
              ? 'bg-accent-primary text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            الكل ({tickets.length})
          </button>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <p className="text-slate-500 text-sm glass-panel p-8 text-center">لا توجد رسائل في هذا القسم حالياً.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="glass-panel p-5 flex flex-col gap-3 border border-glass-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-glass-border pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getTypeBadge(ticket.type)}
                  <h3 className="text-base font-bold text-slate-100">{ticket.subject}</h3>
                  <span className="text-xs text-slate-400 font-mono">({ticket.userEmail})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${ticket.status === 'replied'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                      }`}
                  >
                    {ticket.status === 'replied' ? 'تم الرد' : 'في الانتظار'}
                  </span>

                  <button
                    onClick={() => onDeleteTicket(ticket.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="حذف الرسالة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                  {ticket.message}
                </p>
              </div>

              {/* Existing Admin Reply */}
              {ticket.adminReply && replyingId !== ticket.id && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>رد الإدارة المُرسل:</span>
                    <button
                      onClick={() => handleStartReply(ticket)}
                      className="text-xs underline hover:text-emerald-300"
                    >
                      تعديل الرد
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                    {ticket.adminReply}
                  </p>
                </div>
              )}

              {/* Reply Form */}
              {replyingId === ticket.id ? (
                <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-accent-primary/30 animate-slideDown">
                  <label className="text-xs text-slate-300 font-medium">كتابة الرد للمستخدم:</label>
                  <textarea
                    className="input-glass text-sm p-3 min-h-[80px] resize-y"
                    placeholder="اكتب ردك هنا..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => {
                        setReplyingId(null);
                        setReplyText('');
                      }}
                    >
                      إلغاء
                    </button>
                    <button
                      className="btn-primary py-1.5 px-5 text-xs shadow-md shadow-accent-primary/20"
                      onClick={() => handleSendReply(ticket.id)}
                    >
                      إرسال الرد
                    </button>
                  </div>
                </div>
              ) : (
                !ticket.adminReply && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleStartReply(ticket)}
                      className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5"
                    >
                      <Reply size={13} /> الرد على الرسالة
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTab;
