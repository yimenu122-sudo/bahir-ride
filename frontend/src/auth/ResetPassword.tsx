import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle2, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authService } from '../services/auth.service';

const ResetPassword: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier;
  const code = location.state?.code || location.state?.token; // Handle both
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const strengthValue = passwordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.error_password_mismatch'));
      return;
    }

    if (strengthValue < 75) {
      setError(t('auth.weak_password'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.resetPassword({ identifier, code, new_password: password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data: { message: string } } };
        setError(axiosError.response?.data?.message || t('auth.reset_failed_expired'));
      } else {
        setError(t('auth.reset_failed_expired'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('auth.reset_title')} 
      subtitle={t('auth.reset_subtitle')}
    >
      {!success ? (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <div className={`input-wrapper ${password ? 'active' : ''}`}>
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="strength-bar-container">
              <div 
                className={`strength-bar ${strengthValue < 50 ? 'weak' : strengthValue < 100 ? 'medium' : 'strong'}`}
                style={{ width: `${strengthValue}%` }}
              ></div>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
            <div className={`input-wrapper ${confirmPassword ? 'active' : ''}`}>
              <ShieldCheck size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error-message animate-fade-in flex-center gap-8">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="password-submit-btn" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex-center gap-8">
                <Loader2 size={20} className="animate-spin" />
                {t('auth.update_password')}
              </span>
            ) : (
              <span className="flex-center gap-8">
                {t('auth.update_password')}
                <CheckCircle2 size={20} className="btn-icon-hover" />
              </span>
            )}
          </button>
        </form>
      ) : (
        <div className="success-message animate-fade-in text-center">
          <div className="success-icon-wrapper large">
            <CheckCircle2 size={48} className="success-icon" />
          </div>
          <h3>{t('auth.password_updated')}</h3>
          <p>{t('auth.password_updated_redirect')}</p>
        </div>
      )}

      <style>{`
         .auth-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
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
          margin-left: 2px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          transition: all 0.3s ease;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          transition: color 0.3s ease;
          z-index: 10;
        }

        .input-wrapper input {
          width: 100%;
          padding: 14px 44px 14px 44px; /* Increased padding for icons */
          border-radius: 12px;
          border: 2px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
          outline: none;
        }

        /* Focus State Styling */
        .input-wrapper input:focus,
        .input-wrapper.active input {
          border-color: var(--primary);
          background: var(--background-elevated, #fff);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.08); /* Glow effect */
        }

        .input-wrapper input:focus ~ .input-icon {
          color: var(--primary);
        }

        /* Password Toggle Button */
        .password-toggle {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .password-toggle:hover {
          color: var(--text-main);
          background-color: rgba(0,0,0,0.05);
        }

        .auth-error-message {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--error);
          padding: 14px;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .strength-bar-container {
          height: 6px;
          background: var(--border);
          border-radius: 4px;
          margin-top: 10px;
          overflow: hidden;
          position: relative;
        }

        .strength-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.4s ease, background-color 0.4s ease;
        }

        .strength-bar.weak { background: var(--error); box-shadow: 0 0 8px var(--error); }
        .strength-bar.medium { background: var(--warning, #f59e0b); }
        .strength-bar.strong { background: var(--success); box-shadow: 0 0 8px var(--success); }

        .success-message {
          text-align: center;
        }

        .success-icon-wrapper.large {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(34, 197, 94, 0.1);
          border-radius: 50%;
          color: var(--success);
        }

        .success-icon {
          color: var(--success);
        }

        .success-icon {
          color: var(--success);
        }

        /* Advanced Button Styling */
        .password-submit-btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #1d4ed8) 100%);
          color: white;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          position: relative;
          overflow: hidden;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .password-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
          background: linear-gradient(135deg, var(--primary-light, #3b82f6) 0%, var(--primary) 100%);
        }

        .password-submit-btn:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        }

        .password-submit-btn:disabled {
          background: var(--text-muted);
          cursor: not-allowed;
          opacity: 0.7;
          box-shadow: none;
          transform: none;
        }
        
        .btn-icon-hover {
          width: 0;
          opacity: 0;
          transition: all 0.3s ease;
          margin-left: 0;
        }

        .password-submit-btn:hover .btn-icon-hover {
          width: 20px;
          opacity: 1;
          margin-left: 8px;
        }

        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gap-8 { gap: 8px; }
      `}</style>
    </AuthLayout>
  );
};

export default ResetPassword;
