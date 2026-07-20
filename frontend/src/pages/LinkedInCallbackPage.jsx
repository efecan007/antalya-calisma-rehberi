import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export default function LinkedInCallbackPage() {
  const { loginWithFirebase } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const customToken = searchParams.get('customToken');
    if (!customToken) {
      setError('LinkedIn ile giriş başarısız oldu');
      return;
    }

    // Backend'den gelen custom token ile Firebase'e giriş yap, ardından elde edilen
    // kimlik jetonunu backend'e doğrulatıp uygulama oturumunu aç.
    signInWithCustomToken(auth, customToken)
      .then((result) => result.user.getIdToken())
      .then((idToken) => loginWithFirebase(idToken))
      .then(() => navigate('/'))
      .catch(() => setError('LinkedIn ile giriş başarısız oldu'));
  }, [searchParams, loginWithFirebase, navigate]);

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-500">Giriş yapılıyor...</p>
        )}
      </div>
    </div>
  );
}
