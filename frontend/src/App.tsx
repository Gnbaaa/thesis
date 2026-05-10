import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { cn } from '@/lib/cn';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NgoApplicationPage = lazy(() => import('@/pages/ngo/NgoApplicationPage'));
const AdminNgoApplicationsPage = lazy(() => import('@/pages/admin/AdminNgoApplicationsPage'));
const AdminNgoApplicationDetailPage = lazy(() => import('@/pages/admin/AdminNgoApplicationDetailPage'));
const PetsListPage = lazy(() => import('@/pages/pets/PetsListPage'));
const PetsAddPage = lazy(() => import('@/pages/pets/PetsAddPage'));
const PetDetailPage = lazy(() => import('@/pages/pets/PetDetailPage'));
const PetsEditPage = lazy(() => import('@/pages/pets/PetsEditPage'));
const AdoptionRequestPage = lazy(() => import('@/pages/adoption/AdoptionRequestPage'));
const UserDashboardPage = lazy(() => import('@/pages/dashboard/UserDashboardPage'));
const IncomingRequestsPage = lazy(() => import('@/pages/dashboard/IncomingRequestsPage'));
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage'));
const AuthCallbackPage = lazy(() => import('@/pages/auth/AuthCallbackPage'));
const ChatPage = lazy(() => import('@/pages/chat/ChatPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));

function AppLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const petsListPage = pathname === '/pets';

  return (
    <>
      <AppNavbar />
      <div
        className={cn('min-h-[calc(100vh-4rem)]', petsListPage ? 'bg-black' : 'bg-surface-muted')}
      >
        <div
          className={cn(
            'mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1440px] justify-center',
            petsListPage
              ? 'px-4 py-4 sm:px-5 sm:py-5 md:px-6 lg:px-8'
              : 'px-4 py-8 sm:px-6 md:py-12 lg:px-20',
          )}
        >
          <Suspense
            fallback={
              <div className="flex w-full max-w-md flex-col items-center justify-center gap-2 rounded-card border border-border-card bg-surface-card px-8 py-14">
                <p className="text-center text-sm text-text-muted">{t('common.loading')}</p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/pets" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="ngo/apply" element={<NgoApplicationPage />} />
        <Route path="admin/ngo-applications" element={<AdminNgoApplicationsPage />} />
        <Route path="admin/ngo-applications/:id" element={<AdminNgoApplicationDetailPage />} />
        <Route path="admin/users" element={<ComingSoonPage />} />
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="pets" element={<PetsListPage />} />
        <Route path="pets/new" element={<PetsAddPage />} />
        <Route path="pets/:id" element={<PetDetailPage />} />
        <Route path="pets/:id/edit" element={<PetsEditPage />} />
        <Route path="pets/:id/adopt" element={<AdoptionRequestPage />} />
        <Route path="dashboard" element={<UserDashboardPage />} />
        <Route path="dashboard/inbox" element={<IncomingRequestsPage />} />
        <Route path="donations" element={<ComingSoonPage />} />
        <Route path="volunteer" element={<ComingSoonPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}
