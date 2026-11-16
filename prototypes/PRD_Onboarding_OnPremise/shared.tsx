import { LoaderCircle, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@accel/ui/components/ui/button";
import { AuthLayout } from "@/pages/auth/AuthLayout";


/* PROTOTYPE-ONLY async previews — representative loading / failure UI for the
   flow's async actions (sign-in, license activation). Not promoted to src. */

export function LoadingPreview() {
  return (
    <AuthLayout>
      <div data-slot="loading-preview" className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/40 px-6 py-12 text-center backdrop-blur-sm">
        <LoaderCircle className="size-8 animate-spin text-primary-ink" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Working…</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Signing in / activating the account license.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

export function ErrorPreview({ onRetry }: { onRetry: () => void }) {
  return (
    <AuthLayout>
      <div data-slot="error-preview" className="flex flex-col items-center gap-4 rounded-xl border border-severity-critical/30 bg-severity-critical/[0.05] px-6 py-12 text-center">
        <AlertCircle className="size-8 text-severity-critical" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-1 text-base text-muted-foreground">
            We couldn't verify that. Check the license key / credentials and try again.
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
      <div data-slot="done-preview" className="flex flex-col items-center gap-4 rounded-xl border border-success/30 bg-success/[0.05] px-6 py-12 text-center">
        <CheckCircle2 className="size-9 text-success" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Setup complete</h1>
          <p className="mt-1 text-base text-muted-foreground">
            The account is ready — the dashboard would load here in the real app.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => navigate("/on-premise/signin")}>
          Restart flow <ArrowRight className="size-3.5" />
        </Button>
      </div>
    </AuthLayout>
  );
}

export function NotInPrototype() {
  return (
    <AuthLayout>
      <div data-slot="not-in-prototype" className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
        <p className="text-base font-medium text-foreground">Not part of this prototype</p>
        <p className="text-sm">This prototype covers the <strong className="text-foreground">On-Premise</strong> account flow. See <strong className="text-foreground">PRD_Onboarding_Cloud</strong> for the cloud flow.</p>
      </div>
    </AuthLayout>
  );
}
