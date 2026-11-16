import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { cn } from "../../lib/utils";

/**
 * Right-side drawer showing one record (event, case, camera, user, NVR) while
 * the list behind it stays put. Wraps ui/Sheet with the Accel drawer chrome so
 * pages stop repeating it: fixed width per `size`, a bordered header with
 * actions and a close button, a scrolling body, and a bordered footer row.
 *
 * ```tsx
 * <DetailDrawer open={!!row} onOpenChange={(o) => !o && close()}>
 *   <DetailDrawerHeader actions={<BookmarkButton … />}>
 *     <StatusBadge tone="success">Online</StatusBadge>
 *     <DetailDrawerTitle>Loading Bay 3</DetailDrawerTitle>
 *     <DetailDrawerDescription>CAM-015 · Changi Hub</DetailDrawerDescription>
 *   </DetailDrawerHeader>
 *   <DetailDrawerBody>
 *     <DetailDrawerSection title="Device"><DescriptionList>…</DescriptionList></DetailDrawerSection>
 *   </DetailDrawerBody>
 *   <DetailDrawerFooter>…</DetailDrawerFooter>
 * </DetailDrawer>
 * ```
 */
const detailDrawerVariants = cva("flex max-w-[95vw] flex-col gap-0 p-0 text-base", {
  variants: {
    size: {
      /** Narrow panels: notifications, quick details. */
      md: "w-[min(560px,90vw)]",
      /** Default record drawer (camera, recording, NVR, user). */
      lg: "w-[min(860px,58vw)]",
      /** Media-heavy records (event clips, case timelines). */
      xl: "w-[min(1080px,72vw)]",
    },
  },
  defaultVariants: { size: "lg" },
});

export interface DetailDrawerProps extends VariantProps<typeof detailDrawerVariants> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Page-specific layer name for the drawer root (defaults to "detail-drawer"). */
  "data-slot"?: string;
}

function DetailDrawer({ open, onOpenChange, size, className, children, "data-slot": slot = "detail-drawer" }: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        data-slot={slot}
        data-size={size ?? "lg"}
        className={cn(detailDrawerVariants({ size }), className)}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}

export interface DetailDrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Buttons shown left of the close button (bookmark, open in new tab…). */
  actions?: React.ReactNode;
  /** Hide the built-in close button (the drawer still closes on Esc / overlay). */
  hideClose?: boolean;
}

function DetailDrawerHeader({ actions, hideClose, className, children, ...props }: DetailDrawerHeaderProps) {
  return (
    <SheetHeader
      data-slot="detail-drawer-header"
      className={cn("gap-0 border-b border-border bg-card px-5 py-4", className)}
      {...props}
    >
      <div data-slot="detail-drawer-header-row" className="flex items-start justify-between gap-3">
        <div data-slot="detail-drawer-header-content" className="flex min-w-0 flex-1 flex-col gap-1.5">
          {children}
        </div>
        {(actions || !hideClose) && (
          <div data-slot="detail-drawer-header-actions" className="mt-0.5 flex shrink-0 items-center gap-1">
            {actions}
            {!hideClose && (
              <SheetClose asChild>
                <Button
                  data-slot="detail-drawer-close"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  className="size-7 text-muted-foreground hover:text-foreground"
                >
                  <X />
                </Button>
              </SheetClose>
            )}
          </div>
        )}
      </div>
    </SheetHeader>
  );
}

function DetailDrawerTitle({ className, ...props }: React.ComponentProps<typeof SheetTitle>) {
  return (
    <SheetTitle
      data-slot="detail-drawer-title"
      className={cn("min-w-0 truncate text-lg font-bold text-foreground", className)}
      {...props}
    />
  );
}

function DetailDrawerDescription({ className, ...props }: React.ComponentProps<typeof SheetDescription>) {
  return (
    <SheetDescription
      data-slot="detail-drawer-description"
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground [&_svg]:size-3", className)}
      {...props}
    />
  );
}

function DetailDrawerBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="detail-drawer-body"
      // Children never shrink: the body scrolls instead of squashing fixed-height
      // blocks (video frames, skeletons) to 0.
      className={cn("flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-5 [&>*]:shrink-0", className)}
      {...props}
    />
  );
}

export interface DetailDrawerSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title: React.ReactNode;
  /** Control on the right of the section title (link, toggle, count). */
  action?: React.ReactNode;
}

function DetailDrawerSection({ title, action, className, children, ...props }: DetailDrawerSectionProps) {
  const id = React.useId();
  return (
    <section data-slot="detail-drawer-section" aria-labelledby={id} className={cn("flex flex-col gap-2", className)} {...props}>
      <div data-slot="detail-drawer-section-header" className="flex items-center justify-between gap-2">
        <h3 id={id} data-slot="detail-drawer-section-title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function DetailDrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="detail-drawer-footer"
      className={cn(
        "flex items-center justify-end gap-3 border-t border-border bg-card px-5 py-3.5 [&>[data-slot=detail-drawer-footer-start]]:mr-auto",
        className
      )}
      {...props}
    />
  );
}

/** Left-aligned footer content (destructive action, hint text). */
function DetailDrawerFooterStart({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="detail-drawer-footer-start" className={cn("flex items-center gap-3", className)} {...props} />;
}

export {
  DetailDrawer,
  DetailDrawerHeader,
  DetailDrawerTitle,
  DetailDrawerDescription,
  DetailDrawerBody,
  DetailDrawerSection,
  DetailDrawerFooter,
  DetailDrawerFooterStart,
};
