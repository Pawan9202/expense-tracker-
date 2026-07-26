import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService.js';
import api from '../services/api.js';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('cached_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [isOnlineCheck, setIsOnlineCheck] = useState(false);

  const validateToken = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.getProfile();
      setUser(userData);
      localStorage.setItem('cached_user', JSON.stringify(userData));
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('cached_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoading(false);
      if (!isOnlineCheck) {
        setIsOnlineCheck(true);
        validateToken();
      }
    } else {
      validateToken();
    }
  }, [user, validateToken, isOnlineCheck]);

  const login = async (username, password) => {
    try {
      const data = await authService.login(username, password);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('cached_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      const details = error.response?.data?.details;
      const msgs = details ? details.map(d => d.message).join(', ') : null;
      const errorMessage = msgs || error.response?.data?.message || error.response?.data?.error || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, email, password) => {
    try {
      const data = await authService.register(username, email, password);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('cached_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (error) {
      const details = error.response?.data?.details;
      const msgs = details ? details.map(d => d.message).join(', ') : null;
      const errorMessage = msgs || error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('cached_user');
    delete api.defaults.headers.common['Authorization'];
  };

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await authService.updateProfile(updates);
      setUser(updatedUser);
      localStorage.setItem('cached_user', JSON.stringify(updatedUser));
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const data = await authService.changePassword(currentPassword, newPassword);
      return { success: true, message: data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      return { success: false, error: errorMessage };
    }
  };

  const deleteAccount = async () => {
    try {
      const data = await authService.deleteAccount();
      logout();
      return { success: true, message: data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Account deletion failed';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
