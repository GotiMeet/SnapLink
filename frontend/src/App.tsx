import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/auth/PublicOnlyRoute';
import { AppShell } from '@/components/layout/AppShell';
import { BareLayout } from '@/components/layout/BareLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { NotFoundPage } from '@/pages/NotFound';
import { Placeholder } from '@/pages/Placeholder';
import { AnalyticsOverviewPage } from '@/pages/app/AnalyticsOverview';
import { DashboardPage } from '@/pages/app/Dashboard';
import { LinkAnalyticsPage } from '@/pages/app/LinkAnalytics';
import { LinkDetailPage } from '@/pages/app/LinkDetail';
import { LinksPage } from '@/pages/app/Links';
import { ProjectDetailPage } from '@/pages/app/ProjectDetail';
import { RecycleBinPage } from '@/pages/app/RecycleBin';
import { SettingsLayout } from '@/pages/app/SettingsLayout';
import { SettingsProfilePage } from '@/pages/app/SettingsProfile';
import { SettingsSecurityPage } from '@/pages/app/SettingsSecurity';
import { ProjectsPage } from '@/pages/app/Projects';
import { ForgotPasswordPage } from '@/pages/public/ForgotPassword';
import { LinkUnavailablePage } from '@/pages/public/LinkUnavailable';
import { LoginPage } from '@/pages/public/Login';
import { ResetPasswordPage } from '@/pages/public/ResetPassword';
import { SignupPage } from '@/pages/public/Signup';
import { UnlockPage } from '@/pages/public/Unlock';
import { VerifyEmailPage } from '@/pages/public/VerifyEmail';

/**
 * Route table from PROJECT_MASTER.md section 8. Every screen code is reserved
 * here in Phase 0 so later phases only swap a Placeholder for its real screen.
 *
 * Modals and drawers (Create Project, Create Link, QR Viewer, Restore Conflict)
 * are deliberately absent: they are components mounted by their parent page,
 * not routes. None needs to be linkable or independently reloadable.
 */
export default function App() {
  return (
    <Routes>
      {/* Marketing pages: header + footer chrome. */}
      <Route element={<PublicLayout />}>
        <Route index element={<Placeholder code="SCR-PUB-01" name="Home" />} />
        <Route
          path="features"
          element={<Placeholder code="SCR-PUB-10" name="Features" />}
        />
        <Route path="about" element={<Placeholder code="SCR-PUB-02" name="About" />} />
        <Route
          path="contact"
          element={<Placeholder code="SCR-PUB-03" name="Contact" />}
        />
      </Route>

      {/* Auth and public gate: no chrome. */}
      <Route element={<BareLayout />}>
        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
        </Route>

        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        {/*
          The backend redirects browsers here from {APP_URL}/:shortCode when a
          link is private, and to /link-unavailable when a code does not resolve.
          Both paths are fixed by redirect.controller.js and cannot be renamed
          without a backend change.
        */}
        <Route path="unlock/:shortCode" element={<UnlockPage />} />
        <Route path="link-unavailable" element={<LinkUnavailablePage />} />
      </Route>

      {/* Authenticated workspace. */}
      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailPage />} />
          <Route path="links" element={<LinksPage />} />
          <Route path="links/:urlId" element={<LinkDetailPage />} />
          <Route path="links/:urlId/analytics" element={<LinkAnalyticsPage />} />
          <Route path="analytics" element={<AnalyticsOverviewPage />} />
          <Route path="recycle-bin" element={<RecycleBinPage />} />
          {/* The tab strip is the layout, so both tabs stay reachable by URL. */}
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/app/settings/profile" replace />} />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="security" element={<SettingsSecurityPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
