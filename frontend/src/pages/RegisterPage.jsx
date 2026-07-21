import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LinkedInLoginButton from '../components/LinkedInLoginButton';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register(email, password, name, companyName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registerError'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 p-7 bg-white rounded-2xl shadow-card">
        <h1 className="text-xl font-semibold text-gray-900">{t('auth.registerTitle')}</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          type="text"
          placeholder={t('auth.name')}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder={t('auth.companyName')}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
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
          placeholder={t('auth.passwordMin')}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition disabled:opacity-50"
        >
          {submitting ? t('auth.registering') : t('auth.registerButton')}
        </button>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          {t('auth.or')}
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <LinkedInLoginButton />
        <GoogleLoginButton />
        <p className="text-sm text-gray-500 text-center">
          {t('auth.haveAccount')}{' '}
          <Link to="/giris" className="text-brand-600 hover:underline">
            {t('auth.goLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}
