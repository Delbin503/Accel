import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldOff, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "./AuthLayout";
import type { Suspension } from "@/types/users";

export const SUPPORT_EMAIL = "support@accel.ai";

export interface SuspendedState {
  email: string;
  suspension?: Suspension;
}

/**
 * Sign-in dead end for a suspended account.
 *
 * Reached from the sign-in form before the verification step — a suspended
 * user shouldn't be asked for a code they can't use. Explains who suspended
 * the account and how to get it back, rather than failing with a generic
 * "invalid credentials".
 */
export default function AccountSuspendedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SuspendedState | null) ?? null;

  // Deep-linked without state — nothing to explain, so send them back.
  React.useEffect(() => {
    if (!state?.email) navigate("/signin", { replace: true });
  }, [state, navigate]);

  const suspension = state?.suspension;
  const indefinite =
    !suspension || suspension.preset === "permanent" || suspension.endsAtDisplay === "Indefinite";

  const subject = encodeURIComponent(`Suspended account — ${state?.email ?? ""}`);

  return (
    <AuthLayout hideBrand>
      <div>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-sev-critical/30 bg-sev-critical/15">
            <ShieldOff className="size-7 text-sev-critical" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Account suspended
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Sign-in for{" "}
            <span className="font-medium text-foreground">{state?.email}</span> has been
            blocked by your workspace owner.{" "}
            {indefinite ? (
              <>Access stays blocked until an owner lifts it.</>
            ) : (
              <>
                Access returns{" "}
                <span className="font-medium text-foreground">{suspension?.endsAtDisplay}</span>.
              </>
            )}
          </p>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Only a workspace owner can reinstate this account. If you believe this is a
          mistake, contact your owner directly or reach out to our support team.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <Button
            className="h-10 w-full gap-2 text-base"
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}`;
            }}
          >
            <Mail className="size-3.5" />
            Contact Support
          </Button>
          <Button
            variant="outline"
            className="h-10 w-full gap-2 text-base"
            onClick={() => navigate("/signin")}
          >
            <ArrowLeft className="size-3.5" />
            Back to Sign In
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Support replies within one business day at{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-primary hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
