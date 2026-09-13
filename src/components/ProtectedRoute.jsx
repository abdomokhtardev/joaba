import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EulaModal from './EulaModal';

const ProtectedRoute = ({ children }) => {
  const { currentUser, userData } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Wait for userData to load
  if (!userData) {
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
