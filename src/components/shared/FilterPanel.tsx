import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Layout wrapper for a group of filter controls (FilterDropdowns, date ranges).
 * Lays them out in a responsive grid and surfaces a "Clear all" action when
 * any filter is active. Compose the actual controls as children.
 */
export interface FilterPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether any filter is currently active — toggles the Clear all button. */
  active?: boolean;
  onClear?: () => void;
  /** Tailwind columns for the control grid. Defaults to auto-fit on sm+. */
  columnsClassName?: string;
}

const FilterPanel = React.forwardRef<HTMLDivElement, FilterPanelProps>(
  (
    {
      active = false,
      onClear,
      columnsClassName = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
      className,
      children,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn("rounded-xl border border-border bg-card p-3", className)}
      {...props}
    >
      <div className={cn("grid gap-2", columnsClassName)}>{children}</div>
      {active && onClear && (
        <div className="mt-2 flex justify-end">
          <Button variant="ghost" size="xs" onClick={onClear}>
            <X /> Clear all
          </Button>
        </div>
      )}
    </div>
  )
);
FilterPanel.displayName = "FilterPanel";

export { FilterPanel };
