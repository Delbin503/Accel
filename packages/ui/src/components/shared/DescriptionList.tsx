import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Label / value pairs — record details in drawers, cards and summaries.
 * Renders a real <dl> so screen readers pair each label with its value.
 *
 * - `layout="stacked"` (default): small uppercase label above the value, in a
 *   grid of `columns` — the drawers' "info grid".
 * - `layout="inline"`: label left, value right, one row per item with hairline
 *   dividers — for narrow panels and summaries.
 * - `variant="card"` wraps the list in a bordered card; `plain` has no chrome.
 *
 * ```tsx
 * <DescriptionList columns={2} variant="card">
 *   <DescriptionItem label="Camera" mono>CAM-015</DescriptionItem>
 *   <DescriptionItem label="Site">Changi Hub</DescriptionItem>
 * </DescriptionList>
 * ```
 */
const descriptionListVariants = cva("min-w-0 text-base", {
  variants: {
    layout: {
      stacked: "grid gap-x-4 gap-y-2.5",
      inline: "flex flex-col divide-y divide-border",
    },
    columns: { 1: "", 2: "", 3: "" },
    variant: {
      plain: "",
      card: "rounded-lg border border-border bg-card",
    },
  },
  compoundVariants: [
    { layout: "stacked", columns: 1, class: "grid-cols-1" },
    { layout: "stacked", columns: 2, class: "grid-cols-1 sm:grid-cols-2" },
    { layout: "stacked", columns: 3, class: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" },
    { layout: "stacked", variant: "card", class: "p-card" },
    { layout: "inline", variant: "card", class: "px-card" },
  ],
  defaultVariants: { layout: "stacked", columns: 2, variant: "plain" },
});

type DescriptionListContextValue = { layout: "stacked" | "inline" };
const DescriptionListContext = React.createContext<DescriptionListContextValue>({ layout: "stacked" });

export interface DescriptionListProps
  extends React.HTMLAttributes<HTMLDListElement>,
    VariantProps<typeof descriptionListVariants> {}

const DescriptionList = React.forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ layout, columns, variant, className, ...props }, ref) => (
    <DescriptionListContext.Provider value={{ layout: layout ?? "stacked" }}>
      <dl
        ref={ref}
        data-slot="description-list"
        data-layout={layout ?? "stacked"}
        className={cn(descriptionListVariants({ layout, columns, variant }), className)}
        {...props}
      />
    </DescriptionListContext.Provider>
  )
);
DescriptionList.displayName = "DescriptionList";

export interface DescriptionItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label: React.ReactNode;
  /** Monospace value — IDs, IPs, timestamps, sizes. */
  mono?: boolean;
  /** Span the full row in a multi-column stacked list. */
  wide?: boolean;
  children?: React.ReactNode;
}

const DescriptionItem = React.forwardRef<HTMLDivElement, DescriptionItemProps>(
  ({ label, mono, wide, className, children, ...props }, ref) => {
    const { layout } = React.useContext(DescriptionListContext);
    const inline = layout === "inline";
    return (
      <div
        ref={ref}
        data-slot="description-item"
        className={cn(
          "min-w-0",
          inline ? "flex items-baseline justify-between gap-4 py-2.5" : "flex flex-col gap-0.5",
          wide && !inline && "col-span-full",
          className
        )}
        {...props}
      >
        <dt
          data-slot="description-item-label"
          className={cn(
            "text-muted-foreground",
            inline ? "shrink-0 text-sm" : "text-2xs font-semibold uppercase tracking-widest"
          )}
        >
          {label}
        </dt>
        <dd
          data-slot="description-item-value"
          className={cn(
            "min-w-0 font-medium text-foreground",
            inline && "text-right",
            mono && "font-mono text-xs"
          )}
        >
          {children ?? <span data-slot="description-item-empty" className="text-muted-foreground">—</span>}
        </dd>
      </div>
    );
  }
);
DescriptionItem.displayName = "DescriptionItem";

export { DescriptionList, DescriptionItem };
