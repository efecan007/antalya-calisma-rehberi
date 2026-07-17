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

  async function register(email, password, name, companyName) {
    const { data } = await apiClient.post('/auth/register', { email, password, name, companyName });
    localStorage.setItem('wfh_token', data.token);
    setUser(data.user);
  }

  async function loginWithToken(token) {
    localStorage.setItem('wfh_token', token);
    const { data } = await apiClient.get('/auth/me');
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
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
