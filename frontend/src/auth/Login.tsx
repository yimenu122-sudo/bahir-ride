import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(identifier, password);
      login(response.user, response.token);
      
      // Redirect based on role (Role-Aware Login)
      const role = response.user.role;
      if (role === 'SUPER_ADMIN') navigate('/super-admin/SuperAdminDashboard');
      else if (role === 'ADMIN') navigate('/admin/AdminDashboard');
      else if (role === 'SUPPORT') navigate('/support/SupportDashboard');
      else if (role === 'FLEET') navigate('/fleet/FleetDashboard');
      else if (role === 'DISPATCHER') navigate('/dispatcher/DispatcherDashboard');
      else navigate('/dashboard');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response: { data: { message: string } } };
        setError(axiosError.response?.data?.message || t('auth.login_failed'));
      } else {
        setError(t('auth.login_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={t('auth.login_title')} 
      subtitle={t('auth.login_subtitle')}
    >
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

        <div className="input-group">
          <div className="label-row">
            <label htmlFor="password">{t('auth.password')}</label>
            <Link to="/auth/forgot-password">{t('auth.forgot_password')}</Link>
          </div>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
              {t('auth.signing_in')}
            </span>
          ) : (
            t('auth.sign_in')
          )}
        </button>

        {/* <div className="auth-helper-text">
          <p>
            {t('auth.no_account')}{' '}
            <Link to="/auth/super-admin/register">{t('auth.setup_system')}</Link>
          </p>
        </div> */}
      </form>

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

        .toggle-password {
          position: absolute;
          right: 12px;
          background: none;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
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

export default Login;
