import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Send, ArrowLeft, Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authService } from '../services/auth.service';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.requestPasswordReset(identifier);
      setSuccess(true);
      // After a delay, navigate to verify
      setTimeout(() => {
        navigate('/auth/verify', { state: { identifier, type: 'password_reset' } });
      }, 2000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data: { message: string } } };
        setError(axiosError.response?.data?.message || t('auth.generic_error'));
      } else {
        setError(t('auth.generic_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('auth.forgot_title')} 
      subtitle={t('auth.forgot_subtitle')}
    >
      {!success ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="identifier">{t('auth.email_phone')}</label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" />
              <input
                id="identifier"
                type="text"
                placeholder={t('auth.placeholder_email_example')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="auth-error-message animate-fade-in">{error}</div>}

          <button 
            type="submit" 
            className="btn-primary w-full" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex-center gap-8">
                <Loader2 size={18} className="animate-spin" />
                {t('auth.send_code')}
              </span>
            ) : (
              <span className="flex-center gap-8">
                <Send size={18} />
                {t('auth.send_code')}
              </span>
            )}
          </button>

          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            {t('auth.back_to_login')}
          </Link>
        </form>
      ) : (
        <div className="success-message animate-fade-in text-center">
          <div className="success-icon-wrapper">
            <Send size={32} className="success-icon" />
          </div>
          <h3>{t('auth.check_inbox')}</h3>
          <p>{t('auth.sent_recovery_code')} <strong>{identifier}</strong></p>
          <div className="loading-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      )}

      <style>{`
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-main);
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-row a {
          font-size: 0.85rem;
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .input-wrapper input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
        }
          
        .auth-error-message {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          border-left: 4px solid var(--error);
        }

        .w-full {
          width: 100%;
          padding: 14px;
        }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gap-8 {
          gap: 8px;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        .auth-helper-text {
          margin-top: 16px;
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .auth-helper-text a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AuthLayout>
  );
};

export default ForgotPassword;
