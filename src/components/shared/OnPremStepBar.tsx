import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnPremStepKey = "license" | "owner" | "site" | "operators";

const STEPS: { key: OnPremStepKey; label: string }[] = [
  { key: "license", label: "Activate License" },
  { key: "owner", label: "Owner Details" },
  { key: "site", label: "Configure Site" },
  { key: "operators", label: "Add Members" },
];

/**
 * On-Premise variant of the wizard step bar.
 *
 * Same visual treatment as AuthStepBar (chip + label + thin connector),
 * but labelled for the offline first-run setup flow.
 */
export function OnPremStepBar({ current }: { current: OnPremStepKey }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="mx-auto flex w-full max-w-[640px] items-center gap-1.5 sm:gap-2">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-3xs font-bold transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground/70"
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-semibold transition-colors sm:inline",
                  done
                    ? "text-primary"
                    : active
                      ? "text-foreground"
                      : "text-muted-foreground/70"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={cn(
                  "h-px flex-1 transition-colors",
                  done
                    ? "bg-primary"
                    : active
                      ? "bg-primary/30"
                      : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
