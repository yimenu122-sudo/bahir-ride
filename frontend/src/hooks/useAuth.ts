import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    isDispatcher: user?.role === 'DISPATCHER',
    isFleet: user?.role === 'FLEET',
    isSupport: user?.role === 'SUPPORT',
  };
};
