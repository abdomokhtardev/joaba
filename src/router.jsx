import { createBrowserRouter } from 'react-router-dom';
import React, { lazy, Suspense } from 'react';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load all pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LinksVault = lazy(() => import('./pages/LinksVault'));
const ProjectsHub = lazy(() => import('./pages/ProjectsHub'));
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'));
const Journal = lazy(() => import('./pages/Journal'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

const PageLoader = () => (
  <div className="h-[calc(100vh-100px)] flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-400 text-sm">جاري التحميل...</p>
    </div>
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(Login),
  },
  {
    path: '/signup',
    element: withSuspense(Signup),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(Dashboard),
      },
      {
        path: 'links',
        element: withSuspense(LinksVault),
      },
      {
        path: 'projects',
        element: withSuspense(ProjectsHub),
      },
      {
        path: 'projects/:id',
        element: withSuspense(ProjectWorkspace),
      },
      {
        path: 'journal',
        element: withSuspense(Journal),
      },
      {
        path: 'profile',
        element: withSuspense(Profile),
      },
      {
        path: 'admin',
        element: withSuspense(AdminDashboard),
      },
      {
        path: '*',
        element: withSuspense(NotFound),
      },
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFound),
  }
]);

export default router;
