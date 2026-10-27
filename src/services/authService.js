// src/services/authService.js
import api from './api';

export const authService = {
  login: async (email, password, turnstileToken) => {
    const response = await api.post('/auth/login', { email, password, turnstileToken });
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (email, turnstileToken) => {
    const response = await api.post('/auth/resend-verification', { email, turnstileToken });
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  forgotPassword: async (email, turnstileToken) => {
    const response = await api.post('/auth/forgot-password', { email, turnstileToken });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  revokeOtherSessions: async () => {
    const response = await api.delete('/auth/sessions/others');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put('/auth/preferences', preferences);
    return response.data;
  },

  updatePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
};
