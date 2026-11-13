import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// Accel: SegmentedControl — a row of mutually exclusive (type="single") or
// combinable (type="multiple") options, built on Radix ToggleGroup for roving
// focus, arrow-key navigation and aria-pressed. Use it for view switchers,
// state pickers and filter chips instead of hand-rolled <button> groups.
// Tabs is still the right choice when each option swaps a content panel.

const segmentedControlVariants = cva(
  "inline-flex w-fit items-center gap-0.5",
  {
    variants: {
      variant: {
        // Muted track, active segment raised on a card surface.
        default: "rounded-lg bg-muted p-0.5",
        // Separate outlined pills — filter chips, tag pickers.
        outline: "flex-wrap gap-1.5",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

const segmentedControlItemVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium outline-none transition-colors duration-[var(--duration-fast)] focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "rounded-md text-muted-foreground hover:text-foreground data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-raised",
        outline:
          "rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:border-primary/40 data-[state=on]:bg-primary/10 data-[state=on]:text-primary-ink",
      },
      size: {
        sm: "h-6 px-2 text-xs",
        default: "h-7 px-2.5 text-sm",
        lg: "h-8 px-3 text-base",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

type SegmentedControlContextValue = VariantProps<typeof segmentedControlItemVariants>
const SegmentedControlContext = React.createContext<SegmentedControlContextValue>({
  variant: "default",
  size: "default",
})

function SegmentedControl({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof segmentedControlItemVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="segmented-control"
      data-variant={variant ?? "default"}
      className={cn(segmentedControlVariants({ variant }), className)}
      {...props}
    >
      <SegmentedControlContext.Provider value={{ variant, size }}>
        {children}
      </SegmentedControlContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function SegmentedControlItem({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof segmentedControlItemVariants>) {
  const ctx = React.useContext(SegmentedControlContext)
  return (
    <ToggleGroupPrimitive.Item
      data-slot="segmented-control-item"
      className={cn(
        segmentedControlItemVariants({
          variant: variant ?? ctx.variant,
          size: size ?? ctx.size,
        }),
        className
      )}
      {...props}
    />
  )
}

export { SegmentedControl, SegmentedControlItem }
