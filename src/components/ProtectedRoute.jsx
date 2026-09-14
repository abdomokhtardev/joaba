import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EulaModal from './EulaModal';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!userData && currentUser) {
      const timer = setTimeout(() => {
        setTimedOut(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [userData, currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Wait for userData to load
  if (!userData) {
    if (timedOut) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-8 max-w-md w-full animate-slideDown flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl font-bold">
              !
            </div>
            <h3 className="text-lg font-bold text-slate-100">تعذر تحميل بيانات الحساب</h3>
            <p className="text-sm text-slate-400">يبدو أن بيانات الحساب غير مكتملة أو تم حذف الحساب من قاعدة البيانات.</p>
            <button
              onClick={() => signOut(auth)}
              className="btn-primary py-2.5 px-6 text-sm w-full mt-2"
            >
              تسجيل الخروج والعودة للدخول
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isProfilePage = location.pathname === '/profile';
  const isAdminPage = location.pathname === '/admin';
  const isAdmin = userData.role === 'admin';

  // Only admin can access admin panel
  if (isAdminPage && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Suspension check: suspended users can only visit profile
  if (userData.status === 'suspended' && !isProfilePage) {
    return <Navigate to="/profile" replace />;
  }

  // Paywall: check subscription expiry for non-admins
  if (!isAdmin && !isProfilePage) {
    const endDateRaw = userData.subscriptionEndDate;
    // FIX: subscriptionEndDate may be undefined (new user) — treat as expired
    const isExpired = !endDateRaw || new Date(endDateRaw) <= new Date();
    if (isExpired) {
      return <Navigate to="/profile" replace />;
    }
  }

  // EULA: must be accepted before accessing app
  if (!isAdmin && !userData.eulaAccepted) {
    return <EulaModal />;
  }

  return children;
};

export default ProtectedRoute;
