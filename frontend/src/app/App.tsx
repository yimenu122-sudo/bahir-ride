import { RouterProvider } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { router } from './routes';
import { useAuthStore } from '../store/auth.store';
import i18n from '../i18n/i18n';
import '../styles/global.css';

/**
 * Bahir-Ride Web Application Root Component
 * 
 * 🚀 RESPONSIBILITIES:
 * 1. Bootstraps global providers (Auth, i18n, Theme)
 * 2. Manages application initialization & session recovery
 * 3. Mounts the centralized routing system (RBAC)
 */
function App() {
  const { isAuthenticated } = useAuthStore();
  const [theme] = useState<'light' | 'dark'>(
    (localStorage.getItem('theme') as 'light' | 'dark') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  );

  // 1. Theme Management
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 2. Initialization Logic: Handle Language & Session
  useEffect(() => {
    // Detect & Set Initial Language
    const storedLang = localStorage.getItem('i18nextLng') || 'en';
    if (i18n.language !== storedLang) {
      i18n.changeLanguage(storedLang);
    }

    // Set document metadata
    document.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
    document.title = i18n.language === 'am' ? 'ባህር-ራይድ | ፕሪሚየም የትራንስፖርት' : 'Bahir-Ride | Premium Transport';
  }, []);

  // 3. Global Network & Session Monitors
  useEffect(() => {
    const handleReauth = () => {
      // Logic for token refresh would go here
      console.log('Verifying Bahir-Ride Session...');
    };

    if (isAuthenticated) handleReauth();
  }, [isAuthenticated]);

  /**
   * 4. Application Render
   * Everything is wrapped in a Suspense boundary for lazy-loaded dashboard modules.
   */
  return (
    <div className={`bahir-ride-app lang-${i18n.language} theme-${theme}`}>
      <Suspense fallback={<InitialSplashScreen />}>
        {/* The router handles all page logic and ProtectedRoute security */}
        <RouterProvider router={router} />
      </Suspense>
    </div>
  );
}

/**
 * Premium Initial Splash Screen
 * Shown while the main JS bundle or lazy-loaded modules are transferring.
 */
const InitialSplashScreen = () => (
  <div className="loading-screen" style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    height: '100vh',
    background: 'var(--background)',
    gap: '24px'
  }}>
    <div className="logo-ring" style={{ width: '60px', height: '60px', borderTopColor: 'var(--primary)' }}></div>
    <div className="animate-pulse" style={{ 
      color: 'var(--primary)', 
      letterSpacing: '3px', 
      fontSize: '0.75rem', 
      fontWeight: 700,
      opacity: 0.8
    }}>
      BAHIR-RIDE WEB
    </div>
  </div>
);

export default App;
