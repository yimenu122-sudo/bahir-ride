import React from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/images/logo.png';
import '../styles/global.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'am' : 'en';
    i18n.changeLanguage(newLang);
    document.dir = i18n.dir();
    document.documentElement.lang = newLang;
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="blue-blob"></div>
        <div className="purple-blob"></div>
      </div>
      
      <div className="auth-card-wrapper animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <img src={logo} alt="Bahir-Ride Logo" className="logo-img" />
            <span className="logo-text">BAHIR-RIDE</span>
          </div>
          <button className="lang-toggle" onClick={toggleLanguage}>
            {i18n.language === 'en' ? 'አማርኛ' : 'English'}
          </button>
        </div>

        <div className="auth-content card glass">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>

        <div className="auth-footer">
          <p>© {new Date().getFullYear()} Bahir-Ride. {t('common.all_rights_reserved')}</p>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background-color: var(--background);
        }

        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
          filter: blur(80px);
          opacity: 0.4;
        }

        .blue-blob {
          position: absolute;
          top: -10%;
          left: -10%;
          width: 50%;
          height: 50%;
          background: #2563eb;
          border-radius: 50%;
        }

        .purple-blob {
          position: absolute;
          bottom: -10%;
          right: -10%;
          width: 50%;
          height: 50%;
          background: #7c3aed;
          border-radius: 50%;
        }

        .auth-card-wrapper {
          width: 100%;
          max-width: 480px;
          position: relative;
          z-index: 1;
        }

        .auth-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .auth-logo {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .logo-img {
          height: 36px;
          width: 36px;
          object-fit: cover;
          border-radius: 50%;
          border: 1px solid var(--border);
        }

        .logo-text {
          font-weight: 800;
          letter-spacing: 2px;
          font-size: 1.25rem;
          color: var(--text-main);
        }

        .lang-toggle {
          background: var(--card);
          padding: 6px 14px;
          font-size: 0.85rem;
          border: 1px solid var(--border);
          color: var(--text-main);
          border-radius: 20px;
        }

        .auth-content {
          padding: 40px;
          border-radius: 24px;
        }

        .auth-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 8px;
          color: var(--text-main);
          text-align: center;
        }

        .auth-subtitle {
          color: var(--text-muted);
          text-align: center;
          margin-bottom: 32px;
          font-size: 0.95rem;
        }

        .auth-footer {
          margin-top: 24px;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        @media (max-width: 480px) {
          .auth-content {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
