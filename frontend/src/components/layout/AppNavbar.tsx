import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Menu, MessageCircle, PawPrint, User, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';
import { clearAuthSession, getAuthPictureUrl, getAuthRole, useIsLoggedIn } from '@/lib/authSession';

const iconStroke = 1.75;

function navCircleClassName(isActive?: boolean) {
  return cn(
    'size-9 shrink-0 items-center justify-center rounded-full border border-border-card bg-surface-hover text-text-muted transition-colors',
    isActive && 'ring-1 ring-text-heading/15 dark:ring-white/20',
  );
}

export function AppNavbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const loggedIn = useIsLoggedIn();
  const role = loggedIn ? getAuthRole() : null;
  const isAdmin = role === 'admin';
  const isNgo = role === 'ngo';
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const mobileMenuWrapRef = useRef<HTMLDivElement>(null);
  const profileImageUrl = loggedIn ? getAuthPictureUrl() : null;
  const [avatarFailedUrl, setAvatarFailedUrl] = useState<string | null>(null);
  const showProfilePhoto =
    Boolean(profileImageUrl) && avatarFailedUrl !== profileImageUrl;

  useEffect(() => {
    if (!profileOpen && !mobileMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileWrapRef.current && !profileWrapRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (mobileMenuWrapRef.current && !mobileMenuWrapRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen, mobileMenuOpen]);

  const centerLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'whitespace-nowrap rounded-md px-1 py-1.5 text-sm transition-colors',
      isActive ? 'font-semibold text-text-heading' : 'font-normal text-secondary-fg hover:text-text-heading',
    );

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border-card bg-surface">
      <div className="relative mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6 md:px-10 lg:px-28">
        <Link
          to="/"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border border-border-card bg-surface-hover text-text-heading transition-opacity hover:opacity-90',
            focusRing,
          )}
          aria-label="Нүүр хуудас"
        >
          <PawPrint className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </Link>

        <div className="relative ml-auto sm:hidden" ref={mobileMenuWrapRef}>
          <button
            type="button"
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-full border border-border-card bg-surface-hover text-text-muted transition-opacity hover:opacity-90',
              focusRing,
            )}
            aria-expanded={mobileMenuOpen}
            aria-haspopup="menu"
            aria-label="Цэс"
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? <X className="size-[18px]" strokeWidth={1.75} aria-hidden /> : <Menu className="size-[18px]" strokeWidth={1.75} aria-hidden />}
          </button>

          {mobileMenuOpen ? (
            <div
              className="absolute right-0 z-30 mt-2 min-w-[200px] rounded-lg border border-border-card bg-surface py-1 shadow-md"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(isAdmin ? '/admin/ngo-applications' : '/pets');
                }}
              >
                {isAdmin ? t('admin.nav.ngoApplications') : t('auth.nav.pets')}
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/admin/users');
                  }}
                >
                  {t('admin.nav.userAccess')}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/volunteer');
                    }}
                  >
                    {t('auth.nav.volunteer')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/donations');
                    }}
                  >
                    {t('auth.nav.donations')}
                  </button>
                </>
              )}

              {loggedIn ? (
                <>
                  <div className="my-1 h-px bg-border-card" />
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    {t('profile.menuProfile')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                  >
                    {t('profile.menuDashboard')}
                  </button>
                  {!isAdmin && !isNgo ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/ngo/apply');
                      }}
                    >
                      {t('profile.menuNgoRequest')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/chat');
                    }}
                  >
                    {t('auth.nav.chat')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/notifications');
                    }}
                  >
                    {t('auth.nav.notifications')}
                  </button>
                  <div className="my-1 h-px bg-border-card" />
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      clearAuthSession();
                      navigate('/', { replace: true });
                    }}
                  >
                    {t('auth.nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <div className="my-1 h-px bg-border-card" />
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                  >
                    {t('auth.nav.login')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/register');
                    }}
                  >
                    {t('auth.nav.register')}
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>

        <nav
          className="hidden min-w-0 items-center gap-4 sm:absolute sm:left-1/2 sm:flex sm:-translate-x-1/2 sm:gap-6 md:gap-7"
          aria-label="Main"
        >
          {isAdmin ? (
            <>
              <NavLink to="/admin/ngo-applications" className={centerLinkClass}>
                {t('admin.nav.ngoApplications')}
              </NavLink>
              <NavLink to="/admin/users" className={centerLinkClass}>
                {t('admin.nav.userAccess')}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/pets" className={centerLinkClass} end>
                {t('auth.nav.pets')}
              </NavLink>
              <NavLink to="/volunteer" className={centerLinkClass}>
                {t('auth.nav.volunteer')}
              </NavLink>
              <NavLink to="/donations" className={centerLinkClass}>
                {t('auth.nav.donations')}
              </NavLink>
            </>
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 sm:ml-auto sm:flex sm:gap-4">
          {loggedIn ? (
            <>
              <NavLink
                to="/chat"
                className={({ isActive }) => cn(navCircleClassName(isActive), focusRing, 'hidden sm:flex')}
                aria-label={t('auth.nav.chat')}
                title={t('auth.nav.chat')}
              >
                <MessageCircle className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) => cn(navCircleClassName(isActive), focusRing, 'hidden sm:flex')}
                aria-label={t('auth.nav.notifications')}
                title={t('auth.nav.notifications')}
              >
                <Bell className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
              </NavLink>
              <div className="relative" ref={profileWrapRef}>
                <button
                  type="button"
                  className={cn(
                    'hidden sm:flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-card bg-surface-hover text-text-muted transition-opacity hover:opacity-90',
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
                    {loggedIn && !isAdmin ? (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface-hover"
                          onClick={() => {
                            setProfileOpen(false);
                            navigate('/dashboard');
                          }}
                        >
                          {t('profile.menuDashboard')}
                        </button>
                        {!isNgo ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="w-full px-4 py-2.5 text-left text-sm text-text-muted hover:bg-surface-hover"
                            onClick={() => {
                              setProfileOpen(false);
                              navigate('/ngo/apply');
                            }}
                          >
                            {t('profile.menuNgoRequest')}
                          </button>
                        ) : null}
                      </>
                    ) : null}
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
              <NavLink to="/login" className={({ isActive }) => cn('hidden sm:inline-flex', centerLinkClass({ isActive }))}>
                {t('auth.nav.login')}
              </NavLink>
              <Link
                to="/register"
                className={cn(
                  'hidden sm:inline-flex rounded-lg border border-border-input bg-surface-card px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-hover sm:px-4',
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
