import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  RequireOnboarding,
  RedirectIfAuthed,
  RequireOnboardingStep,
} from "@/components/shared/RequireOnboarding";

/* ─── Pages ─────────────────────────────────────────────────────────────── */
// Monitor
import DashboardPage from "@/pages/dashboard";
import LiveMonitoringPage from "@/pages/live-monitoring";
import RecordingsPage from "@/pages/recordings";
import DetectionFeedPage from "@/pages/detection-feed";
import DismissedEventsPage from "@/pages/detection-feed/dismissed";

// Manage
import SiteOverviewPage from "@/pages/site/overview";
import SiteCamerasPage from "@/pages/site/cameras";
import SiteNvrPage from "@/pages/site/nvr";
import SiteZonesPage from "@/pages/site/zones";
import ModelManagementPage from "@/pages/model-management";
import RulesLibraryPage from "@/pages/rules-library";
import IncidentCasesPage from "@/pages/incident-cases";
import IncidentCaseDetailPage from "@/pages/incident-cases/detail";

// Deploy
import RunAnalysisPage from "@/pages/run-analysis";
import ModelDeploymentPage from "@/pages/model-deployment";

// System
import UserManagementPage from "@/pages/user-management";
import DeviceHealthPage from "@/pages/device-health";
import SystemConfigPage from "@/pages/system-config";
import ActivityLogsPage from "@/pages/activity-logs";

// Account
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import BillingPage from "@/pages/billing";
import SystemInfoPage from "@/pages/system-info";

// Auth + Onboarding
import SignInPage from "@/pages/auth/SignIn";
import SignInVerifyPage from "@/pages/auth/SignInVerify";
import SignUpPage from "@/pages/auth/SignUp";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import OnboardingSitePage from "@/pages/auth/OnboardingSite";
import OnboardingSubscriptionPage from "@/pages/auth/OnboardingSubscription";

// On-Premise flow (offline single-site appliance)
import OnPremSignInPage from "@/pages/auth/onprem/OnPremSignIn";
import OnPremForgotPasswordPage from "@/pages/auth/onprem/OnPremForgotPassword";
import OnPremSetupPage from "@/pages/auth/onprem/OnPremSetup";

function App() {
  return (
    <>
    <Toaster position="top-right" richColors closeButton expand={false} />
    <Routes>
      {/* Auth pages — only shown when not yet authenticated/onboarded */}
      <Route element={<RedirectIfAuthed />}>
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signin/verify" element={<SignInVerifyPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* On-Premise flow — testable via URL. Kept outside RedirectIfAuthed
          so /on-premise/* renders regardless of current cloud auth state. */}
      <Route path="/on-premise" element={<Navigate to="/on-premise/signin" replace />} />
      <Route path="/on-premise/signin" element={<OnPremSignInPage />} />
      <Route path="/on-premise/forgot-password" element={<OnPremForgotPasswordPage />} />
      <Route path="/on-premise/setup"  element={<OnPremSetupPage />} />
      <Route path="/on-premise/signup" element={<Navigate to="/on-premise/setup" replace />} />

      {/* Onboarding pages — require auth, enforce step order */}
      <Route path="/onboarding/site"         element={<RequireOnboardingStep step="site" />}>
        <Route index element={<OnboardingSitePage />} />
      </Route>
      <Route path="/onboarding/subscription" element={<RequireOnboardingStep step="subscription" />}>
        <Route index element={<OnboardingSubscriptionPage />} />
      </Route>
      <Route path="/onboarding" element={<Navigate to="/onboarding/site" replace />} />

      {/* Main application — requires auth + active subscription */}
      <Route element={<RequireOnboarding />}>
        <Route element={<AppLayout />}>
          {/* Monitor */}
          <Route index element={<DashboardPage />} />
          <Route path="live" element={<LiveMonitoringPage />} />
          <Route path="recordings" element={<RecordingsPage />} />
          <Route path="detection-feed" element={<DetectionFeedPage />} />
          <Route path="detection-feed/dismissed" element={<DismissedEventsPage />} />

          {/* Manage — Site sub-routes */}
          <Route path="site">
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<SiteOverviewPage />} />
            <Route path="cameras" element={<SiteCamerasPage />} />
            <Route path="nvr" element={<SiteNvrPage />} />
            <Route path="zones" element={<SiteZonesPage />} />
            <Route path=":siteId" element={<SiteOverviewPage />} />
          </Route>
          <Route path="models" element={<ModelManagementPage />} />
          <Route path="rules" element={<RulesLibraryPage />} />
          <Route path="incidents" element={<IncidentCasesPage />} />
          <Route path="incidents/:caseId" element={<IncidentCaseDetailPage />} />

          {/* Deploy */}
          <Route path="analysis" element={<RunAnalysisPage />} />
          <Route path="deployment" element={<ModelDeploymentPage />} />

          {/* System */}
          <Route path="users" element={<UserManagementPage />} />
          <Route path="device-health" element={<DeviceHealthPage />} />
          <Route path="config" element={<SystemConfigPage />} />
          <Route path="activity-logs" element={<ActivityLogsPage />} />

          {/* Account */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="system-info" element={<SystemInfoPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
