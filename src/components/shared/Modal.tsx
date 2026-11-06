import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
 *
 * Look (the 2026 redesign, reviewed in the Modal Gallery): a 16px neutral
 * title with no divider under it; the description is kept for screen readers
 * but not shown; no icons in the header, on footer buttons or beside field
 * labels; regular sizes (sm / lg) are one 550px width with a capped height that
 * scrolls. Footers carry one action — close is the ✕ / Esc, not a Cancel button.
 * The previous look survives only as the gallery's "classic" chrome.
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
  // Placed side by side (gallery compare): non-modal, so both dialogs stay
  // visible and usable at once. Centered modals (every page) are unchanged.
  const placed = React.useContext(ModalPlacementContext) !== "center";
  return <Dialog {...props} modal={placed ? false : props.modal} />;
}

/**
 * Chrome. "plain" is the app's look (see the header comment). "classic" is the
 * pre-redesign look — bordered header, visible description, icons, per-size
 * widths — kept only so the Modal Gallery can show the old side of a compare.
 * Context reaches through the dialog portal, so a provider around a modal
 * styles it without touching it.
 */
type ModalChrome = "plain" | "classic";

const ModalChromeContext = React.createContext<ModalChrome>("plain");

/**
 * Opt-in placement, also gallery-only: "left" / "right" put the dialog in that
 * half of the screen so two can be compared side by side. Default "center".
 */
type ModalPlacement = "center" | "left" | "right";

const ModalPlacementContext = React.createContext<ModalPlacement>("center");

/**
 * Opt-in "tidy" frame, gallery-only, for form modals previewed in place (no
 * redesigned copy): the redesign's 550px width, a capped height so long forms
 * scroll inside the body, and no ghost (Cancel) footer buttons — ✕ / Esc close.
 * Only applies with the plain chrome, and only to the regular sm / lg sizes.
 */
const ModalTidyContext = React.createContext(false);

/**
 * Opt-in uniform width, gallery-only: the redesign's 550px for any size but
 * "full" (full-bleed editors keep their room). Width only — unlike tidy, it
 * leaves the height and footer buttons alone.
 */
const ModalUniformWidthContext = React.createContext(false);

const PLACEMENT_CLASS: Record<Exclude<ModalPlacement, "center">, string> = {
  left: "left-1/4 max-w-[46vw] sm:max-w-[46vw]",
  right: "left-3/4 max-w-[46vw] sm:max-w-[46vw]",
};

function ModalChromeProvider({
  chrome,
  placement = "center",
  tidy = false,
  uniformWidth = false,
  children,
}: {
  chrome: ModalChrome;
  placement?: ModalPlacement;
  tidy?: boolean;
  uniformWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ModalChromeContext.Provider value={chrome}>
      <ModalPlacementContext.Provider value={placement}>
        <ModalTidyContext.Provider value={tidy}>
          <ModalUniformWidthContext.Provider value={uniformWidth}>{children}</ModalUniformWidthContext.Provider>
        </ModalTidyContext.Provider>
      </ModalPlacementContext.Provider>
    </ModalChromeContext.Provider>
  );
}

function useTidy() {
  const chrome = React.useContext(ModalChromeContext);
  const tidy = React.useContext(ModalTidyContext);
  return chrome === "plain" && tidy;
}

export interface ModalContentProps
  extends React.ComponentProps<typeof DialogContent>,
    VariantProps<typeof modalVariants> {}

function ModalContent({ size, className, onInteractOutside, ...props }: ModalContentProps) {
  const placement = React.useContext(ModalPlacementContext);
  const plain = React.useContext(ModalChromeContext) === "plain";
  // One width for every regular modal, with a height cap so long forms scroll inside.
  const regularFrame = plain && (size == null || size === "sm" || size === "lg");
  const tidyFrame = useTidy() && (size == null || size === "sm" || size === "lg");
  const uniform = React.useContext(ModalUniformWidthContext) && size !== "full";
  return (
    <DialogContent
      className={cn(
        modalVariants({ size }),
        regularFrame && "w-[550px] max-h-[70vh]",
        placement !== "center" && PLACEMENT_CLASS[placement],
        className,
        tidyFrame && "w-[550px] max-h-[70vh]",
        uniform && "w-[550px]"
      )}
      onInteractOutside={(e) => {
        onInteractOutside?.(e);
        // Side by side, clicking one dialog mustn't close the other.
        if (placement !== "center") e.preventDefault();
      }}
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
   * One line on what the modal does. Read to screen readers (aria-describedby);
   * only the gallery's "classic" chrome shows it on screen. Optional: put
   * anything the user must read in the body instead.
   */
  description?: React.ReactNode;
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
  const plain = React.useContext(ModalChromeContext) === "plain";
  return (
    <DialogHeader
      className={cn(
        "flex-shrink-0 px-5 py-4",
        plain ? "pb-0 text-left" : "border-b border-border",
        className
      )}
    >
      <DialogTitle
        className={cn(
          "flex items-center gap-2 pr-8 font-bold",
          // Titles stay neutral; a red action button carries any danger.
          plain ? "text-lg text-foreground" : cn("text-base", TONE_TITLE[tone])
        )}
      >
        {Icon && !plain ? <Icon className={cn("size-4 shrink-0", TONE_ICON[tone])} /> : null}
        {title}
      </DialogTitle>
      {description ? (
        <DialogDescription className={plain ? "sr-only" : "mt-0.5 text-sm text-muted-foreground"}>
          {description}
        </DialogDescription>
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
  // Plain chrome has no header divider, so the body sits closer to the title,
  // and field labels drop their leading icons (icons inside inputs stay).
  const plain = React.useContext(ModalChromeContext) === "plain";
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-5 py-4", plain && "pt-0 [&_label>svg]:hidden", className)}
      {...props}
    />
  );
}

function ModalFooter({
  className,
  align = "end",
  ...props
}: React.ComponentProps<"div"> & { align?: "end" | "between" }) {
  const plain = React.useContext(ModalChromeContext) === "plain";
  const tidy = useTidy();
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center gap-2 border-t border-border px-5 py-3.5",
        align === "between" ? "justify-between" : "justify-end",
        plain && "[&_button_svg:not(.animate-spin)]:hidden",
        // Cancel is a ghost button, or an outline one leading a multi-button footer.
        tidy && "[&_button[data-variant=ghost]]:hidden [&_button[data-variant=outline]:first-child:not(:last-child)]:hidden",
        className
      )}
      {...props}
    />
  );
}

export { Modal, ModalChromeProvider, ModalContent, ModalHeader, ModalSubheader, ModalBody, ModalFooter };
