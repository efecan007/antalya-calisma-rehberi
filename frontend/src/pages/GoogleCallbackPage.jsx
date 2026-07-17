import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallbackPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setError('Google ile giriş başarısız oldu');
      return;
    }

    loginWithToken(token)
      .then(() => navigate('/'))
      .catch(() => setError('Google ile giriş başarısız oldu'));
  }, [searchParams, loginWithToken, navigate]);

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
