import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Canonical titled container card. Replaces the per-page Section,
 * SectionCard, SectionHeader and SectionTitle variants.
 *
 * @example
 *   <SectionCard title="Cameras" description="11 of 14 online" action={<Button/>}>
 *     …content…
 *   </SectionCard>
 */
export interface SectionCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned header slot (button, menu, badge…). */
  action?: React.ReactNode;
  /** Remove the default body padding (for flush tables/lists). */
  flushBody?: boolean;
  /** Classes applied to the inner body wrapper. */
  bodyClassName?: string;
}

const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  (
    { title, description, action, flushBody = false, bodyClassName, className, children, ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="truncate text-md font-bold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn(!flushBody && "px-5 py-4", bodyClassName)}>{children}</div>
    </div>
  )
);
SectionCard.displayName = "SectionCard";

export { SectionCard };
