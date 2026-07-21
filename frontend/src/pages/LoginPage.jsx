import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LinkedInLoginButton from '../components/LinkedInLoginButton';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 p-7 bg-white rounded-2xl shadow-card">
        <h1 className="text-xl font-semibold text-gray-900">{t('auth.loginTitle')}</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          type="email"
          placeholder={t('auth.email')}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {submitting ? t('auth.loggingIn') : t('auth.loginButton')}
        </button>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          {t('auth.or')}
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <LinkedInLoginButton />
        <GoogleLoginButton />
        <p className="text-sm text-gray-500 text-center">
          {t('auth.noAccount')}{' '}
          <Link to="/kayit" className="text-brand-600 hover:underline">
            {t('auth.goRegister')}
          </Link>
        </p>
      </form>
    </div>
  );
}
