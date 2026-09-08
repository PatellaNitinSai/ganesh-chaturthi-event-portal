import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('gcp_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('gcp_token', res.data.token);
      localStorage.setItem('gcp_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      return true;
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gcp_token');
    localStorage.removeItem('gcp_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
