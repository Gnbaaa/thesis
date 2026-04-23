import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';
import { clearAuthSession, getAuthPictureUrl, useIsLoggedIn } from '@/lib/authSession';

const iconStroke = 1.75;

function navCircleClassName(isActive?: boolean) {
  return cn(
    'flex size-9 shrink-0 items-center justify-center rounded-full border border-border-card bg-surface-hover text-text-muted transition-colors',
    isActive && 'ring-1 ring-text-heading/15 dark:ring-white/20',
  );
}

export function AppNavbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = useIsLoggedIn();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const profileImageUrl = loggedIn ? getAuthPictureUrl() : null;
  const [avatarFailedUrl, setAvatarFailedUrl] = useState<string | null>(null);
  const showProfilePhoto =
    Boolean(profileImageUrl) && avatarFailedUrl !== profileImageUrl;

  useEffect(() => {
    if (!profileOpen) return;
    const close = (e: MouseEvent) => {
      if (profileWrapRef.current && !profileWrapRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const centerLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'whitespace-nowrap rounded-md px-1 py-1.5 text-sm transition-colors',
      isActive ? 'font-semibold text-text-heading' : 'font-normal text-secondary-fg hover:text-text-heading',
    );

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border-card bg-surface">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 md:px-8 lg:px-20">
        <Link
          to="/"
          className={cn('shrink-0 text-xl font-bold tracking-tight text-text-heading', focusRing, 'rounded-sm')}
        >
          {t('auth.logo')}
        </Link>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-4 sm:gap-6 md:gap-7"
          aria-label="Main"
        >
          <NavLink to="/pets" className={centerLinkClass} end>
            {t('auth.nav.pets')}
          </NavLink>
          <NavLink to="/volunteer" className={centerLinkClass}>
            {t('auth.nav.volunteer')}
          </NavLink>
          <NavLink to="/donations" className={centerLinkClass}>
            {t('auth.nav.donations')}
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          {loggedIn ? (
            <>
              <NavLink
                to="/chat"
                className={({ isActive }) => cn(navCircleClassName(isActive), focusRing)}
                aria-label={t('auth.nav.chat')}
                title={t('auth.nav.chat')}
              >
                <MessageCircle className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) => cn(navCircleClassName(isActive), focusRing)}
                aria-label={t('auth.nav.notifications')}
                title={t('auth.nav.notifications')}
              >
                <Bell className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
              </NavLink>
              <div className="relative" ref={profileWrapRef}>
                <button
                  type="button"
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-card bg-surface-hover text-text-muted transition-opacity hover:opacity-90',
                    focusRing,
                  )}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label={t('auth.nav.profileMenu')}
                  onClick={() => setProfileOpen((o) => !o)}
                >
                  {showProfilePhoto ? (
                    <img
                      src={profileImageUrl!}
                      alt=""
                      className="size-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        if (profileImageUrl) setAvatarFailedUrl(profileImageUrl);
                      }}
                    />
                  ) : (
                    <User className="size-4" strokeWidth={1.75} aria-hidden />
                  )}
                </button>
                {profileOpen ? (
                  <div
                    className="absolute right-0 z-30 mt-2 min-w-[140px] rounded-lg border border-border-card bg-surface py-1 shadow-md"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                    >
                      {t('profile.menuProfile')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface-hover"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/pets');
                      }}
                    >
                      {t('profile.menuDashboard')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface-hover"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/pets');
                      }}
                    >
                      {t('profile.menuNgoRequest')}
                    </button>
                    <div className="my-1 h-px bg-border-card" />
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                      onClick={() => {
                        setProfileOpen(false);
                        clearAuthSession();
                        navigate('/', { replace: true });
                      }}
                    >
                      {t('auth.nav.logout')}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className={centerLinkClass}>
                {t('auth.nav.login')}
              </NavLink>
              <Link
                to="/register"
                className={cn(
                  'rounded-lg border border-border-input bg-surface-card px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover sm:px-4',
                  focusRing,
                )}
              >
                {t('auth.nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
