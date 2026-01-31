import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { AxiosError } from 'axios';
import { KeyRound, RefreshCcw, Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authService } from '../services/auth.service';

interface ApiErrorResponse {
  message?: string;
  errors?: { message: string }[];
}

const Verify: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const identifier = location.state?.identifier || localStorage.getItem('pending_verify_id');
  const verificationType = location.state?.type || 'registration';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);

  useEffect(() => {
    if (!identifier) {
      navigate('/login');
      return;
    }
    
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [identifier, navigate]);

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Auto-focus next input
    if (element.value !== '' && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevElement = (e.currentTarget.previousElementSibling as HTMLInputElement);
      if (prevElement) prevElement.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError(t('auth.error_otp_invalid'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (verificationType === 'password_reset') {
        // Verify OTP without consuming it (peek)
        await authService.verifyResetOtp(identifier, otpString);
        // Navigate to Reset Password page with code
        navigate('/auth/reset-password', { state: { identifier, code: otpString } });
      } else {
        await authService.verifyAccount(identifier, otpString);
        // Success - Redirect to login
        navigate('/login', { state: { message: t('auth.verify_success') } });
      }
    } catch (error: unknown) {
      const err = error as AxiosError<ApiErrorResponse | string>;
      let errorMessage = t('auth.verify_failed');

      if (err.response) {
        const data = err.response.data;
        if (typeof data === 'string') {
           errorMessage = data;
        } else if (typeof data !== 'string' && data.errors && Array.isArray(data.errors)) {
           errorMessage = data.errors.map((e) => e.message).join(', ');
        } else if (typeof data !== 'string' && data.message) {
           errorMessage = data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setResending(true);
    setError(null);

    try {
      await authService.resendOtp(identifier, verificationType);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
    } catch (error: unknown) {
      const err = error as AxiosError<ApiErrorResponse | string>;
      let errorMessage = t('auth.resend_failed');

      if (err.response) {
        const data = err.response.data;
        if (typeof data === 'string') {
           errorMessage = data;
        } else if (typeof data !== 'string' && data.errors && Array.isArray(data.errors)) {
           errorMessage = data.errors.map((e) => e.message).join(', ');
        } else if (typeof data !== 'string' && data.message) {
           errorMessage = data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout 
      title={t('auth.verify_title')} 
      subtitle={t('auth.verify_subtitle')}
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="otp-container">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={data}
              onChange={(e) => handleOtpChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={(e) => e.target.select()}
              className="otp-input"
              required
            />
          ))}
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
              {t('auth.verify')}
            </span>
          ) : (
            <span className="flex-center gap-8">
              <KeyRound size={18} />
              {t('auth.verify')}
            </span>
          )}
        </button>

        <div className="resend-container">
          <button 
            type="button" 
            onClick={handleResend} 
            disabled={timer > 0 || resending}
            className="resend-btn"
          >
            {resending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCcw size={14} />
            )}
            {t('auth.resend_otp')} {timer > 0 ? `(${timer}s)` : ''}
          </button>
        </div>
      </form>

      <style>{`
        .otp-container {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 24px;
        }

        .otp-input {
          width: 48px;
          height: 56px;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          border-radius: 12px;
          border: 2px solid var(--border);
          background: var(--background);
          color: var(--text-main);
          transition: all 0.2s;
        }

        .otp-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          transform: translateY(-2px);
        }

        .resend-container {
          margin-top: 24px;
          text-align: center;
        }

        .resend-btn {
          background: none;
          color: var(--primary);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin: 0 auto;
        }

        .resend-btn:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AuthLayout>
  );
};

export default Verify;
