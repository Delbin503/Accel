import { Stepper } from "@accel/ui/components/shared/Stepper";

export type OnPremStepKey = "license" | "owner" | "site" | "operators";

const STEPS: { id: OnPremStepKey; label: string }[] = [
  { id: "license", label: "Activate License" },
  { id: "owner", label: "Owner Details" },
  { id: "site", label: "Configure Site" },
  { id: "operators", label: "Add Members" },
];

/** On-premise first-run step indicator — the shared Stepper with the setup steps. */
export function OnPremStepBar({ current }: { current: OnPremStepKey }) {
  return (
    <Stepper
      data-slot="on-prem-step-bar"
      steps={STEPS}
      current={STEPS.findIndex((s) => s.id === current)}
      aria-label="Setup progress"
      className="mx-auto max-w-160"
    />
  );
}
