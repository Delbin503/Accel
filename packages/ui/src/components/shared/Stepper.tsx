import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface StepperStep {
  /** Stable key. */
  id: string;
  label: string;
}

export interface StepperProps extends Omit<React.HTMLAttributes<HTMLOListElement>, "children"> {
  steps: StepperStep[];
  /** Index of the current step (0-based). `steps.length` = all done. */
  current: number;
  /**
   * `always` — labels next to every number. `sm-up` (default) — numbers only on
   * phones, labels from the sm breakpoint. The current step's name is always
   * available to screen readers.
   */
  labels?: "always" | "sm-up";
  /** Accessible name of the list. */
  "aria-label"?: string;
}

/**
 * Horizontal progress through a fixed sequence — sign-up, on-prem setup,
 * multi-step modals. Done steps show an orange check and a solid connector,
 * the current step is tinted, upcoming steps are neutral.
 *
 * Purely an indicator: navigation stays with the page (Back / Next buttons).
 */
const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  ({ steps, current, labels = "sm-up", className, "aria-label": ariaLabel = "Progress", ...props }, ref) => (
    <ol
      ref={ref}
      data-slot="stepper"
      aria-label={ariaLabel}
      className={cn("flex w-full items-center gap-1.5 sm:gap-2", className)}
      {...props}
    >
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li
            key={step.id}
            data-slot="stepper-step"
            data-state={done ? "done" : active ? "active" : "upcoming"}
            aria-current={active ? "step" : undefined}
            className={cn("flex items-center gap-1.5 sm:gap-2", !last && "flex-1")}
          >
            <span data-slot="stepper-step-marker" className="flex shrink-0 items-center gap-1.5">
              <span
                data-slot="stepper-step-index"
                aria-hidden
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-3xs font-bold transition-colors duration-[var(--duration-fast)]",
                  done
                    ? "border-primary bg-primary-fill text-primary-foreground"
                    : active
                      ? "border-primary bg-primary/15 text-primary-ink"
                      : "border-border text-muted-foreground"
                )}
              >
                {done ? <Check data-slot="stepper-step-check" className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span
                data-slot="stepper-step-label"
                className={cn(
                  "text-xs font-semibold whitespace-nowrap transition-colors duration-[var(--duration-fast)]",
                  labels === "sm-up" && "sr-only sm:not-sr-only",
                  done ? "text-primary-ink" : active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
                <span data-slot="stepper-step-state" className="sr-only">
                  {done ? " (done)" : active ? " (current)" : ""}
                </span>
              </span>
            </span>
            {!last && (
              <span
                data-slot="stepper-connector"
                aria-hidden
                className={cn(
                  "h-px min-w-3 flex-1 transition-colors duration-[var(--duration-fast)]",
                  done ? "bg-primary" : active ? "bg-primary/30" : "bg-border"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  )
);
Stepper.displayName = "Stepper";

export { Stepper };
