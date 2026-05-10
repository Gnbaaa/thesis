import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Menu, MessageCircle, PawPrint, User, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { focusRing } from '@/lib/uiClasses';
import { clearAuthSession, getAuthPictureUrl, getAuthRole, useIsLoggedIn } from '@/lib/authSession';
import { getUnreadNotificationCountWhere } from '@/features/notifications/notificationsApi';
import { getChatSocket } from '@/features/chat/chatSocket';

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
  const { pathname } = useLocation();
  const loggedIn = useIsLoggedIn();
  const qc = useQueryClient();
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

  const unreadNotificationsQuery = useQuery({
    queryKey: ['notifications', 'unreadCount', { excludeType: 'chat_message' }],
    queryFn: () => getUnreadNotificationCountWhere({ excludeType: 'chat_message' }),
    enabled: loggedIn,
    refetchInterval: 15_000,
  });
  const unreadNotifications = unreadNotificationsQuery.data?.count ?? 0;
  const unreadNotificationsLabel = unreadNotifications > 99 ? '99+' : String(unreadNotifications);

  const unreadChatQuery = useQuery({
    queryKey: ['notifications', 'unreadCount', { type: 'chat_message' }],
    queryFn: () => getUnreadNotificationCountWhere({ type: 'chat_message' }),
    enabled: loggedIn,
    refetchInterval: 10_000,
  });
  const unreadChat = unreadChatQuery.data?.count ?? 0;
  const unreadChatEffective = pathname.startsWith('/chat') ? 0 : unreadChat;
  const unreadChatLabel = unreadChatEffective > 99 ? '99+' : String(unreadChatEffective);

  useEffect(() => {
    if (!loggedIn) return;
    const s = getChatSocket();
    s.auth = { token: localStorage.getItem('accessToken') ?? '' };
    if (!s.connected) s.connect();

    const onNew = () => {
      // Refresh both badges without page refresh.
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
                <span className="relative">
                  <MessageCircle className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
                  {unreadChatEffective > 0 ? (
                    <span className="absolute -right-2.5 -top-2 grid min-w-[18px] place-items-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-on-primary">
                      {unreadChatLabel}
                    </span>
                  ) : null}
                </span>
              </NavLink>
              <NavLink
                to="/notifications"
                className={({ isActive }) => cn(navCircleClassName(isActive), focusRing, 'hidden sm:flex')}
                aria-label={t('auth.nav.notifications')}
                title={t('auth.nav.notifications')}
              >
                <span className="relative">
                  <Bell className="size-[18px]" strokeWidth={iconStroke} aria-hidden />
                  {unreadNotifications > 0 ? (
                    <span className="absolute -right-2.5 -top-2 grid min-w-[18px] place-items-center rounded-full bg-primary px-1 py-0.5 text-[10px] font-semibold leading-none text-on-primary">
                      {unreadNotificationsLabel}
                    </span>
                  ) : null}
                </span>
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
