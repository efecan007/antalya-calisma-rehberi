import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LinkedInCallbackPage() {
  const { loginWithFirebase } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const customToken = searchParams.get('customToken');
    if (!customToken) {
      setError(t('auth.linkedinFailed'));
      return;
    }

    // Backend'den gelen custom token ile Firebase'e giriş yap, ardından elde edilen
    // kimlik jetonunu backend'e doğrulatıp uygulama oturumunu aç.
    signInWithCustomToken(auth, customToken)
      .then((result) => result.user.getIdToken())
      .then((idToken) => loginWithFirebase(idToken))
      .then(() => navigate('/'))
      .catch((err) => {
        // Geçici teşhis: gerçek hata kodunu/mesajını ekrana yaz ki sebebi görelim.
        const detail = err?.code || err?.message || 'bilinmeyen hata';
        setError(`${t('auth.linkedinFailed')} (${detail})`);
        console.error('LinkedIn callback hatası:', err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loginWithFirebase, navigate]);

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-500">{t('auth.googleLoggingIn')}</p>
        )}
      </div>
    </div>
  );
}
