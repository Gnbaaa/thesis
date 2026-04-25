import { lazy, Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppNavbar } from '@/components/layout/AppNavbar';

const HomePage = lazy(() => import('@/pages/HomePage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const NgoApplicationPage = lazy(() => import('@/pages/ngo/NgoApplicationPage'));
const AdminNgoApplicationsPage = lazy(() => import('@/pages/admin/AdminNgoApplicationsPage'));
const AdminNgoApplicationDetailPage = lazy(() => import('@/pages/admin/AdminNgoApplicationDetailPage'));
const ComingSoonPage = lazy(() => import('@/pages/ComingSoonPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));

function AppLayout() {
  const { t } = useTranslation();

  return (
    <>
      <AppNavbar />
      <div className="min-h-[calc(100vh-4rem)] bg-surface-muted">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1440px] justify-center px-4 py-8 sm:px-6 md:py-12 lg:px-20">
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
        <Route index element={<HomePage />} />
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
        <Route path="pets" element={<ComingSoonPage />} />
        <Route path="donations" element={<ComingSoonPage />} />
        <Route path="volunteer" element={<ComingSoonPage />} />
        <Route path="chat" element={<ComingSoonPage />} />
        <Route path="notifications" element={<ComingSoonPage />} />
      </Route>
    </Routes>
  );
}
