import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, Link as LinkIcon, Briefcase, BookOpen, LogOut, User, ShieldCheck, Tag, MessageSquare, Search, X } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import SupportModal from './SupportModal';
import NotificationsBell from './NotificationsBell';
import CommandPalette from './CommandPalette';
import useUnreadTickets from '../hooks/useUnreadTickets';

const allNavLinks = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/projects', label: 'المشاريع', icon: Briefcase },
  { to: '/links', label: 'الروابط', icon: LinkIcon },
  { to: '/journal', label: 'اليوميات', icon: BookOpen },
  { to: '/profile', label: 'الملف الشخصي', icon: User },
];

const NavItem = ({ to, label, icon: Icon, end, mobile }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      mobile
        ? `p-3 rounded-xl transition-all flex flex-col items-center gap-1 ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/30' : 'text-slate-400 hover:text-slate-50'}`
        : `flex items-center gap-3 p-3 rounded-xl transition-all font-medium text-sm ${isActive ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-50'}`
    }
  >
    <Icon size={mobile ? 22 : 18} />
    {mobile ? <span className="text-xs">{label}</span> : label}
  </NavLink>
);

const Layout = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { hasUnreadReplies } = useUnreadTickets(currentUser);
  const isSuspended = userData?.status === 'suspended';
  const isSubscribed = userData?.role === 'admin' || (userData?.subscriptionEndDate && new Date(userData.subscriptionEndDate) > new Date());
  const isAdmin = userData?.role === 'admin';
  const canUseSearch = !isSuspended && (isSubscribed || isAdmin);

  // Global Ctrl+K / Cmd+K listener (only enabled for active, subscribed/admin users)
  useEffect(() => {
    if (!canUseSearch) return;

    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [canUseSearch]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().banner) {
        setBanner(docSnap.data().banner);
      }
    });
    return () => unsub();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      // Clear user-specific cache and flags from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('dismissed_req_') || key.startsWith('admin_last_seen_')) {
          localStorage.removeItem(key);
        }
      });
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/login');
    }
  };

  let navLinks;
  if (isSuspended) {
    // If account is suspended, only show Profile so suspended user cannot access other pages
    navLinks = [{ to: '/profile', label: 'الملف الشخصي', icon: User }];
  } else if (!isSubscribed) {
    navLinks = [{ to: '/profile', label: 'الاشتراك والملف', icon: User }];
  } else if (isAdmin) {
    navLinks = [...allNavLinks, { to: '/admin', label: 'الإدارة', icon: ShieldCheck }];
  } else {
    navLinks = allNavLinks;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global Announcement Banner (hidden for suspended accounts) */}
      {!isSuspended && banner && banner.isActive && !isBannerDismissed && (
        <div className="w-full bg-gradient-to-r from-purple-900/70 via-indigo-900/70 to-purple-900/70 backdrop-blur-md border-b border-purple-500/20 py-2.5 px-4 flex items-center justify-between text-xs sm:text-sm text-slate-200 z-50 animate-slideDown shadow-lg">
          <div className="flex items-center gap-2 max-w-4xl mx-auto text-center justify-center flex-1">
            <Tag size={16} className="text-amber-400 shrink-0 animate-pulse" />
            <span className="font-medium text-purple-100">{banner.message}</span>
          </div>
          <button
            onClick={() => setIsBannerDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="إغلاق الإعلان"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 p-3 md:p-4 gap-3 md:gap-4 w-full">
        {/* Mobile Header (visible only on small screens) */}
        <div className="md:hidden flex items-center justify-between glass-panel mx-3 mt-3 p-4 rounded-xl z-40 shrink-0">
          <h2 className="text-slate-50 text-xl font-semibold flex items-center gap-2" style={{ fontFamily: '"Reem Kufi", sans-serif' }}>
            <img src="/Joaba.png" alt="جعبة" className="w-8 h-8 object-contain" />
            جُعْبَة
          </h2>
          <div className="flex items-center gap-2">
            {canUseSearch && (
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="p-2 rounded-xl bg-white/5 border border-glass-border text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="بحث سريع"
              >
                <Search size={18} />
              </button>
            )}
            {!isSuspended && <NotificationsBell />}
          </div>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 glass-panel p-5 sticky top-4 h-[calc(100vh-32px)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-slate-50 text-2xl font-semibold flex items-center gap-2" style={{ fontFamily: '"Reem Kufi", sans-serif' }}>
              <img src="/Joaba.png" alt="جعبة" className="w-9 h-9 object-contain" />
              جُعْبَة
            </h2>
            {!isSuspended && !isAdmin && <NotificationsBell />}
          </div>

          {/* Quick Search / Command Palette Trigger */}
          {canUseSearch && (
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center justify-between gap-2 p-2.5 mb-4 rounded-xl bg-white/5 border border-glass-border hover:border-accent-primary/50 text-slate-400 hover:text-slate-200 transition-all text-xs group"
            >
              <div className="flex items-center gap-2">
                <Search size={15} className="group-hover:text-accent-primary transition-colors" />
                <span>بحث سريع...</span>
              </div>
              <kbd className="text-[10px] font-mono bg-black/40 border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
                Ctrl+K
              </kbd>
            </button>
          )}

          <nav className="flex flex-col gap-1 flex-1">
            {navLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-glass-border pt-3 mt-3 flex flex-col gap-1">
            {!isAdmin && (
              <button
                onClick={() => {
                  setIsSupportOpen(true);
                }}
                className="flex items-center justify-between text-xs text-slate-400 hover:text-accent-primary hover:bg-white/5 px-3 py-2 rounded-xl transition-all w-full text-right group"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={15} className="text-accent-primary" />
                  <span>توصية أو استفسار 💬</span>
                </div>
                {hasUnreadReplies && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]" title="لديك رد جديد!" />
                )}
              </button>
            )}

            {currentUser && (
              <p className="text-xs text-slate-500 px-3 py-1 truncate" title={currentUser.email}>
                {currentUser.email}
              </p>
            )}

            <button
              className="flex items-center gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-3 py-2 rounded-xl transition-all w-full text-sm"
              onClick={handleLogout}
            >
              <LogOut size={16} /> تسجيل الخروج
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0 min-w-0 md:pt-0 pt-1">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden glass-panel fixed bottom-3 left-3 right-3 p-2 flex items-center z-40 shadow-2xl overflow-x-auto scrollbar-hide gap-1">
          <div className="flex justify-around items-center min-w-max w-full">
            {navLinks.map((link) => (
              <div key={link.to} className="shrink-0 flex-1 min-w-[65px] flex justify-center">
                <NavItem {...link} mobile />
              </div>
            ))}
            <button
              className="shrink-0 flex-1 min-w-[65px] p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex flex-col items-center gap-1 justify-center"
              onClick={handleLogout}
            >
              <LogOut size={22} />
              <span className="text-xs">خروج</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Support / Feedback Modal */}
      {!isAdmin && (
        <SupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
        />
      )}

      {/* Global Command Palette (Ctrl+K) */}
      {canUseSearch && (
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
