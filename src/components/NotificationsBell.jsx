import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Info, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const ICON_MAP = {
  bell: { icon: Bell, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  sparkles: { icon: Sparkles, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
  info: { icon: Info, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  alert: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

const NotificationsBell = () => {
  const { currentUser, userData } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAnnouncements(data);

      const lastReadTs = userData?.lastReadAnnouncement?.toMillis() || 0;
      let count = 0;
      data.forEach(ann => {
        if (ann.createdAt && ann.createdAt.toMillis() > lastReadTs) {
          count++;
        }
      });
      setUnreadCount(count);
    });

    return () => unsub();
  }, [currentUser, userData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    
    // Mark as read if there are unread
    if (!isOpen && unreadCount > 0 && currentUser) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          lastReadAnnouncement: serverTimestamp()
        });
        setUnreadCount(0);
      } catch (err) {
        console.error("Error marking announcements as read:", err);
      }
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.toMillis()).toLocaleDateString('ar-EG', {
      month: 'short', day: 'numeric'
    });
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={popupRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
        title="الإشعارات"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-accent-primary animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 md:right-0 md:left-auto mt-2 w-80 max-h-[400px] bg-slate-900 border border-glass-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl">
          <div className="p-4 border-b border-glass-border flex items-center justify-between bg-white/5">
            <h3 className="text-slate-50 font-bold">الإشعارات والتحديثات</h3>
          </div>

          <div className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
            {announcements.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">لا توجد إشعارات حالياً.</p>
            ) : (
              announcements.map((ann) => {
                const conf = ICON_MAP[ann.icon] || ICON_MAP.bell;
                const IconComp = conf.icon;
                const isNew = ann.createdAt && userData?.lastReadAnnouncement && ann.createdAt.toMillis() > userData.lastReadAnnouncement.toMillis();

                return (
                  <div key={ann.id} className={`p-3 rounded-xl flex gap-3 transition-colors ${isNew && unreadCount > 0 ? 'bg-accent-primary/5 border border-accent-primary/20' : 'hover:bg-white/5'}`}>
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${conf.bg} ${conf.color}`}>
                      <IconComp size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className="text-sm font-bold text-slate-200 leading-tight">{ann.title}</h4>
                        <span className="text-[10px] text-slate-500 shrink-0">{formatDate(ann.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">{ann.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
