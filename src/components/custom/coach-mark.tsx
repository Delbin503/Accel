import * as React from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CoachMarkProps {
  /** Whether this step of the guided tour is the active one. */
  active: boolean;
  message: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  className?: string;
  children: React.ReactNode;
}

/**
 * First-run coach mark: rings the target element in the brand/primary color
 * and anchors a persistent (non-dismissible-by-outside-click) tooltip to it.
 * Built on the existing Popover primitive in fully-controlled mode so it
 * never closes itself — the guide step logic decides when `active` flips.
 */
export function CoachMark({ active, message, side = "bottom", align = "center", className, children }: CoachMarkProps) {
  return (
    <Popover open={active}>
      <PopoverAnchor asChild>
        <span
          className={cn(
            "relative inline-flex rounded-[var(--radius-md)]",
            active && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse",
            className
          )}
        >
          {children}
        </span>
      </PopoverAnchor>
      {active && (
        <PopoverContent
          side={side}
          align={align}
          sideOffset={10}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="z-[var(--z-tooltip)] w-max max-w-[220px] border-primary/40 bg-primary/15 p-2.5 text-foreground backdrop-blur-sm"
        >
          <p className="text-xs font-semibold leading-snug">{message}</p>
        </PopoverContent>
      )}
    </Popover>
  );
}
