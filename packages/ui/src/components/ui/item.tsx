import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// Accel: Item — a list row or card that is itself the click target (model
// picker rows, site cards, settings-section nav). `Item` renders a static div;
// `ItemButton` renders a real <button> with focus ring, selected state
// (`selected` → aria-pressed + data-selected) and disabled handling. Compose
// the inside with ItemMedia / ItemContent / ItemTitle / ItemDescription /
// ItemActions. Use variant="plain" when the caller supplies its own layout
// classes (migrations); the default variants cover new UI.

const itemVariants = cva(
  "group/item flex w-full min-w-0 items-center gap-3 text-left text-base text-foreground outline-none transition-colors duration-[var(--duration-fast)]",
  {
    variants: {
      variant: {
        default: "rounded-lg px-3 py-2.5",
        outline: "rounded-lg border border-border bg-card px-3 py-2.5",
        muted: "rounded-lg bg-muted px-3 py-2.5",
        plain: "",
      },
      size: {
        default: "",
        sm: "gap-2 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

// Every ItemButton — including variant="plain" — keeps a visible keyboard
// focus ring and disabled handling; only hover/selected fills are opt-out.
const itemButtonBase =
  "cursor-pointer focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
const itemButtonStates =
  "hover:bg-muted data-[selected=true]:border-primary data-[selected=true]:bg-primary/10"

type ItemVariantProps = VariantProps<typeof itemVariants>

function Item({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"div"> & ItemVariantProps) {
  return (
    <div
      data-slot="item"
      data-variant={variant ?? "default"}
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ItemButton({
  className,
  variant,
  size,
  selected,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & ItemVariantProps & { selected?: boolean }) {
  return (
    <button
      data-slot="item-button"
      data-variant={variant ?? "default"}
      data-selected={selected ? "true" : undefined}
      aria-pressed={selected}
      type={type}
      className={cn(itemVariants({ variant, size }), itemButtonBase, variant !== "plain" && itemButtonStates, className)}
      {...props}
    />
  )
}

function ItemMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-media"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-content" className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)} {...props} />
}

function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn("truncate text-base font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn("line-clamp-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="item-actions" className={cn("flex shrink-0 items-center gap-2", className)} {...props} />
}

export { Item, ItemButton, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions }
