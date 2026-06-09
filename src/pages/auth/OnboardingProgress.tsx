import { Check, MapPin, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "site",         label: "Create site",         icon: MapPin },
  { key: "subscription", label: "Choose plan",         icon: CreditCard },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function OnboardingProgress({ current }: { current: StepKey }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                isDone ? "border-success bg-success text-white" :
                isCurrent ? "border-primary bg-primary text-primary-foreground" :
                "border-border bg-muted text-muted-foreground"
              )}>
                {isDone ? <Check className="size-3" strokeWidth={3} /> : <Icon className="size-3" />}
              </div>
              <p className={cn(
                "hidden text-xs font-semibold uppercase tracking-wider sm:block",
                isDone ? "text-success" :
                isCurrent ? "text-foreground" :
                "text-muted-foreground"
              )}>
                {s.label}
              </p>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 w-6 sm:w-10 rounded-full transition-colors",
                  isDone ? "bg-success" : "bg-border")} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
