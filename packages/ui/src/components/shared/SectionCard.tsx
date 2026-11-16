import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";

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
  /** The header toggles the body open and closed. */
  collapsible?: boolean;
  /** Collapsible only — whether the body starts open. */
  defaultOpen?: boolean;
  /** `sm` tightens the header and body for narrow side columns. */
  size?: "default" | "sm";
  /** Heading level of the title, to keep the page outline in order (h1 page title → h2 sections). Default 3. */
  headingLevel?: 2 | 3 | 4;
}

const SIZES = {
  default: { header: "px-5 py-3.5", title: "text-md font-bold", description: "text-sm", body: "px-5 py-4", action: "pr-5" },
  sm: { header: "px-4 py-2.5", title: "text-sm font-semibold", description: "text-xs", body: "px-4 py-3", action: "pr-4" },
} as const;

const SectionCard = React.forwardRef<HTMLDivElement, SectionCardProps>(
  (
    { title, description, action, flushBody = false, bodyClassName, collapsible = false, defaultOpen = true, size = "default", headingLevel = 3, className, children, ...props },
    ref
  ) => {
    const Heading = `h${headingLevel}` as const;
    const sz = SIZES[size];
    return collapsible ? (
    <Collapsible
      data-slot="section-card"
      ref={ref}
      defaultOpen={defaultOpen}
      className={cn("group/section overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <div data-slot="section-card-header" className="flex items-center gap-3 border-b border-border group-data-[state=closed]/section:border-b-0">
        <CollapsibleTrigger data-slot="section-card-trigger" className={cn("flex min-w-0 flex-1 items-center gap-3 text-left", sz.header)}>
          <div data-slot="section-card-heading" className="min-w-0 flex-1">
            <Heading data-slot="section-card-title" className={cn("truncate text-foreground", sz.title)}>{title}</Heading>
            {description && (
              <p data-slot="section-card-description" className={cn("mt-0.5 truncate text-muted-foreground", sz.description)}>{description}</p>
            )}
          </div>
          <ChevronDown data-slot="section-card-chevron" className="size-4 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)] ease-standard group-data-[state=closed]/section:-rotate-90" />
        </CollapsibleTrigger>
        {action && <div data-slot="section-card-actions" className={cn("shrink-0", sz.action)}>{action}</div>}
      </div>
      <CollapsibleContent data-slot="section-card-content" className={cn(!flushBody && sz.body, bodyClassName)}>{children}</CollapsibleContent>
    </Collapsible>
  ) : (
    <div
      data-slot="section-card"
      ref={ref}
      className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}
      {...props}
    >
      <div data-slot="section-card-header" className={cn("flex items-center justify-between gap-3 border-b border-border", sz.header)}>
        <div data-slot="section-card-heading" className="min-w-0">
          <Heading data-slot="section-card-title" className={cn("truncate text-foreground", sz.title)}>{title}</Heading>
          {description && (
            <p data-slot="section-card-description" className={cn("mt-0.5 truncate text-muted-foreground", sz.description)}>{description}</p>
          )}
        </div>
        {action && <div data-slot="section-card-actions" className="shrink-0">{action}</div>}
      </div>
      <div data-slot="section-card-content" className={cn(!flushBody && sz.body, bodyClassName)}>{children}</div>
    </div>
  );
  }
);
SectionCard.displayName = "SectionCard";

export { SectionCard };
