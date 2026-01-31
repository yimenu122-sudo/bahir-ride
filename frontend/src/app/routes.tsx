import { createBrowserRouter, Navigate } from 'react-router-dom';
import React, { Suspense } from 'react';
import ProtectedRoute from './ProtectedRoute';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Unauthorized from '../components/common/Unauthorized';

// Lazy Loading Pages (Better Performance for Bahir-Ride Web)
/**
 * @description Authentication & Public Pages
 */
const Login = React.lazy(() => import('../auth/Login'));
const SuperAdminRegister = React.lazy(() => import('../auth/SuperAdminRegister'));
const Verify = React.lazy(() => import('../auth/Verify'));
const ForgotPassword = React.lazy(() => import('../auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../auth/ResetPassword'));

/**
 * @description Dashboards (Role-Specific)
 */
const AdminDashboard = React.lazy(() => import('../dashboards/admin/AdminDashboard'));
const SuperAdminDashboard = React.lazy(() => import('../dashboards/super-admin/SuperAdminDashboard'));
const DispatcherDashboard = React.lazy(() => import('../dashboards/dispatcher/DispatcherDashboard'));
const FleetDashboard = React.lazy(() => import('../dashboards/fleet/FleetDashboard'));
const SupportDashboard = React.lazy(() => import('../dashboards/support/SupportDashboard'));



/**
 * Centralized Route Map
 * Enforces Role-Based Access Control (RBAC) via ProtectedRoute wrapper.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: '/auth',
    children: [
      {
        path: 'super-admin/register',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SuperAdminRegister />
          </Suspense>
        ),
      },
      {
        path: 'verify',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <Verify />
          </Suspense>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <ResetPassword />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute />, // Base authentication check
    children: [
      {
        index: true,
        element: <div style={{ padding: '20px' }}>Select a dashboard based on your role.</div>,
      },
      // 🟢 Admin: Core system management
      {
        path: 'admin',
        element: <ProtectedRoute allowedRoles={['ADMIN']} />,
        children: [{ index: true, element: <Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense> }],
      },
      // 👑 Super Admin: Global configuration & audit logs
      {
        path: 'super-admin',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
        children: [{ index: true, element: <Suspense fallback={<LoadingSpinner />}><SuperAdminDashboard /></Suspense> }],
      },
      // 📞 Dispatcher: Live ride management & assignment
      {
        path: 'dispatcher',
        element: <ProtectedRoute allowedRoles={['DISPATCHER']} />,
        children: [{ index: true, element: <Suspense fallback={<LoadingSpinner />}><DispatcherDashboard /></Suspense> }],
      },
      // 🚛 Fleet: Vehicle & compliance management
      {
        path: 'fleet',
        element: <ProtectedRoute allowedRoles={['FLEET']} />,
        children: [{ index: true, element: <Suspense fallback={<LoadingSpinner />}><FleetDashboard /></Suspense> }],
      },
      // 🎧 Support: Ticketing & knowledge base
      {
        path: 'support',
        element: <ProtectedRoute allowedRoles={['SUPPORT']} />,
        children: [{ index: true, element: <Suspense fallback={<LoadingSpinner />}><SupportDashboard /></Suspense> }],
      },
    ],
  },
  {
    path: '*',
    element: <div style={{ padding: '50px', textAlign: 'center' }}><h1>404</h1><p>Page Not Found</p></div>,
  }
]);
