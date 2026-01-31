import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../store/auth.store';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute Component
 * Enforces authentication and Role-Based Access Control (RBAC).
 */
const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, token } = useAuthStore();
  const location = useLocation();

  // 1. Authentication Guard: Redirect to login if no token or not authenticated
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role Authorization: Check if user's role is permitted for this route
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If user is logged in but doesn't have permission, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. Render children (via Outlet) if all guards pass
  return <Outlet />;
};

export default ProtectedRoute;
