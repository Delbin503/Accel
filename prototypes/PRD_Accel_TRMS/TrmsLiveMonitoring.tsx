import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, BellRing, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { cn } from "@/lib/utils";
import { SyncPlaybackMonitoring } from "../PRD_Phase_1_3/SyncPlaybackMonitoring";
import { useTrmsStore } from "./useTrmsStore";
import {
  ACTIVE_ASSIGNMENT,
  KIND_LABEL,
  REGISTERED_WEAPONS,
  STATIONS,
  type DetectionKind,
  type TrmsDetection,
} from "./trmsData";
import { elapsedClock, hhmmss, relativeTime, whereLabel } from "./trmsFormat";
import { DetectionHeading, KindIcon, StatusChip } from "./detectionUi";

/* Live Monitoring for TRMS — the Phase 1.3 page, with the visitor analytics
   swapped for the assignment in progress, and every new detection surfaced
   as a card at the bottom of the screen. */

/** How often the prototype's simulated feed raises a detection. */
const FEED_INTERVAL_MS = 9000;
/** Cards shown at once — older ones fold into the "+N more" chip. */
const VISIBLE_TOASTS = 3;

/* ── KPIs ────────────────────────────────────────────────────────────── */

function TrmsKpis({ detections, now, onOpenKind }: {
  detections: TrmsDetection[];
  now: number;
  onOpenKind: (kind: DetectionKind) => void;
}) {
  const people = detections.filter((d) => d.kind === "person");
  const weapons = detections.filter((d) => d.kind === "weapon");
  const unassigned = weapons.filter((d) => !d.assignmentId).length;

  return (
    <KpiGrid cols={5}>
      <KpiCard
        label="Person Timer"
        value={<span className="font-mono">{elapsedClock(ACTIVE_ASSIGNMENT.startedAt, now)}</span>}
        sub={`${ACTIVE_ASSIGNMENT.person} on assignment`}
        accent="primary"
      />
      <KpiCard
        label="Assignment ID"
        value={<span className="font-mono">{ACTIVE_ASSIGNMENT.id}</span>}
        sub={`${ACTIVE_ASSIGNMENT.stationId} › Lane ${ACTIVE_ASSIGNMENT.lane} · ${ACTIVE_ASSIGNMENT.weaponSerial}`}
        accent="info"
      />
      <KpiCard
        label="Person Detected"
        value={String(people.length)}
        sub="Today, across all cameras"
        accent="success"
        onClick={() => onOpenKind("person")}
      />
      <KpiCard
        label="Weapon Detected"
        value={String(weapons.length)}
        sub={unassigned > 0 ? `${unassigned} with no active assignment` : "All on an assignment"}
        accent={unassigned > 0 ? "sev-critical" : "warning"}
        onClick={() => onOpenKind("weapon")}
      />
      <KpiCard
        label="Weapon Registered"
        value={String(REGISTERED_WEAPONS.length)}
        sub={`Across ${STATIONS.length} base stations`}
        accent="purple"
      />
    </KpiGrid>
  );
}

/* ── Toast stack ─────────────────────────────────────────────────────── */

const SEVERITY_EDGE = {
  critical: "before:bg-sev-critical",
  medium: "before:bg-sev-medium",
  low: "before:bg-sev-low",
} as const;

function DetectionToast({ detection: d, now, onOpen, onDismiss }: {
  detection: TrmsDetection;
  now: number;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      className={cn(
        "relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        SEVERITY_EDGE[d.severity],
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-[var(--duration-normal)]"
      )}
    >
      <button type="button" onClick={onOpen} className="block w-full py-3 pl-4 pr-9 text-left">
        <DetectionHeading detection={d} />
        <p className="mt-1.5 flex items-center justify-between gap-2 text-2xs text-muted-foreground">
          <span className="truncate">{whereLabel(d)}</span>
          <span className="shrink-0 font-mono">{relativeTime(d.at, now)}</span>
        </p>
      </button>
      <button
        type="button"
        aria-label={`Dismiss ${KIND_LABEL[d.kind]} notification`}
        onClick={onDismiss}
        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/**
 * New detections stack in the bottom corner, newest nearest the edge. It sits
 * above the camera selection bar when one is showing, rather than over it.
 */
function DetectionToastStack({ toasts, now, lifted, onOpen, onDismiss, onClearAll }: {
  toasts: TrmsDetection[];
  now: number;
  lifted: boolean;
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}) {
  if (toasts.length === 0) return null;
  const visible = toasts.slice(0, VISIBLE_TOASTS);
  const hidden = toasts.length - visible.length;

  return (
    <div
      aria-live="polite"
      className={cn(
        "fixed right-6 z-[var(--z-toast)] flex w-[340px] flex-col-reverse gap-2 transition-[bottom] duration-[var(--duration-normal)] ease-standard",
        lifted ? "bottom-28" : "bottom-6"
      )}
    >
      {visible.map((d) => (
        <DetectionToast
          key={d.id}
          detection={d}
          now={now}
          onOpen={() => onOpen(d.id)}
          onDismiss={() => onDismiss(d.id)}
        />
      ))}
      <div className="flex items-center justify-end gap-2">
        {hidden > 0 && (
          <button
            type="button"
            onClick={() => onOpen(toasts[0].id)}
            className="rounded-full border border-border bg-card px-2.5 py-1 text-2xs font-semibold text-foreground shadow-sm hover:border-primary/40"
          >
            +{hidden} more
          </button>
        )}
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full border border-border bg-card px-2.5 py-1 text-2xs font-semibold text-muted-foreground shadow-sm hover:text-foreground"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}

/* ── Drawer: every detected event ────────────────────────────────────── */

type KindFilter = "all" | DetectionKind;

function DetectedEventsDrawer({ open, onOpenChange, detections, focusId, kind, onKindChange, now }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detections: TrmsDetection[];
  focusId: string | null;
  kind: KindFilter;
  onKindChange: (k: KindFilter) => void;
  now: number;
}) {
  const navigate = useNavigate();
  const shown = detections.filter((d) => kind === "all" || d.kind === kind);
  const counts = {
    all: detections.length,
    person: detections.filter((d) => d.kind === "person").length,
    weapon: detections.filter((d) => d.kind === "weapon").length,
  };

  // Bring the clicked card's row into view once the drawer has laid out.
  const focusRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (open && focusId) focusRef.current?.scrollIntoView({ block: "center" });
  }, [open, focusId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[min(520px,92vw)] max-w-[92vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-lg font-bold">
            <BellRing className="size-4 text-primary" />
            Detected Events
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Everything the cameras have raised today. Each one is the same record in the Alert Log.
          </p>
          <div className="mt-2 flex gap-1.5">
            {(["all", "person", "weapon"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onKindChange(k)}
                aria-pressed={kind === k}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                  kind === k
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {k !== "all" && <KindIcon kind={k} className="size-3" />}
                {k === "all" ? "All" : k === "person" ? "Person" : "Weapon"}
                <span className="font-mono">{counts[k]}</span>
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {shown.map((d) => {
            const focused = d.id === focusId;
            return (
              <div
                key={d.id}
                ref={focused ? focusRef : undefined}
                className={cn(
                  "rounded-lg border bg-card p-3 transition-colors",
                  focused ? "border-primary shadow-[0_0_0_1px_var(--primary)]" : "border-border"
                )}
              >
                <DetectionHeading detection={d} />
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted-foreground">
                  <span className="font-mono text-foreground">{d.id}</span>
                  <span>{whereLabel(d)}</span>
                  <span className="font-mono">{hhmmss(d.at)}</span>
                  <span>{relativeTime(d.at, now)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <StatusChip detection={d} />
                  <button
                    type="button"
                    onClick={() => navigate("/alerts", { state: { eventId: d.id } })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Open in Alert Log
                    <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {shown.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">No detections of this kind yet.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export function TrmsLiveMonitoring() {
  const detections = useTrmsStore((s) => s.detections);
  const raise = useTrmsStore((s) => s.raise);

  const [toastIds, setToastIds] = React.useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [focusId, setFocusId] = React.useState<string | null>(null);
  const [kind, setKind] = React.useState<KindFilter>("all");
  const [selectionCount, setSelectionCount] = React.useState(0);

  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  /* Simulated live feed. The first one lands quickly so the page is not
     silent on arrival; after that, a steady cadence. Weapons outnumber people
     two to one, roughly what an armoury camera sees. */
  React.useEffect(() => {
    let tick = 0;
    const fire = () => {
      const d = raise(tick++ % 3 === 1 ? "person" : "weapon");
      setToastIds((ids) => [d.id, ...ids].slice(0, 12));
    };
    const first = setTimeout(fire, 2500);
    const loop = setInterval(fire, FEED_INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
    };
  }, [raise]);

  const toasts = toastIds
    .map((id) => detections.find((d) => d.id === id))
    .filter((d): d is TrmsDetection => !!d);

  function openDrawer(id: string | null, k: KindFilter = "all") {
    setFocusId(id);
    setKind(k);
    setDrawerOpen(true);
    if (id) setToastIds((ids) => ids.filter((x) => x !== id));
  }

  return (
    <>
      <SyncPlaybackMonitoring
        stats={<TrmsKpis detections={detections} now={now} onOpenKind={(k) => openDrawer(null, k)} />}
        onSelectionChange={setSelectionCount}
      />

      <DetectionToastStack
        toasts={toasts}
        now={now}
        lifted={selectionCount > 0}
        onOpen={(id) => openDrawer(id)}
        onDismiss={(id) => setToastIds((ids) => ids.filter((x) => x !== id))}
        onClearAll={() => setToastIds([])}
      />

      <DetectedEventsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        detections={detections}
        focusId={focusId}
        kind={kind}
        onKindChange={setKind}
        now={now}
      />
    </>
  );
}
