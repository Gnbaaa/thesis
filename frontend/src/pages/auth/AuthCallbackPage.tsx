import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Hash: #accessToken=...&refreshToken=... — эхний `=`-аар таслана (JWT доторх `=` хадгалагдана). */
function parseOAuthHash(hash: string): { accessToken: string | null; refreshToken: string | null } {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  for (const part of raw.split('&')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === 'accessToken') {
      try {
        accessToken = decodeURIComponent(value);
      } catch {
        accessToken = value;
      }
    }
    if (key === 'refreshToken') {
      try {
        refreshToken = decodeURIComponent(value);
      } catch {
        refreshToken = value;
      }
    }
  }
  return { accessToken, refreshToken };
}

export default function AuthCallbackPage() {
  const { t } = useTranslation();

  // Ихэнх тохиолдолд index.html inline script аль хэдийн шилжүүлсэн. Энд: SPA / hash үлдсэн fallback.
  useLayoutEffect(() => {
    const { accessToken, refreshToken } = parseOAuthHash(window.location.hash);
    const origin = window.location.origin;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    if (accessToken) {
      window.location.replace(`${origin}/pets`);
    } else {
      window.location.replace(`${origin}/login?error=google`);
    }
  }, []);

  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <p className="text-sm text-text-muted">{t('common.loading')}</p>
    </div>
  );
}
