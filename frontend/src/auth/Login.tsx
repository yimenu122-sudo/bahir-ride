import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth.store';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = () => {
    // Mock login
    login({
      id: '1',
      name: 'Admin User',
      email: 'admin@abhir.com',
      role: 'ADMIN'
    }, 'mock-token');
    navigate('/dashboard/admin');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en');
  };

  return (
    <div className="login-container" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      gap: '1rem' 
    }}>
      <div className="card animate-fade-in" style={{ width: '400px' }}>
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Abhir Ride</h1>
        <button 
          className="gradient-bg" 
          style={{ width: '100%', padding: '0.75rem', color: 'white' }}
          onClick={handleLogin}
        >
          {t('common.login')}
        </button>
        <button 
          style={{ width: '100%', marginTop: '0.5rem', background: 'transparent', border: '1px solid var(--border)' }}
          onClick={toggleLanguage}
        >
          {i18n.language === 'en' ? 'አማርኛ' : 'English'}
        </button>
      </div>
    </div>
  );
};

export default Login;
