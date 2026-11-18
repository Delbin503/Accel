import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/**
 * An inline message across the top of a page or inside a form — system
 * alerts, "what changed" notices, form errors. A tinted strip with an icon,
 * an optional bold title run into the message, an optional action and an
 * optional dismiss button.
 *
 * Critical banners are announced right away (`role="alert"`); the others
 * politely (`role="status"`). Pass `role` to override.
 *
 * ```tsx
 * <Banner tone="warning" title="Memory running slow" onDismiss={hide}>
 *   Memory usage is at <strong>68%</strong>.
 * </Banner>
 * ```
 */
const bannerVariants = cva("flex items-center rounded-xl border", {
  variants: {
    tone: {
      info: "border-info/40 bg-info/5",
      success: "border-success/40 bg-success/5",
      warning: "border-warning/40 bg-warning/5",
      critical: "border-severity-critical/40 bg-severity-critical/5",
    },
    size: {
      default: "gap-3 px-4 py-3 text-base",
      sm: "gap-2 rounded-md px-3 py-2 text-sm",
    },
  },
  defaultVariants: { tone: "info", size: "default" },
});

type BannerTone = NonNullable<VariantProps<typeof bannerVariants>["tone"]>;

const TONE_TEXT: Record<BannerTone, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  critical: "text-severity-critical",
};

const TONE_ICON: Record<BannerTone, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  critical: CircleAlert,
};

export interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof bannerVariants> {
  /** Bold lead-in in the tone colour, run into the message. */
  title?: React.ReactNode;
  /** Replaces the tone's default icon. */
  icon?: LucideIcon;
  /** Right-aligned slot — usually one small outline Button. */
  action?: React.ReactNode;
  /** Shows an × button that calls this. */
  onDismiss?: () => void;
  /** Accessible name of the × button. */
  dismissLabel?: string;
}

const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  (
    { tone, size, title, icon, action, onDismiss, dismissLabel = "Dismiss", role, className, children, ...props },
    ref
  ) => {
    const t: BannerTone = tone ?? "info";
    const Icon = icon ?? TONE_ICON[t];
    return (
      <div
        ref={ref}
        data-slot="banner"
        data-tone={t}
        role={role ?? (t === "critical" ? "alert" : "status")}
        className={cn(bannerVariants({ tone: t, size }), className)}
        {...props}
      >
        <Icon data-slot="banner-icon" className={cn("size-4 shrink-0", TONE_TEXT[t])} />
        <p data-slot="banner-message" className={cn("min-w-0 flex-1", title ? "text-muted-foreground" : TONE_TEXT[t])}>
          {title && (
            <>
              <span data-slot="banner-title" className={cn("font-semibold", TONE_TEXT[t])}>
                {title}
              </span>{" "}
            </>
          )}
          {children}
        </p>
        {action && <div data-slot="banner-action" className="shrink-0">{action}</div>}
        {onDismiss && (
          <Button
            data-slot="banner-dismiss"
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="size-auto shrink-0 border-0 text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    );
  }
);
Banner.displayName = "Banner";

export { Banner };
