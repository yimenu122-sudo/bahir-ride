import { createBrowserRouter } from 'react-router-dom';
import React from 'react';

// Components (Lazy loaded for better performance)
const Login = React.lazy(() => import('../auth/Login'));
const AdminDashboard = React.lazy(() => import('../dashboards/admin/AdminDashboard'));
const SuperAdminDashboard = React.lazy(() => import('../dashboards/super-admin/SuperAdminDashboard'));
const DispatcherDashboard = React.lazy(() => import('../dashboards/dispatcher/DispatcherDashboard'));
const FleetDashboard = React.lazy(() => import('../dashboards/fleet/FleetDashboard'));
const SupportDashboard = React.lazy(() => import('../dashboards/support/SupportDashboard'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/dashboard',
    children: [
      {
        path: 'admin',
        element: <AdminDashboard />,
      },
      {
        path: 'super-admin',
        element: <SuperAdminDashboard />,
      },
      {
        path: 'dispatcher',
        element: <DispatcherDashboard />,
      },
      {
        path: 'fleet',
        element: <FleetDashboard />,
      },
      {
        path: 'support',
        element: <SupportDashboard />,
      },
    ],
  },
]);
