import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Menu, MessageCircle, Moon, PawPrint, Sun, User, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';
import { clearAuthSession, getAuthPictureUrl, getAuthRole, useIsLoggedIn } from '@/lib/authSession';
import { getUnreadNotificationCountWhere } from '@/features/notifications/notificationsApi';
import { getChatSocket } from '@/features/chat/chatSocket';
import { getStoredTheme, toggleTheme, type AppTheme } from '@/lib/theme';

const iconStroke = 1.75;

function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  const text = count > 99 ? '99+' : String(count);
  return (
    <span
      className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-primary px-1 py-px text-[10px] font-semibold leading-none text-on-primary"
      aria-label={label}
    >
      {text}
    </span>
  );
}

export function AppNavbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const loggedIn = useIsLoggedIn();
  const qc = useQueryClient();
  const role = loggedIn ? getAuthRole() : null;
  const isAdmin = role === 'admin';
  const isNgo = role === 'ngo';
  const [profileMenuPath, setProfileMenuPath] = useState<string | null>(null);
  const [mobileMenuPath, setMobileMenuPath] = useState<string | null>(null);
  const profileOpen = profileMenuPath === pathname;
  const mobileMenuOpen = mobileMenuPath === pathname;
  const [theme, setTheme] = useState<AppTheme>(() => getStoredTheme());
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const mobileMenuWrapRef = useRef<HTMLDivElement>(null);
  const profileImageUrl = loggedIn ? getAuthPictureUrl() : null;
  const [avatarFailedUrl, setAvatarFailedUrl] = useState<string | null>(null);
  const showProfilePhoto =
    Boolean(profileImageUrl) && avatarFailedUrl !== profileImageUrl;

  const unreadNotificationsQuery = useQuery({
    queryKey: ['notifications', 'unreadCount', { excludeType: 'chat_message' }],
    queryFn: () => getUnreadNotificationCountWhere({ excludeType: 'chat_message' }),
    enabled: loggedIn,
    refetchInterval: 15_000,
  });
  const unreadNotifications = unreadNotificationsQuery.data?.count ?? 0;

  const unreadChatQuery = useQuery({
    queryKey: ['notifications', 'unreadCount', { type: 'chat_message' }],
    queryFn: () => getUnreadNotificationCountWhere({ type: 'chat_message' }),
    enabled: loggedIn,
    refetchInterval: 10_000,
  });
  const unreadChat = unreadChatQuery.data?.count ?? 0;
  const unreadChatEffective = pathname.startsWith('/chat') ? 0 : unreadChat;

  useEffect(() => {
    if (!loggedIn) return;
    const s = getChatSocket();
    s.auth = { token: localStorage.getItem('accessToken') ?? '' };
    if (!s.connected) s.connect();

    const onNew = () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] }).catch(() => {});
    };
    s.on('chat:message:new', onNew);
    return () => {
      s.off('chat:message:new', onNew);
    };
  }, [loggedIn, qc]);

  useEffect(() => {
    if (!profileOpen && !mobileMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileWrapRef.current && !profileWrapRef.current.contains(target)) {
        setProfileMenuPath(null);
      }
      if (mobileMenuWrapRef.current && !mobileMenuWrapRef.current.contains(target)) {
        setMobileMenuPath(null);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen, mobileMenuOpen]);

  const centerLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'whitespace-nowrap border-b-2 px-0.5 pb-0.5 text-sm transition-colors',
      isActive
        ? 'border-accent font-semibold text-text-heading'
        : 'border-transparent font-normal text-text-secondary hover:border-border-card hover:text-text-heading',
    );

  const utilityBtnClass =
    'inline-flex items-center gap-0.5 rounded-input px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-heading';

  const utilityIconLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative hidden size-9 items-center justify-center rounded-input text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-heading sm:inline-flex',
      isActive && 'bg-surface-hover text-text-heading',
      focusRing,
    );

  const profileMenuItemClass = 'w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover';
  const profileMenuItemSecondaryClass =
    'w-full px-4 py-2.5 text-left text-sm text-text-secondary hover:bg-surface-hover';

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border-card bg-surface">
      <div className="relative mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link
          to="/pets"
          className={cn(
            'inline-flex items-center gap-2 rounded-input border border-border-card bg-surface-hover px-2.5 py-1.5 text-text-heading transition-colors hover:bg-surface-muted',
            focusRing,
          )}
          aria-label="Нүүр хуудас"
        >
          <PawPrint className="size-4 shrink-0" strokeWidth={iconStroke} aria-hidden />
        </Link>

        <nav
          className="hidden min-w-0 items-center gap-4 lg:gap-5 sm:absolute sm:left-1/2 sm:flex sm:-translate-x-1/2 xl:gap-6"
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

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="relative sm:hidden" ref={mobileMenuWrapRef}>
            <button
              type="button"
              className={cn(
                'inline-flex size-9 items-center justify-center rounded-input border border-border-card text-text-muted hover:bg-surface-hover',
                focusRing,
              )}
              aria-expanded={mobileMenuOpen}
              aria-haspopup="menu"
              aria-label="Цэс"
              onClick={() => setMobileMenuPath((p) => (p === pathname ? null : pathname))}
            >
              {mobileMenuOpen ? (
                <X className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
              ) : (
                <Menu className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
              )}
            </button>

            {mobileMenuOpen ? (
              <div
                className="absolute right-0 z-30 mt-2 min-w-[200px] rounded-card border border-border-card bg-surface py-1"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                  onClick={() => {
                    setMobileMenuPath(null);
                    navigate('/pets');
                  }}
                >
                  {t('auth.nav.pets')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                  onClick={() => {
                    setMobileMenuPath(null);
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
                    setMobileMenuPath(null);
                    navigate('/donations');
                  }}
                >
                  {t('auth.nav.donations')}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                  onClick={() => {
                    setTheme(toggleTheme());
                  }}
                >
                  {theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
                </button>
                {loggedIn ? (
                  <>
                    <div className="my-1 h-px bg-border-card" />
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                      onClick={() => {
                        setMobileMenuPath(null);
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
                        setMobileMenuPath(null);
                        navigate('/notifications');
                      }}
                    >
                      {t('auth.nav.notifications')}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={profileMenuItemClass}
                      onClick={() => {
                        setMobileMenuPath(null);
                        navigate('/profile');
                      }}
                    >
                      {t('profile.menuProfile')}
                    </button>
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className={profileMenuItemSecondaryClass}
                          onClick={() => {
                            setMobileMenuPath(null);
                            navigate('/admin/ngo-applications');
                          }}
                        >
                          {t('admin.nav.ngoApplications')}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={profileMenuItemSecondaryClass}
                          onClick={() => {
                            setMobileMenuPath(null);
                            navigate('/admin/users');
                          }}
                        >
                          {t('admin.nav.userAccess')}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        className={profileMenuItemSecondaryClass}
                        onClick={() => {
                          setMobileMenuPath(null);
                          navigate('/dashboard');
                        }}
                      >
                        {t('profile.menuDashboard')}
                      </button>
                    )}
                    {!isAdmin && !isNgo ? (
                      <button
                        type="button"
                        role="menuitem"
                        className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                        onClick={() => {
                          setMobileMenuPath(null);
                          navigate('/ngo/apply');
                        }}
                      >
                        {t('profile.menuNgoRequest')}
                      </button>
                    ) : null}
                    <div className="my-1 h-px bg-border-card" />
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover"
                      onClick={() => {
                        setMobileMenuPath(null);
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
                        setMobileMenuPath(null);
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
                        setMobileMenuPath(null);
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

          <button
            type="button"
            className={cn(utilityBtnClass, focusRing)}
            aria-label={theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
            title={theme === 'light' ? t('theme.toDark') : t('theme.toLight')}
            onClick={() => setTheme(toggleTheme())}
          >
            {theme === 'light' ? (
              <Moon className="size-4 shrink-0" strokeWidth={iconStroke} aria-hidden />
            ) : (
              <Sun className="size-4 shrink-0" strokeWidth={iconStroke} aria-hidden />
            )}
          </button>

          {loggedIn ? (
            <>
              <NavLink
                to="/chat"
                className={utilityIconLinkClass}
                aria-label={t('auth.nav.chat')}
                title={t('auth.nav.chat')}
              >
                <MessageCircle className="size-[18px] shrink-0" strokeWidth={iconStroke} aria-hidden />
                <CountBadge count={unreadChatEffective} label={t('auth.nav.chat')} />
              </NavLink>
              <NavLink
                to="/notifications"
                className={utilityIconLinkClass}
                aria-label={t('auth.nav.notifications')}
                title={t('auth.nav.notifications')}
              >
                <Bell className="size-[18px] shrink-0" strokeWidth={iconStroke} aria-hidden />
                <CountBadge count={unreadNotifications} label={t('auth.nav.notifications')} />
              </NavLink>
              <div className="relative hidden sm:block" ref={profileWrapRef}>
                <button
                  type="button"
                  className={cn(
                    'flex size-9 items-center justify-center overflow-hidden rounded-full border border-border-card bg-surface-hover text-text-muted hover:bg-surface-muted',
                    focusRing,
                  )}
                  aria-expanded={profileOpen}
                  aria-haspopup="menu"
                  aria-label={t('auth.nav.profileMenu')}
                  onClick={() => setProfileMenuPath((p) => (p === pathname ? null : pathname))}
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
                    <User className="size-4" strokeWidth={iconStroke} aria-hidden />
                  )}
                </button>
                {profileOpen ? (
                  <div
                    className="absolute right-0 z-30 mt-2 min-w-[240px] rounded-card border border-border-card bg-surface py-1 shadow-lg"
                    role="menu"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className={profileMenuItemClass}
                      onClick={() => {
                        setProfileMenuPath(null);
                        navigate('/profile');
                      }}
                    >
                      {t('profile.menuProfile')}
                    </button>
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className={profileMenuItemSecondaryClass}
                          onClick={() => {
                            setProfileMenuPath(null);
                            navigate('/admin/ngo-applications');
                          }}
                        >
                          {t('admin.nav.ngoApplications')}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className={profileMenuItemSecondaryClass}
                          onClick={() => {
                            setProfileMenuPath(null);
                            navigate('/admin/users');
                          }}
                        >
                          {t('admin.nav.userAccess')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          role="menuitem"
                          className={profileMenuItemSecondaryClass}
                          onClick={() => {
                            setProfileMenuPath(null);
                            navigate('/dashboard');
                          }}
                        >
                          {t('profile.menuDashboard')}
                        </button>
                        {!isNgo ? (
                          <button
                            type="button"
                            role="menuitem"
                            className={profileMenuItemSecondaryClass}
                            onClick={() => {
                              setProfileMenuPath(null);
                              navigate('/ngo/apply');
                            }}
                          >
                            {t('profile.menuNgoRequest')}
                          </button>
                        ) : null}
                      </>
                    )}
                    <div className="my-1 h-px bg-border-card" />
                    <button
                      type="button"
                      role="menuitem"
                      className={profileMenuItemClass}
                      onClick={() => {
                        setProfileMenuPath(null);
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
            <div className="hidden items-center gap-4 sm:flex">
              <NavLink to="/login" className={centerLinkClass}>
                {t('auth.nav.login')}
              </NavLink>
              <NavLink to="/register" className={centerLinkClass}>
                {t('auth.nav.register')}
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
