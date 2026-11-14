import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Route guard that enforces the sign-up / onboarding flow:
 *   - Not authenticated         → /signin
 *   - Authenticated, no site    → /onboarding/site
 *   - Has site, no subscription → /onboarding/subscription
 *   - Otherwise                 → renders <Outlet />
 *
 * Apply on top-level routes that require an active workspace + subscription.
 */
export function RequireOnboarding() {
  const isAuthenticated         = useAuthStore((s) => s.isAuthenticated);
  const hasCreatedSite          = useAuthStore((s) => s.hasCreatedSite);
  const hasActiveSubscription   = useAuthStore((s) => s.hasActiveSubscription);
  const location                = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location.pathname + location.search }} replace />;
  }
  if (!hasCreatedSite) {
    return <Navigate to="/onboarding/site" replace />;
  }
  if (!hasActiveSubscription) {
    return <Navigate to="/onboarding/subscription" replace />;
  }
  return <Outlet />;
}

/**
 * Guard for the auth pages themselves — if a user is already authenticated AND
 * fully onboarded, send them straight to the dashboard.
 */
export function RedirectIfAuthed() {
  const isAuthenticated       = useAuthStore((s) => s.isAuthenticated);
  const hasCreatedSite        = useAuthStore((s) => s.hasCreatedSite);
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);

  if (isAuthenticated && hasCreatedSite && hasActiveSubscription) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/**
 * Onboarding-step guard: keeps users on the correct step.
 *   - /onboarding/site         requires auth, redirects forward if site exists
 *   - /onboarding/subscription requires auth + site
 */
export function RequireOnboardingStep({ step }: { step: "site" | "subscription" }) {
  const isAuthenticated       = useAuthStore((s) => s.isAuthenticated);
  const hasCreatedSite        = useAuthStore((s) => s.hasCreatedSite);
  const hasActiveSubscription = useAuthStore((s) => s.hasActiveSubscription);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (step === "site" && hasCreatedSite && !hasActiveSubscription) {
    return <Navigate to="/onboarding/subscription" replace />;
  }
  if (step === "site" && hasCreatedSite && hasActiveSubscription) {
    return <Navigate to="/" replace />;
  }
  if (step === "subscription" && !hasCreatedSite) {
    return <Navigate to="/onboarding/site" replace />;
  }
  if (step === "subscription" && hasActiveSubscription) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
