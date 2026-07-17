import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LinkedInLoginButton from '../components/LinkedInLoginButton';
import GoogleLoginButton from '../components/GoogleLoginButton';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Kayıt başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3 p-7 bg-white rounded-2xl shadow-card">
        <h1 className="text-xl font-semibold text-gray-900">Kayıt Ol</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          type="text"
          placeholder="Ad Soyad"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="E-posta"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Şifre (en az 8 karakter)"
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
          {submitting ? 'Kaydediliyor...' : 'Kayıt Ol'}
        </button>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="h-px flex-1 bg-gray-200" />
          veya
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <LinkedInLoginButton />
        <GoogleLoginButton />
        <p className="text-sm text-gray-500 text-center">
          Zaten hesabın var mı?{' '}
          <Link to="/giris" className="text-brand-600 hover:underline">
            Giriş yap
          </Link>
        </p>
      </form>
    </div>
  );
}
