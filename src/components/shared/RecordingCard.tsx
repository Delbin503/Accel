import { Play, MapPin, CircleDot, AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TruncatedText } from "@/components/shared/TruncatedText";
import type { RecordingDisplay } from "@/mocks/recordings";

/* ── Mode chip ───────────────────────────────────────────────────────────── */

const MODE_STYLES: Record<RecordingDisplay["mode"], { bg: string; text: string; label: string }> = {
  continuous: { bg: "bg-primary/10 border-primary/20", text: "text-primary", label: "Continuous" },
  event:      { bg: "bg-info/10 border-info/20",       text: "text-info",    label: "Event" },
  scheduled:  { bg: "bg-purple-soft border-purple/20", text: "text-purple",  label: "Scheduled" },
};

export function RecordingModeChip({ mode }: { mode: RecordingDisplay["mode"] }) {
  const s = MODE_STYLES[mode];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

/* ── Recording card ──────────────────────────────────────────────────────────
   Shared between the Recordings page (variant="page") and the Cameras detail
   drawer (variant="drawer"). Same thumbnail + structure; only the title,
   location, and footer metrics differ by context. ────────────────────────── */

export interface RecordingCardProps {
  recording: RecordingDisplay;
  /** "page": camera name + area · site + date footer · "drawer": "Recording · date" + area + duration footer. */
  variant?: "page" | "drawer";
  selected?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  /** Page-only: number of period detections to surface as a "detected" badge. */
  detectedCount?: number;
  className?: string;
}

export function RecordingCard({
  recording: r,
  variant = "page",
  selected = false,
  onToggle,
  onOpen,
  detectedCount = 0,
  className,
}: RecordingCardProps) {
  const isDrawer = variant === "drawer";
  return (
    <div
      className={cn(
        "group relative flex flex-col items-stretch overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-px hover:shadow-md",
        selected ? "border-primary" : "border-border hover:border-primary/40",
        className
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
        className={cn(
          "absolute left-2.5 top-2.5 z-20 flex size-5 items-center justify-center rounded border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-white/60 bg-black/40 opacity-0 hover:border-white group-hover:opacity-100",
          selected && "opacity-100"
        )}
        aria-label="Select recording for deletion"
      >
        {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
      </button>

      <button onClick={onOpen} className="flex flex-col items-stretch text-left">
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="size-4 text-white" />
            </div>
          </div>
          <div className="absolute right-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-2xs text-white/90 backdrop-blur-sm">
            {r.durationDisplay}
          </div>
          <div className={cn("absolute top-2.5 transition-all", selected ? "left-9" : "left-2.5 group-hover:left-9")}>
            <RecordingModeChip mode={r.mode} />
          </div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 text-2xs text-white/90">
            <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono backdrop-blur-sm">{r.startsAtDisplay}</span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">{r.fileSizeDisplay}</span>
          </div>
        </div>

        <div className="p-3.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <TruncatedText
              text={isDrawer ? `Recording · ${r.dateLabel}` : r.cameraName}
              className="text-base font-bold text-foreground transition-colors group-hover:text-primary"
            />
            <p className="flex-shrink-0 font-mono text-2xs text-muted-foreground">{r.id}</p>
          </div>
          <p className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-2.5" />
            {isDrawer ? r.areaName : `${r.areaName} · ${r.siteName}`}
          </p>
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-2xs font-semibold text-success">
              <CircleDot className="size-2.5" />
              {r.eventCount} events
            </span>
            {isDrawer ? (
              <span className="font-mono text-2xs text-muted-foreground">{r.durationDisplay}</span>
            ) : (
              <>
                {detectedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-2xs text-sev-critical">
                    <AlertTriangle className="size-2.5" />
                    {detectedCount} detected
                  </span>
                )}
                <span className="font-mono text-2xs text-muted-foreground">{r.dateLabel}</span>
              </>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
