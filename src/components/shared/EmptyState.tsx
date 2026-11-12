import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Canonical zero-data / no-results view. Replaces the inline
 * "No X match the filters" snippets scattered across every list page.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Optional CTA / action element rendered below the copy. */
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon: Icon, title, description, action, className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {Icon && (
        <div data-slot="empty-state-icon" className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <p data-slot="empty-state-title" className="text-md font-semibold text-foreground">{title}</p>
      {description && (
        <p data-slot="empty-state-description" className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div data-slot="empty-state-actions" className="mt-2">{action}</div>}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
