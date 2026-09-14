import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bell, AlertCircle, Info, Sparkles, X } from 'lucide-react';
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
  const [popupPos, setPopupPos] = useState({ top: 0, right: 0, isMobile: false });
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q, 
      (snap) => {
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
      },
      (error) => {
        // Handle permission error gracefully if rules are not yet applied
        console.warn("Notifications listener note:", error.message);
      }
    );

    return () => unsub();
  }, [currentUser, userData]);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setPopupPos({ top: 0, right: 0, isMobile: true });
    } else {
      const rect = buttonRef.current.getBoundingClientRect();
      const rightOffset = Math.max(12, window.innerWidth - rect.right);
      setPopupPos({
        top: rect.bottom + 8,
        right: rightOffset,
        isMobile: false
      });
    }
  };

  const handleOpen = async () => {
    const nextState = !isOpen;
    if (nextState) {
      updatePosition();
    }
    setIsOpen(nextState);

    // Mark as read if opening with unread items
    if (nextState && unreadCount > 0 && currentUser) {
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

  useEffect(() => {
    if (!isOpen) return;

    const handleResizeOrScroll = () => {
      updatePosition();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.toMillis()).toLocaleDateString('ar-EG', {
      month: 'short', day: 'numeric'
    });
  };

  if (!currentUser) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
        title="الإشعارات والتحديثات"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-accent-primary animate-pulse' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop to close on click outside and isolate stacking context */}
          <div 
            className="fixed inset-0 z-[99998] bg-black/40 md:bg-transparent backdrop-blur-[2px] md:backdrop-blur-none" 
            onClick={() => setIsOpen(false)} 
          />

          {/* Popup rendered directly on body at z-[99999] */}
          <div 
            style={
              popupPos.isMobile 
                ? {} 
                : { top: `${popupPos.top}px`, right: `${popupPos.right}px` }
            }
            className={`fixed z-[99999] bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl animate-scaleIn transition-all ${
              popupPos.isMobile
                ? 'bottom-20 left-3 right-3 max-w-sm mx-auto'
                : 'w-84 max-w-[calc(100vw-32px)]'
            }`}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-white/[0.03] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                <h3 className="text-slate-100 font-bold text-sm">الإشعارات والتحديثات</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="إغلاق"
              >
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2 max-h-[55vh] md:max-h-[380px]">
              {announcements.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Bell size={28} className="mx-auto text-slate-600 mb-2 opacity-60" />
                  <p className="text-slate-400 text-sm">لا توجد إشعارات جديدة حالياً.</p>
                </div>
              ) : (
                announcements.map((ann) => {
                  const conf = ICON_MAP[ann.icon] || ICON_MAP.bell;
                  const IconComp = conf.icon;
                  const isNew = ann.createdAt && userData?.lastReadAnnouncement && ann.createdAt.toMillis() > userData.lastReadAnnouncement.toMillis();

                  return (
                    <div 
                      key={ann.id} 
                      className={`p-3 rounded-xl flex gap-3 transition-colors border ${
                        isNew && unreadCount > 0 
                          ? 'bg-accent-primary/10 border-accent-primary/30' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${conf.bg} ${conf.color}`}>
                        <IconComp size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="text-sm font-semibold text-slate-200 leading-tight truncate">{ann.title}</h4>
                          <span className="text-[10px] text-slate-500 shrink-0">{formatDate(ann.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed break-words">{ann.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default NotificationsBell;
