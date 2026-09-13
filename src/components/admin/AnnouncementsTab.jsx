import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Bell, MessageSquare, AlertCircle, Info, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { showDeleteConfirm } from '../../utils/toastUtils';

const ICON_OPTIONS = [
  { value: 'bell', label: 'جرس (تنبيه عادي)', icon: Bell, color: 'text-blue-400' },
  { value: 'sparkles', label: 'نجوم (ميزة جديدة)', icon: Sparkles, color: 'text-accent-primary' },
  { value: 'info', label: 'معلومة (توضيح)', icon: Info, color: 'text-emerald-400' },
  { value: 'alert', label: 'تحذير (هام جداً)', icon: AlertCircle, color: 'text-red-400' },
];

const AnnouncementsTab = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('bell');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return toast.error('يرجى ملء العنوان والرسالة.');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        icon: selectedIcon,
        createdAt: serverTimestamp()
      });
      toast.success('تم إرسال الإشعار لجميع المستخدمين!');
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error('حدث خطأ أثناء إرسال الإشعار.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    showDeleteConfirm('هل أنت متأكد من حذف هذا الإشعار نهائياً؟', async () => {
      await deleteDoc(doc(db, 'announcements', id));
    }, 'تم حذف الإشعار. 🗑️');
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.toMillis()).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderIcon = (iconName, className) => {
    const option = ICON_OPTIONS.find(o => o.value === iconName) || ICON_OPTIONS[0];
    const IconComponent = option.icon;
    return <IconComponent size={20} className={`${option.color} ${className}`} />;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Add Announcement Form */}
      <div className="bg-white/5 border border-glass-border p-6 rounded-2xl relative overflow-hidden">
        <h2 className="text-xl text-slate-50 font-bold mb-4 flex items-center gap-2">
          <Bell className="text-accent-primary" />
          إرسال إشعار جديد
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">عنوان الإشعار</label>
              <input
                type="text"
                className="input-glass w-full"
                placeholder="مثال: تحديث جديد متاح الآن!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">نوع الإشعار (الأيقونة)</label>
              <select 
                className="input-glass w-full appearance-none"
                value={selectedIcon}
                onChange={(e) => setSelectedIcon(e.target.value)}
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-slate-800">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">نص الرسالة</label>
            <textarea
              className="input-glass w-full min-h-[100px] resize-y"
              placeholder="اكتب تفاصيل التحديث أو الرسالة هنا لتبدو واضحة للمستخدم..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary py-3 px-8 self-end flex items-center gap-2 shadow-lg shadow-accent-primary/20"
          >
            {loading ? <span className="animate-spin border-2 border-white/20 border-t-white w-5 h-5 rounded-full" /> : <Plus size={18} />}
            نشر الإشعار
          </button>
        </form>
      </div>

      {/* Announcements List */}
      <div className="border-t border-glass-border pt-6">
        <h2 className="text-xl text-slate-50 font-bold mb-4">الإشعارات السابقة ({announcements.length})</h2>
        {announcements.length === 0 ? (
          <p className="text-slate-500 text-sm glass-panel p-6 text-center">لا توجد إشعارات سابقة.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white/5 border border-glass-border p-4 rounded-xl flex gap-4 transition-all hover:bg-white/10 group">
                <div className="shrink-0 pt-1">
                  {renderIcon(ann.icon)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-slate-100 font-bold">{ann.title}</h3>
                    <span className="text-xs text-slate-500">{formatDate(ann.createdAt)}</span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{ann.message}</p>
                </div>
                <button 
                  onClick={() => handleDelete(ann.id)}
                  className="shrink-0 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity self-start p-1"
                  title="حذف الإشعار"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsTab;
