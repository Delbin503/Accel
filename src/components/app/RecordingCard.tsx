import { Play, MapPin, Check } from "lucide-react";
import { cn } from "@accel/ui/lib/utils";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import type { RecordingDisplay } from "@/mocks/recordings";

/* ── Mode chip ───────────────────────────────────────────────────────────── */

const MODE_STYLES: Record<RecordingDisplay["mode"], { bg: string; text: string; dot: string; label: string }> = {
  continuous: { bg: "bg-primary/10 border-primary/20", text: "text-primary-ink", dot: "bg-primary", label: "Continuous" },
  event:      { bg: "bg-info/10 border-info/20",       text: "text-info",    dot: "bg-info",    label: "Event" },
  scheduled:  { bg: "bg-violet/15 border-violet/20", text: "text-violet",  dot: "bg-violet",  label: "Scheduled" },
};

/** `pill` draws it like User Management's status pill, for the recordings list. */
export function RecordingModeChip({ mode, pill }: { mode: RecordingDisplay["mode"]; pill?: boolean }) {
  const s = MODE_STYLES[mode];
  if (pill) {
    return (
      <span data-slot="recording-mode-chip" className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
        <span data-slot="recording-mode-chip-dot" className={cn("size-1.5 shrink-0 rounded-full", s.dot)} />
        {s.label}
      </span>
    );
  }
  return (
    <span data-slot="recording-mode-chip" className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

/* ── Recording card ──────────────────────────────────────────────────────────
   Shared between the Recordings page (variant="page") and the Cameras detail
   drawer (variant="drawer"). Same thumbnail + structure; only the title,
   location, and footer metric differ by context.

   The card deliberately carries no event/detection counts — recordings are
   presented as footage, and incident triage lives in Detection Feed. ─────── */

export interface RecordingCardProps {
  recording: RecordingDisplay;
  /** "page": camera name + area · site + date footer · "drawer": "Recording · date" + area + duration footer. */
  variant?: "page" | "drawer";
  selected?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  className?: string;
}

export function RecordingCard({
  recording: r,
  variant = "page",
  selected = false,
  onToggle,
  onOpen,
  className,
}: RecordingCardProps) {
  const isDrawer = variant === "drawer";
  return (
    <div
      data-slot="recording-card"
      className={cn(
        "group relative flex flex-col items-stretch overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-px hover:shadow-floating",
        selected ? "border-primary" : "border-border hover:border-primary/40",
        className
      )}
    >
      <button
        data-slot="recording-card-checkbox"
        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        className={cn(
          "absolute left-2.5 top-2.5 z-[var(--z-sticky)] flex size-5 items-center justify-center rounded border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-media-foreground/60 bg-scrim/40 opacity-0 hover:border-media-foreground group-hover:opacity-100",
          selected && "opacity-100"
        )}
        aria-label="Select recording for deletion"
      >
        {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
      </button>

      <button data-slot="recording-card-trigger" onClick={onOpen} className="flex flex-col items-stretch text-left">
        <div data-slot="recording-card-thumbnail" className="relative aspect-video w-full overflow-hidden bg-media-raised">
          <div
            data-slot="recording-card-vignette"
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }}
          />
          <div data-slot="recording-card-play-overlay" className="absolute inset-0 flex items-center justify-center">
            <div data-slot="recording-card-play" className="flex size-10 items-center justify-center rounded-full bg-scrim/40 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="size-4 text-media-foreground" />
            </div>
          </div>
          <div data-slot="recording-card-duration" className="absolute right-2.5 top-2.5 rounded bg-scrim/60 px-1.5 py-0.5 font-mono text-2xs text-media-foreground/90 backdrop-blur-sm">
            {r.durationDisplay}
          </div>
          <div data-slot="recording-card-mode" className={cn("absolute top-2.5 transition-all", selected ? "left-9" : "left-2.5 group-hover:left-9")}>
            <RecordingModeChip mode={r.mode} />
          </div>
          <div data-slot="recording-card-meta" className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 text-2xs text-media-foreground/90">
            <span data-slot="recording-card-start" className="rounded bg-scrim/60 px-1.5 py-0.5 font-mono backdrop-blur-sm">{r.startsAtDisplay}</span>
            <span data-slot="recording-card-size" className="rounded bg-scrim/60 px-1.5 py-0.5 backdrop-blur-sm">{r.fileSizeDisplay}</span>
          </div>
        </div>

        <div data-slot="recording-card-body" className="p-3.5">
          <div data-slot="recording-card-header" className="mb-1 flex items-start justify-between gap-2">
            <TruncatedText
              data-slot="recording-card-title"
              text={isDrawer ? `Recording · ${r.dateLabel}` : r.cameraName}
              className="text-base font-bold text-foreground transition-colors group-hover:text-primary-ink"
            />
            <p data-slot="recording-card-id" className="flex-shrink-0 font-mono text-2xs text-muted-foreground">{r.id}</p>
          </div>
          <p data-slot="recording-card-location" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-2.5" />
            {isDrawer ? r.areaName : `${r.areaName} · ${r.siteName}`}
          </p>
          <div data-slot="recording-card-footer" className="flex items-center justify-end border-t border-border/60 pt-2">
            <span data-slot="recording-card-footer-value" className="font-mono text-2xs text-muted-foreground">
              {isDrawer ? r.durationDisplay : r.dateLabel}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
