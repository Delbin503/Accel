import { Stepper } from "@accel/ui/components/shared/Stepper";

export type AuthStepKey = "account" | "plan" | "site" | "team";

const STEPS: { id: AuthStepKey; label: string }[] = [
  { id: "account", label: "Create Account" },
  { id: "plan", label: "Subscribe Plan" },
  { id: "site", label: "Create Site" },
  { id: "team", label: "Invite Team" },
];

/** Top step indicator on every sign-up page — the shared Stepper with the sign-up steps. */
export function AuthStepBar({ current }: { current: AuthStepKey }) {
  return (
    <Stepper
      data-slot="auth-step-bar"
      steps={STEPS}
      current={STEPS.findIndex((s) => s.id === current)}
      aria-label="Sign-up progress"
      className="mx-auto max-w-160"
    />
  );
}
