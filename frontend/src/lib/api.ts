import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import {
  clearAuthSession,
  notifyAuthSessionChanged,
  redirectToLoginIfSessionEnded,
} from '@/lib/authSession';

const baseURL = process.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const rt = localStorage.getItem('refreshToken');
      if (!rt) return false;
      try {
        const normalized = baseURL.replace(/\/$/, '');
        const url = `${normalized}/api/v1/auth/refresh`;
        const { data } = await axios.post<{ accessToken?: string; refreshToken?: string }>(
          url,
          { refreshToken: rt },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          },
        );
        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (!data.accessToken) {
          return false;
        }
        notifyAuthSessionChanged();
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function shouldSkipRefreshRetry(config: InternalAxiosRequestConfig): boolean {
  const path = `${config.baseURL ?? ''}${config.url ?? ''}`;
  return (
    path.includes('/api/v1/auth/login') ||
    path.includes('/api/v1/auth/register') ||
    path.includes('/api/v1/auth/refresh') ||
    path.includes('/api/v1/auth/forgot-password') ||
    path.includes('/api/v1/auth/reset-password')
  );
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry || shouldSkipRefreshRetry(original)) {
      return Promise.reject(error);
    }

    original._retry = true;
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearAuthSession();
      redirectToLoginIfSessionEnded('session_invalid');
      return Promise.reject(error);
    }

    const token = localStorage.getItem('accessToken');
    if (token) {
      original.headers.Authorization = `Bearer ${token}`;
    }

    return api(original);
  },
);
