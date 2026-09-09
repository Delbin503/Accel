import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Canonical modal shell for every dialog in the app.
 *
 * Before this existed each page hand-rolled `Dialog` + `DialogContent` +
 * header/body/footer classes, which drifted: seven header variants, six footer
 * variants, six widths and a dozen modals with no description in the header.
 * This shell owns that chrome so a page only supplies content.
 *
 * Layout contract — always header / body / footer, in that order:
 *
 *   <Modal open={open} onOpenChange={setOpen}>
 *     <ModalContent size="lg">
 *       <ModalHeader title="Edit Camera" description="Camera ID cannot be changed." />
 *       <ModalBody>…fields…</ModalBody>
 *       <ModalFooter>
 *         <Button variant="ghost" size="sm">Cancel</Button>
 *         <Button size="sm">Save Changes</Button>
 *       </ModalFooter>
 *     </ModalContent>
 *   </Modal>
 *
 * `ModalSubheader` is the only sanctioned slot between header and body — for a
 * wizard stepper or a sticky search/filter strip.
 */

/**
 * `sm:max-w-[95vw]` is load-bearing: the `DialogContent` primitive ships
 * `sm:max-w-lg`, and `cn()`'s tailwind-merge only drops it when a class with
 * the same variant + property is passed. Without it every modal renders 512px
 * wide and `size` is silently ignored.
 */
const modalVariants = cva(
  "flex max-h-[85vh] max-w-[95vw] flex-col overflow-hidden p-0 sm:max-w-[95vw]",
  {
    variants: {
      size: {
        /** Confirmations and single-message destructive prompts. */
        sm: "w-[440px]",
        /** Default — forms, detail panels, pickers, lists. */
        lg: "w-[560px]",
        /** Canvas work that needs room (detection zones, media). */
        xl: "w-[840px]",
        /** Full-bleed editors (floor plan). */
        full: "max-h-[92vh] w-[1320px] max-w-[97vw] sm:max-w-[97vw]",
      },
    },
    defaultVariants: {
      size: "lg",
    },
  }
);

/** Root. Thin pass-through to Radix so `Modal`/`ModalContent` compose like shadcn. */
function Modal(props: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

export interface ModalContentProps
  extends React.ComponentProps<typeof DialogContent>,
    VariantProps<typeof modalVariants> {}

function ModalContent({ size, className, ...props }: ModalContentProps) {
  return (
    <DialogContent
      className={cn(modalVariants({ size }), className)}
      {...props}
    />
  );
}

/**
 * `model` is the app-wide purple accent for anything model/AI-derived (it
 * matches the `MODEL` badge), kept as a named tone so pages don't hand-colour
 * header icons.
 */
type ModalTone =
  | "default"
  | "destructive"
  | "warning"
  | "success"
  | "model";

const TONE_TITLE: Record<ModalTone, string> = {
  default: "text-foreground",
  destructive: "text-destructive",
  warning: "text-warning",
  success: "text-foreground",
  model: "text-foreground",
};

const TONE_ICON: Record<ModalTone, string> = {
  default: "text-primary",
  destructive: "text-destructive",
  warning: "text-warning",
  success: "text-success",
  model: "text-purple",
};

export interface ModalHeaderProps {
  title: React.ReactNode;
  /**
   * Required on purpose — a modal that cannot say what it does in one line is
   * usually doing too much. Pass `null` only for chrome-less media modals.
   */
  description: React.ReactNode;
  /**
   * Rendered before the title and coloured by `tone`. Lucide icons satisfy
   * this, as do the project's hand-drawn glyphs (e.g. `CoinIcon`).
   */
  icon?: React.ComponentType<{ className?: string }>;
  tone?: ModalTone;
  className?: string;
}

function ModalHeader({
  title,
  description,
  icon: Icon,
  tone = "default",
  className,
}: ModalHeaderProps) {
  return (
    <DialogHeader
      className={cn("flex-shrink-0 border-b border-border px-5 py-4", className)}
    >
      <DialogTitle
        className={cn(
          "flex items-center gap-2 pr-8 text-base font-bold",
          TONE_TITLE[tone]
        )}
      >
        {Icon ? <Icon className={cn("size-4 shrink-0", TONE_ICON[tone])} /> : null}
        {title}
      </DialogTitle>
      {description ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </DialogHeader>
  );
}

/** Stepper / search strip between the header and the scrolling body. */
function ModalSubheader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex-shrink-0 border-b border-border bg-background/40 px-5 py-3",
        className
      )}
      {...props}
    />
  );
}

/** The single scroll region. Everything else in the shell stays pinned. */
function ModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-5 py-4", className)}
      {...props}
    />
  );
}

function ModalFooter({
  className,
  align = "end",
  ...props
}: React.ComponentProps<"div"> & { align?: "end" | "between" }) {
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center gap-2 border-t border-border px-5 py-3.5",
        align === "between" ? "justify-between" : "justify-end",
        className
      )}
      {...props}
    />
  );
}

export { Modal, ModalContent, ModalHeader, ModalSubheader, ModalBody, ModalFooter };
