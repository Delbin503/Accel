import { LoaderCircle, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/pages/auth/AuthLayout";

/* Dev-only screen keys for the State Tester (prototype-only). */
export type CloudScreen =
  | "signin"
  | "verify"
  | "signup"
  | "forgot"
  | "plan"
  | "payment"
  | "site"
  | "members";

/** Each screen → the MemoryRouter path the jumper navigates to. The wizard
 *  steps deep-link into the real SignUp flow via its `initialStep` prop. */
export const CLOUD_SCREENS: { key: CloudScreen; label: string; path: string }[] = [
  { key: "signin",  label: "Sign In",     path: "/signin" },
  { key: "verify",  label: "Verify",      path: "/signin/verify" },
  { key: "signup",  label: "Sign Up",     path: "/signup" },
  { key: "forgot",  label: "Forgot Pw",   path: "/forgot-password" },
  { key: "plan",    label: "Choose Plan", path: "/signup/plan" },
  { key: "payment", label: "Payment",     path: "/signup/payment" },
  { key: "site",    label: "Create Site", path: "/signup/site" },
  { key: "members", label: "Members",     path: "/signup/team" },
];

export type AsyncMode = "idle" | "loading" | "error";

/* PROTOTYPE-ONLY async previews — representative loading / failure UI for the
   flow's async actions (sign-in, payment). Not promoted to src. */

export function LoadingPreview() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/40 px-6 py-12 text-center backdrop-blur-sm">
        <LoaderCircle className="size-8 animate-spin text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Working…</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Signing you in / activating your subscription.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export function ErrorPreview({ onRetry }: { onRetry: () => void }) {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] px-6 py-12 text-center">
        <AlertCircle className="size-8 text-sev-critical" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-1 text-base text-muted-foreground">
            We couldn't complete that step. Check your details and try again.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>Try again</Button>
      </div>
    </AuthLayout>
  );
}

/* Stand-in for the destination dashboard so completion navigations land cleanly. */
export function DonePreview() {
  const navigate = useNavigate();
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/[0.05] px-6 py-12 text-center">
        <CheckCircle2 className="size-9 text-success" />
        <div>
          <h1 className="text-xl font-bold text-foreground">You're all set</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Onboarding complete — the dashboard would load here in the real app.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/signin")}>
          Restart flow <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </AuthLayout>
  );
}

export function NotInPrototype() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
        <p className="text-base font-medium text-foreground">Not part of this prototype</p>
        <p className="text-sm">This prototype covers the <strong className="text-foreground">Cloud</strong> onboarding flow. See <strong className="text-foreground">PRD_Onboarding_OnPremise</strong> for the appliance flow.</p>
      </div>
    </AuthLayout>
  );
}
