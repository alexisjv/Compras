import { createContext, useContext, useState, useCallback } from 'react';
import { registerUser, loginUser } from '../lib/storage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem('eventify_user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (email, password) => {
    const { user: u, token } = loginUser(email, password);
    localStorage.setItem('eventify_user', JSON.stringify(u));
    localStorage.setItem('eventify_token', token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (formData) => {
    const { user: u, token } = registerUser(formData);
    localStorage.setItem('eventify_user', JSON.stringify(u));
    localStorage.setItem('eventify_token', token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('eventify_user');
    localStorage.removeItem('eventify_token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
