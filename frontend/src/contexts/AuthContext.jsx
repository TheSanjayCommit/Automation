import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('niat_token') || null);
  const [role,  setRole]    = useState(() => localStorage.getItem('niat_role')  || null);
  const [user,  setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('niat_user') || 'null'); } catch { return null; }
  });

  const login = useCallback((newToken, newRole, userData) => {
    localStorage.setItem('niat_token', newToken);
    localStorage.setItem('niat_role',  newRole);
    localStorage.setItem('niat_user',  JSON.stringify(userData || null));
    setToken(newToken);
    setRole(newRole);
    setUser(userData || null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('niat_token');
    localStorage.removeItem('niat_role');
    localStorage.removeItem('niat_user');
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, isAdmin: role === 'admin', isStudent: role === 'student' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
