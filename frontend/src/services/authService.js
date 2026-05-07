// Auth service — login, logout, and session helpers using sessionStorage.
import api from './api';

const TOKEN_KEY = 'adminToken';
const USER_KEY = 'adminUser';

// Authenticates the user and persists the token and profile to sessionStorage.
export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  if (res.data.success) {
    sessionStorage.setItem(TOKEN_KEY, res.data.data.token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(res.data.data.user));
  }
  return res.data;
};

// Clears session data and redirects to the login page.
export const logout = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  window.location.href = '/login';
};

// Returns the stored user object, or null if not available.
export const getStoredUser = () => {
  try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; }
};

// Returns true if a token exists in sessionStorage.
export const isAuthenticated = () => !!sessionStorage.getItem(TOKEN_KEY);
