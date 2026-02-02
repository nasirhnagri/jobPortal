import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Fallback so API is never "undefined/api" (e.g. if .env is missing)
const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${API_BASE.replace(/\/$/, '')}/api`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        throw new Error('Cannot connect to server. Make sure the backend is running at http://localhost:8000.');
      }
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        const msg = Array.isArray(detail) ? detail.map((d) => d.msg || d).join(', ') : String(detail);
        throw new Error(msg);
      }
      throw new Error(err.message || 'Login failed.');
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password, role });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      return userData;
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        throw new Error('Cannot connect to server. Make sure the backend is running at http://localhost:8000.');
      }
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        const msg = Array.isArray(detail) ? detail.map((d) => d.msg || d).join(', ') : String(detail);
        throw new Error(msg);
      }
      throw new Error(err.message || 'Registration failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
