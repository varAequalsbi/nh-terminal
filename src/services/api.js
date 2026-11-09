// src/services/api.js
import axios from 'axios';
import { env } from '../config/env';
import { clearSession } from '../auth/session';

const API_BASE_URL = env.apiUrl || '/api';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 30000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vercel preview deployments can show the client the product before a hosted
// database exists. This adapter is enabled only by an explicit preview setting.
if (import.meta.env.VITE_DEMO_PREVIEW === 'true') {
  api.defaults.adapter = async (config) => {
    const { previewAdapter } = await import('../demo/previewAdapter');
    return previewAdapter(config);
  };
}

const readBrowserCookie = (name) => {
  if (typeof document === 'undefined') return null;
  for (const part of document.cookie.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
};

api.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = readBrowserCookie('nh_csrf');
    if (csrfToken) config.headers.set('X-CSRF-Token', csrfToken);
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestPath = String(error.config?.url || '');
    const isAuthAttempt = ['/auth/login', '/auth/register'].some((path) =>
      requestPath.endsWith(path)
    );
    const isAuthPage = ['/login', '/signup'].includes(window.location.pathname);

    if (error.response?.status === 401 && !isAuthAttempt && !isAuthPage) {
      // The server owns the HTTP-only session cookie.
      clearSession();
      const intended = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?from=${encodeURIComponent(intended)}`);
    }

    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }

    if (error.response?.status === 500) {
      console.error('Server error');
    }

    return Promise.reject(error);
  }
);

export default api;

// Utility functions
export const handleApiError = (error) => {
  const message = error.response?.data?.message || error.message || 'An error occurred';
  return {
    message,
    status: error.response?.status,
    data: error.response?.data,
  };
};

export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};
