import { useLayoutEffect, useState } from 'react';

const AUTH_EVENT = 'pet-platform-auth';

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
    window.addEventListener(AUTH_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(AUTH_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return loggedIn;
}

/** Нэг таб доторх нэвтрэлт/гарахын дараа навбар зэргийг шинэчлэнэ. */
export function notifyAuthSessionChanged(): void {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthSession(): void {
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
