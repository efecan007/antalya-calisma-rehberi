import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('wfh_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await apiClient.get('/auth/me');
      setUser(data);
    } catch (err) {
      localStorage.removeItem('wfh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function login(email, password) {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('wfh_token', data.token);
    setUser(data.user);
  }

  // Kayıt artık hesabı hemen oluşturmaz: e-posta doğrulaması gerekiyorsa
  // { pendingVerification: true, email } döner ve oturum AÇILMAZ. (OAuth ile açılmış
  // şifresiz bir hesaba şifre eklendiği durumda ise token döner ve oturum açılır.)
  async function register(email, password, name, companyName) {
    const { data } = await apiClient.post('/auth/register', { email, password, name, companyName });
    if (data.token) {
      localStorage.setItem('wfh_token', data.token);
      setUser(data.user);
    }
    return data;
  }

  // E-posta doğrulama linkindeki token ile hesabı oluşturur ve oturum açar.
  async function verifyEmail(token) {
    const { data } = await apiClient.post('/auth/verify-email', { token });
    localStorage.setItem('wfh_token', data.token);
    setUser(data.user);
    return data;
  }

  async function resendVerification(email) {
    await apiClient.post('/auth/resend-verification', { email });
  }

  // İstemci Firebase'e giriş yaptıktan sonra elde ettiği kimlik jetonunu backend'e
  // gönderir; backend jetonu doğrulayıp uygulamanın kendi JWT'sini döner.
  async function loginWithFirebase(idToken) {
    const { data } = await apiClient.post('/auth/firebase', { idToken });
    localStorage.setItem('wfh_token', data.token);
    setUser(data.user);
  }

  async function updateAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.patch('/auth/me/avatar', formData);
    setUser(data);
  }

  async function removeAvatar() {
    const { data } = await apiClient.delete('/auth/me/avatar');
    setUser(data);
  }

  async function logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // JWT stateless olduğu için bu çağrı yalnızca API sözleşmesini tamamlar;
      // başarısız olsa da istemci token'ı yine de bırakır.
    }
    localStorage.removeItem('wfh_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendVerification,
        loginWithFirebase,
        logout,
        updateAvatar,
        removeAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
