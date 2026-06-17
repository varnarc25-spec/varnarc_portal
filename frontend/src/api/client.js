import axios from 'axios';

const useBff = import.meta.env.VITE_USE_PORTAL_BFF === 'true';
const baseURL = useBff
  ? ''
  : (import.meta.env.VITE_MARG_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const api = axios.create({
  baseURL: useBff ? '/api/payments' : `${baseURL}/api/payment`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('varnarc_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Request failed';
    return Promise.reject(new Error(message));
  },
);

export default api;
