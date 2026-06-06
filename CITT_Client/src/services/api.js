import axios from 'axios';

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
// Normalize: trim trailing slashes and optional `/api` suffix so we can safely prefix routes.
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '').replace(/\/api$/, '');
const API_PREFIX = '/api';

const isAbsoluteUrl = (url) => {
  return typeof url === 'string' && (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//'));
};

const normalizeApiPath = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (isAbsoluteUrl(url)) return url;

  const withLeadingSlash = url.startsWith('/') ? url : `/${url}`;
  if (withLeadingSlash === API_PREFIX || withLeadingSlash.startsWith(`${API_PREFIX}/`)) {
    return withLeadingSlash;
  }
  return `${API_PREFIX}${withLeadingSlash}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to normalize URLs and include JWT token
api.interceptors.request.use((config) => {
  config.url = normalizeApiPath(config.url);

  const token = localStorage.getItem('authToken');
  const hasAuthHeader = Boolean(config.headers?.Authorization || config.headers?.authorization);

  if (token && !hasAuthHeader) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Silent refresh: queue-based, one-at-a-time token refresh on 401
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  refreshQueue = [];
};

function doLogout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userProfile');
  if (typeof window !== 'undefined' && window.location?.pathname !== '/login') {
    window.location.href = '/login';
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.code;
    const isAuthError = status === 401 || code === 'TOKEN_EXPIRED' || (status === 403 && code === 'INVALID_TOKEN');

    // Don't try to refresh the refresh endpoint itself or the login endpoint
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login')
      || originalRequest.url?.includes('/api/auth/refresh')
      || originalRequest.url?.includes('/api/auth/register');

    if (isAuthError && !originalRequest._retry && !isAuthEndpoint) {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) { doLogout(); return Promise.reject(error); }

      if (isRefreshing) {
        return new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }))
          .then(token => { originalRequest.headers.Authorization = `Bearer ${token}`; return api(originalRequest); });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken: storedRefreshToken });
        const newAccess = resp.data.accessToken;
        const newRefresh = resp.data.refreshToken;
        localStorage.setItem('authToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        doLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// User API functions
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post('/users', userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Authentication endpoints
export const registerWithServer = async (name, email, password) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginWithServer = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUserProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Search API function
export const searchGlobal = async (keyword) => {
  const response = await api.get('/search', {
    params: { keyword }
  });
  return response.data;
};

export default api;
