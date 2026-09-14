import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, AlertCircle, CheckCircle, Clock, Sparkles, Trash2, Info } from 'lucide-react';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../utils/toastUtils';
import { handleFirestoreError } from '../utils/firestoreErrorUtils';

const SupportModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('new'); // 'new' or 'history'
  const [type, setType] = useState('suggestion'); // 'suggestion', 'complaint', 'inquiry'
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userTickets, setUserTickets] = useState([]);

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const q = query(
      collection(db, 'support_tickets'),
      where('userId', '==', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const tickets = [];
      snap.forEach((docSnap) => {
        tickets.push({ id: docSnap.id, ...docSnap.data() });
      });
      tickets.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setUserTickets(tickets);
    });

    return () => unsub();
  }, [currentUser, isOpen]);

  // When modal is opened, if there are unread replies, switch to history tab and mark as seen immediately
  useEffect(() => {
    if (isOpen && userTickets.length > 0) {
      const hasUnread = userTickets.some((t) => t.status === 'replied' && !t.userSeen);
      if (hasUnread) {
        setTab('history');
      }
      userTickets.forEach(async (t) => {
        if (t.status === 'replied' && !t.userSeen) {
          try {
            await updateDoc(doc(db, 'support_tickets', t.id), { userSeen: true });
          } catch (e) {
            // Ignore if silent
          }
        }
      });
    }
  }, [isOpen, userTickets]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject || !cleanMessage || !currentUser) return;

    if (cleanSubject.length > 200) {
      return toast.error('موضوع الرسالة يجب ألا يتجاوز 200 حرف.');
    }
    if (cleanMessage.length > 5000) {
      return toast.error('نص الرسالة طويل جداً. الحد الأقصى هو 5000 حرف.');
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        type,
        subject: cleanSubject,
        message: cleanMessage,
        status: 'pending',
        adminReply: '',
        userSeen: false,
        createdAt: serverTimestamp()
      });

      toast.success('تم إرسال رسالتك بنجاح! سنراجعها في أقرب وقت. 💌');
      setSubject('');
      setMessage('');
      setTab('history');
    } catch (error) {
      handleFirestoreError(error, 'حدث خطأ أثناء إرسال الرسالة.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (t) => {
    if (t === 'suggestion') return '💡 اقتراح أو توصية';
    if (t === 'complaint') return '⚠️ شكوى أو مشكلة';
    return '❓ استفسار عام';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-lg p-6 relative overflow-hidden border border-glass-border shadow-2xl animate-slideDown">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="إغلاق"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center shrink-0">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-50">الدعم والتوصيات 💬</h2>
            <p className="text-xs text-slate-400">شاركنا اقتراحاتك أو استفساراتك لتطوير المنصة.</p>
          </div>
        </div>

        {/* Tabs: New Ticket / History */}
        <div className="flex bg-white/5 p-1 rounded-xl border border-glass-border mb-4">
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
              tab === 'new'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            إرسال رسالة جديدة
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              tab === 'history'
                ? 'bg-accent-primary text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>رسائلي السابقة</span>
            {userTickets.length > 0 && (
              <span className="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {userTickets.length}
              </span>
            )}
          </button>
        </div>

        {tab === 'new' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">نوع الرسالة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'suggestion', label: '💡 اقتراح' },
                  { id: 'inquiry', label: '❓ استفسار' },
                  { id: 'complaint', label: '⚠️ مشكلة' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      type === item.id
                        ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/40 font-bold'
                        : 'bg-white/5 text-slate-400 border-glass-border hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">موضوع الرسالة <span className="text-red-400">*</span></label>
              <input
                type="text"
                className="input-glass text-sm py-2.5 px-3"
                placeholder="مثال: اقتراح ميزة جديدة / استفسار عن الاشتراك"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">التفاصيل <span className="text-red-400">*</span></label>
              <textarea
                className="input-glass text-sm py-2.5 px-3 min-h-[100px] resize-y"
                placeholder="اكتب رسالتك أو اقتراحك هنا..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-glass-border">
              <span className="text-[11px] text-slate-400">
                ✨ نقرأ جميع التوصيات ونرد عليها بأسرع وقت
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2 px-5 text-sm flex items-center gap-1.5 shadow-md shadow-accent-primary/20"
              >
                <Send size={15} />
                <span>{submitting ? 'جاري الإرسال...' : 'إرسال الرسالة'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
            {userTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                لم ترسل أي رسائل أو استفسارات بعد.
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-300 text-xs">
                  <Info size={15} className="shrink-0" />
                  <span>سجل رسائلك وتواصلك مع إدارة المنصة، يمكنك متابعة حالة الردود هنا.</span>
                </div>

                {userTickets.map((t) => (
                  <div key={t.id} className="p-3.5 rounded-xl bg-white/5 border border-glass-border flex flex-col gap-2 relative transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">{t.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                            t.status === 'replied'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {t.status === 'replied' ? 'تم الرد ✔️' : 'قيد المراجعة ⏳'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] text-accent-primary">{getTypeLabel(t.type)}</span>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap break-words bg-black/20 p-2.5 rounded-lg border border-white/5">
                      {t.message}
                    </p>

                    {t.adminReply && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex flex-col gap-1 mt-1">
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                          <span className="flex items-center gap-1">
                            <CheckCircle size={13} /> رد الإدارة:
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                          {t.adminReply}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SupportModal;
