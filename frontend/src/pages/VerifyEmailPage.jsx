import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  // React 18 StrictMode dev'de effect'i iki kez çalıştırır; token tek kullanımlık
  // olduğu için doğrulamayı yalnızca bir kez tetikleriz.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token) {
      setStatus('error');
      return;
    }

    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (cancelled) return;
        setStatus('success');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token, verifyEmail, navigate]);

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-4 p-7 bg-white rounded-2xl shadow-card text-center">
        {status === 'verifying' && (
          <>
            <div className="mx-auto w-10 h-10 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <h1 className="text-lg font-semibold text-gray-900">{t('auth.verifyingTitle')}</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-2xl">
              ✅
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{t('auth.verifySuccessTitle')}</h1>
            <p className="text-sm text-gray-500">{t('auth.verifySuccessBody')}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-semibold text-gray-900">{t('auth.verifyErrorTitle')}</h1>
            <p className="text-sm text-gray-500">{t('auth.verifyErrorBody')}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/kayit"
                className="w-full bg-brand-600 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-brand-700 transition"
              >
                {t('auth.registerButton')}
              </Link>
              <Link to="/" className="text-sm text-brand-600 hover:underline">
                {t('auth.goHome')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
