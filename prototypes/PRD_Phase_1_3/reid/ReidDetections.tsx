import { ArrowUpRight, LocateFixed, Radar, X } from "lucide-react";
import { createPortal } from "react-dom";
import { DETECTION_CARDS_ATTR } from "../cameraPlayer";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/detection";
import { agoLabel, plainSummary, type LiveDetection } from "./liveDetections";

/* Live detections on the camera wall — the side panel's Detections tab and the
   card stack in the bottom corner. Both open the event in the Detection Feed. */

const SEVERITY_LABEL: Record<Severity, string> = { critical: "Critical", medium: "Medium", low: "Low" };

const SEVERITY_EDGE: Record<Severity, string> = {
  critical: "before:bg-sev-critical",
  medium: "before:bg-sev-medium",
  low: "before:bg-sev-low",
};

function whereLabel(d: LiveDetection) {
  return `${d.event.camera} · ${d.event.areaDisplay} · ${d.event.siteDisplay}`;
}

/* ── Side panel tab ──────────────────────────────────────────────────── */

export function DetectionsPanel({ detections, now, onOpen, onLocate }: {
  detections: LiveDetection[];
  now: number;
  /** Opens the event's details drawer in the Detection Feed. */
  onOpen: (d: LiveDetection) => void;
  /** Outlines the camera that raised it on the wall. */
  onLocate: (cameraId: string) => void;
}) {
  const critical = detections.filter((d) => d.event.severity === "critical").length;

  return (
    <>
      <div className="flex-shrink-0 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-sev-critical" />
            Live detections
          </p>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">{detections.length}</strong>
            {critical > 0 && <> · <strong className="text-sev-critical">{critical}</strong> critical</>}
          </p>
        </div>
        <p className="mt-2 text-2xs text-muted-foreground">
          Newest first. Click a detection to open its details in the Detection Feed.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {detections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Radar className="size-5" />
            <p className="text-sm">No detections yet.</p>
            <p className="text-2xs">They appear here as soon as a camera raises one.</p>
          </div>
        ) : (
          detections.map((d) => (
            <div
              key={d.id}
              className={cn(
                "group/det relative overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-primary/40",
                "before:absolute before:inset-y-0 before:left-0 before:w-1",
                SEVERITY_EDGE[d.event.severity]
              )}
            >
              <button
                type="button"
                onClick={() => onOpen(d)}
                aria-label={`Open ${d.event.typeLabel} on ${d.event.camera} in the Detection Feed`}
                className="block w-full py-2.5 pl-3.5 pr-9 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-2">
                  <StatusBadge tone={d.event.severity} dot={false}>{SEVERITY_LABEL[d.event.severity]}</StatusBadge>
                  <span className="ml-auto shrink-0 font-mono text-2xs text-muted-foreground">{agoLabel(d.at, now)}</span>
                </span>
                <span className="mt-1.5 block truncate text-sm font-semibold text-foreground">{d.event.typeLabel}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{plainSummary(d.event.summary)}</span>
                <span className="mt-1.5 flex items-center gap-1 text-2xs text-muted-foreground">
                  <span className="truncate font-mono">{whereLabel(d)}</span>
                  <ArrowUpRight className="ml-auto size-3 shrink-0 opacity-0 transition-opacity group-hover/det:opacity-100" />
                </span>
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Show ${d.event.camera} on the wall`}
                    onClick={() => onLocate(d.event.camera)}
                    className="absolute bottom-2 right-2 flex size-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover/det:opacity-100"
                  >
                    <LocateFixed className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Show {d.event.camera} on the wall</TooltipContent>
              </Tooltip>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ── Corner card stack ───────────────────────────────────────────────── */

const VISIBLE_CARDS = 3;

/**
 * New detections stack in the bottom-right corner, newest nearest the edge.
 * `lift` raises the stack clear of the selection / playback bar when one is up.
 */
export function DetectionCardStack({ cards, now, lift, onOpen, onDismiss, onClearAll, onShowAll }: {
  cards: LiveDetection[];
  now: number;
  lift: "none" | "selection" | "playback";
  onOpen: (d: LiveDetection) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
  /** Opens the Detections tab, for the cards that don't fit in the stack. */
  onShowAll: () => void;
}) {
  if (cards.length === 0) return null;
  const visible = cards.slice(0, VISIBLE_CARDS);
  const hidden = cards.length - visible.length;

  /* Portalled to <body> so the stack also shows over the expanded camera view.
     A modal turns pointer events off for everything outside it; the inline
     style turns them back on here, and DETECTION_CARDS_ATTR lets the modal
     tell a click on a card from a click-away that should close it. */
  return createPortal(
    <div
      aria-live="polite"
      aria-label="New detections"
      {...{ [DETECTION_CARDS_ATTR]: "" }}
      style={{ pointerEvents: "auto" }}
      className={cn(
        "fixed right-6 z-[var(--z-toast)] flex w-[340px] max-w-[calc(100vw-3rem)] flex-col-reverse gap-2 transition-[bottom] duration-[var(--duration-normal)] ease-standard",
        lift === "playback" ? "bottom-48" : lift === "selection" ? "bottom-28" : "bottom-6"
      )}
    >
      {visible.map((d) => (
        <div
          key={d.id}
          role="status"
          className={cn(
            "relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg transition-colors hover:border-primary/40",
            "before:absolute before:inset-y-0 before:left-0 before:w-1",
            SEVERITY_EDGE[d.event.severity],
            "animate-in fade-in-0 slide-in-from-bottom-2 duration-[var(--duration-normal)]"
          )}
        >
          <button
            type="button"
            onClick={() => onOpen(d)}
            aria-label={`Open ${d.event.typeLabel} on ${d.event.camera} in the Detection Feed`}
            className="block w-full py-3 pl-4 pr-10 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center gap-2">
              <StatusBadge tone={d.event.severity} dot={false}>{SEVERITY_LABEL[d.event.severity]}</StatusBadge>
              <span className="min-w-0 truncate text-sm font-semibold text-foreground">{d.event.typeLabel}</span>
            </span>
            <span className="mt-1.5 line-clamp-2 block text-xs text-muted-foreground">{plainSummary(d.event.summary)}</span>
            <span className="mt-1.5 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
              <span className="truncate font-mono">{whereLabel(d)}</span>
              <span className="shrink-0 font-mono">{agoLabel(d.at, now)}</span>
            </span>
          </button>
          <button
            type="button"
            aria-label={`Dismiss ${d.event.typeLabel} notification`}
            onClick={() => onDismiss(d.id)}
            className="absolute right-2 top-2 flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}

      <div className="flex items-center justify-end gap-2">
        {hidden > 0 && (
          <button
            type="button"
            onClick={onShowAll}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-2xs font-semibold text-foreground shadow-sm hover:border-primary/40"
          >
            +{hidden} more
          </button>
        )}
        {cards.length > 1 && (
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-2xs font-semibold text-muted-foreground shadow-sm hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
