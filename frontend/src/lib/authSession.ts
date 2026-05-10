import { useLayoutEffect, useState } from 'react';
import { getChatSocket } from '@/features/chat/chatSocket';

/** Навбар, чат зэрэг session өөрчлөгдсөнийг ажиглахад ашиглана. */
export const PET_PLATFORM_AUTH_EVENT = 'pet-platform-auth';

const LOGIN_FREE_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback'];

let sessionExpiryTimerId: number | null = null;

function clearSessionExpiryTimer(): void {
  if (typeof window === 'undefined') return;
  if (sessionExpiryTimerId !== null) {
    window.clearTimeout(sessionExpiryTimerId);
    sessionExpiryTimerId = null;
  }
}

function getJwtExpiryMs(token: string | null): number | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

/** Refresh token-ийн дуусах цагт session цэвэрлэх (нэг таб). */
export function scheduleRefreshTokenExpiryLogout(): void {
  clearSessionExpiryTimer();
  if (typeof window === 'undefined') return;
  try {
    const rt = localStorage.getItem('refreshToken');
    if (!rt) return;
    const expMs = getJwtExpiryMs(rt);
    if (expMs == null) return;
    const delay = expMs - Date.now();
    if (delay <= 0) {
      clearAuthSession();
      redirectToLoginIfSessionEnded('session_expired');
      return;
    }
    sessionExpiryTimerId = window.setTimeout(() => {
      sessionExpiryTimerId = null;
      clearAuthSession();
      redirectToLoginIfSessionEnded('session_expired');
    }, delay);
  } catch {
    /* ignore */
  }
}

export function redirectToLoginIfSessionEnded(reason: 'session_expired' | 'session_invalid'): void {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (LOGIN_FREE_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return;
  }
  window.location.assign(`/login?reason=${reason}`);
}

let authListenersInstalled = false;

export function initAuthSessionListeners(): void {
  if (typeof window === 'undefined' || authListenersInstalled) return;
  authListenersInstalled = true;
  scheduleRefreshTokenExpiryLogout();
  window.addEventListener('storage', () => {
    scheduleRefreshTokenExpiryLogout();
  });
}

function readHasAccessToken(): boolean {
  try {
    return Boolean(localStorage.getItem('accessToken'));
  } catch {
    return false;
  }
}

export function useIsLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(readHasAccessToken);

  useLayoutEffect(() => {
    const onChange = () => setLoggedIn(readHasAccessToken());
    window.addEventListener(PET_PLATFORM_AUTH_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(PET_PLATFORM_AUTH_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return loggedIn;
}

/** Нэг таб доторх нэвтрэлт/гарахын дараа навбар зэргийг шинэчлэнэ. */
export function notifyAuthSessionChanged(): void {
  window.dispatchEvent(new Event(PET_PLATFORM_AUTH_EVENT));
  scheduleRefreshTokenExpiryLogout();
}

export function clearAuthSession(): void {
  clearSessionExpiryTimer();
  try {
    getChatSocket().disconnect();
  } catch {
    /* ignore */
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  notifyAuthSessionChanged();
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Access token дахь `picture` (Google profile image URL). Зөвхөн UI. */
export function getAuthPictureUrl(): string | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    const pic = payload?.picture;
    return typeof pic === 'string' && pic.length > 0 ? pic : null;
  } catch {
    return null;
  }
}

export function getAuthRole(): string | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    const role = payload?.role;
    return typeof role === 'string' && role.length > 0 ? role : null;
  } catch {
    return null;
  }
}

export function getAuthUserId(): string | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    const payload = decodeJwtPayload(token);
    const sub = payload?.sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}
