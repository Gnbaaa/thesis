export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';

export function getStoredTheme(): AppTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: AppTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
  applyTheme(theme);
}

export function initTheme(): AppTheme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

export function toggleTheme(): AppTheme {
  const next: AppTheme = getStoredTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}
