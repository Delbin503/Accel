import * as React from "react";
import { X, Play, Settings, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DetectionEvent } from "@/types/detection";
import type { AnyEntity } from "@/types/entities";
import { SeverityBadge, parseEventText } from "./shared";
import { EntityDrawer } from "@/pages/incident-cases/EntityDrawer";
import { ENTITY_PROFILES } from "@/mocks/entities";
import { KpiCard as SharedKpiCard, type KpiAccent } from "@/components/shared/KpiCard";

/* ── Thumbnail with bounding boxes ──────────────────────────────────────── */

function DrawerThumb({ event }: { event: DetectionEvent }) {
  return (
    <div className="relative mb-4 h-[280px] overflow-hidden rounded-xl bg-camera-feed">
      {event.bboxes.map((box, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "absolute border-2",
              box.variant === "person"  ? "border-info bg-info-soft"
              : box.variant === "vehicle" ? "border-purple bg-purple-soft"
              : "border-primary bg-primary-muted"
            )}
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <span
            className={cn(
              "absolute -translate-y-full rounded-sm px-1 py-0.5 text-3xs font-semibold text-white",
              box.variant === "person"  ? "bg-info"
              : box.variant === "vehicle" ? "bg-purple"
              : "bg-primary"
            )}
            style={{ top: box.top, left: box.left }}
          >
            {box.label}
          </span>
        </React.Fragment>
      ))}
      <button className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary/90 text-white transition-colors hover:bg-primary">
        <Play className="size-5 fill-white" />
      </button>
      <span className="absolute bottom-2.5 left-3 rounded bg-black/75 px-1.5 py-0.5 font-mono text-2xs text-white">
        {event.time}
      </span>
    </div>
  );
}

/* ── Per-model evaluation data ───────────────────────────────────────────── */

const MODEL_EVAL: Record<
  string,
  {
    precision: number; recall: number; f1: number; map50: number;
    testFrames: number; evalDate: string;
    confThreshold: number; iouThreshold: number;
    trainPct: number; valPct: number; testPct: number;
  }
> = {
  "vms-4-2-1": {
    precision: 0.910, recall: 0.887, f1: 0.898, map50: 0.912,
    testFrames: 12408, evalDate: "12 May 2026",
    confThreshold: 0.700, iouThreshold: 0.500,
    trainPct: 80, valPct: 15, testPct: 5,
  },
  "vms-4-1-0": {
    precision: 0.891, recall: 0.868, f1: 0.879, map50: 0.895,
    testFrames: 9214, evalDate: "14 Jan 2026",
    confThreshold: 0.700, iouThreshold: 0.500,
    trainPct: 78, valPct: 16, testPct: 6,
  },
  "sop-2": {
    precision: 0.876, recall: 0.854, f1: 0.865, map50: 0.871,
    testFrames: 7840, evalDate: "5 Apr 2026",
    confThreshold: 0.650, iouThreshold: 0.500,
    trainPct: 75, valPct: 17, testPct: 8,
  },
};

/* ── Detection Confidence + Model Evaluation ─────────────────────────────── */

/* Entity card config — one per variant. Easy to add new variants here. */

const ENTITY_CARD: Record<
  "default" | "person" | "vehicle",
  { label: string; accent: string; getId: (e: DetectionEvent) => string | undefined }
> = {
  default: { label: "Asset Box",   accent: "text-primary", getId: (e) => e.assetId },
  person:  { label: "Person Box",  accent: "text-info",    getId: (e) => e.personId },
  vehicle: { label: "Vehicle Box", accent: "text-purple",  getId: (e) => e.vehicleId },
};

export function DetectionConfidenceSection({ event }: { event: DetectionEvent }) {
  const [evalExpanded, setEvalExpanded] = React.useState(false);

  function parseScore(label: string): number {
    const m = label.match(/(\d+)%/);
    return m ? parseInt(m[1]) : 0;
  }

  /* Build an entity list from whichever bbox variants are present in this event. */
  const entityCards = (Object.keys(ENTITY_CARD) as (keyof typeof ENTITY_CARD)[])
    .map((variant) => {
      const boxes = event.bboxes.filter((b) => b.variant === variant);
      if (boxes.length === 0) return null;
      const score = Math.max(...boxes.map((b) => parseScore(b.label)));
      const cfg = ENTITY_CARD[variant];
      return { variant, score, label: cfg.label, accent: cfg.accent, id: cfg.getId(event) };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const threshold = 70;
  const eval_ = MODEL_EVAL[event.modelKey] ?? MODEL_EVAL["vms-4-2-1"];

  /* Grid sizing: 1 → col-1, 2 → col-2, 3+ → col-3 (mobile col-1) */
  const gridCols =
    entityCards.length >= 3 ? "grid-cols-1 sm:grid-cols-3"
    : entityCards.length === 2 ? "grid-cols-1 sm:grid-cols-2"
    : "grid-cols-1";

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Detection Confidence
        </span>
        <span className="font-mono text-2xs text-muted-foreground">
          trigger threshold ≥ {threshold / 100}
        </span>
      </div>

      {/* Entity score cards — uniform compact KPI pattern */}
      {entityCards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No tracked entities for this detection.
        </div>
      ) : (
        <div className={cn("grid gap-3", gridCols)}>
          {entityCards.map((card) => {
            const scoreAccent =
              card.score >= 85 ? "success" :
              card.score >= 70 ? "sev-medium" :
              "sev-critical";
            return (
              <SharedKpiCard key={card.variant}
                compact
                label={card.label}
                value={(card.score / 100).toFixed(3)}
                sub={card.id ?? undefined}
                accent={scoreAccent as KpiAccent}
              />
            );
          })}
        </div>
      )}

      {/* Model Evaluation Performance */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Collapsible header */}
        <button
          onClick={() => setEvalExpanded((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/30"
        >
          <div className="flex items-center gap-2">
            <Settings className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground">
              MODEL EVALUATION PERFORMANCE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              last eval · {eval_.evalDate} · for audit
            </span>
            {evalExpanded ? (
              <ChevronUp className="size-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-3.5 text-muted-foreground" />
            )}
          </div>
        </button>

        {evalExpanded && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <p className="mb-3 text-xs text-muted-foreground">
              Aggregate metrics across{" "}
              <strong className="font-semibold text-foreground">
                {eval_.testFrames.toLocaleString()} test frames
              </strong>{" "}
              · evaluated at{" "}
              <strong className="font-semibold text-foreground">
                conf {eval_.confThreshold.toFixed(3)}
              </strong>{" "}
              ·{" "}
              <strong className="font-semibold text-foreground">
                IoU {eval_.iouThreshold.toFixed(3)}
              </strong>
            </p>

            {/* 4-metric grid */}
            <div className="mb-4 grid grid-cols-4 divide-x divide-border overflow-hidden rounded-lg border border-border">
              {[
                { label: "Precision", value: eval_.precision },
                { label: "Recall", value: eval_.recall },
                { label: "F1", value: eval_.f1 },
                { label: "mAP@0.5", value: eval_.map50 },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/20 px-3 py-2.5">
                  <div className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-0.5 text-xl font-bold text-foreground">
                    {value.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>

            {/* Data split */}
            <div>
              <div className="mb-1.5 flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Data Split</span>
                <span className="font-mono normal-case tracking-normal">
                  {eval_.trainPct} / {eval_.valPct} / {eval_.testPct}
                </span>
              </div>
              {/* Bar */}
              <div className="flex h-2 w-full overflow-hidden rounded-full">
                <div className="bg-primary" style={{ width: `${eval_.trainPct}%` }} />
                <div className="bg-purple" style={{ width: `${eval_.valPct}%` }} />
                <div className="bg-success" style={{ width: `${eval_.testPct}%` }} />
              </div>
              {/* Legend */}
              <div className="mt-2 flex items-center gap-4 text-2xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary" />
                  Train ({eval_.trainPct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-purple" />
                  Val ({eval_.valPct}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-success" />
                  Test ({eval_.testPct}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Model card ──────────────────────────────────────────────────────────── */

function ModelCard({ event }: { event: DetectionEvent }) {
  return (
    <div className="rounded-lg border border-purple-soft bg-[linear-gradient(135deg,hsl(270_95%_65%/0.06),hsl(0_0%_9%))] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Settings className="size-4 text-purple" />
        <span className="font-mono text-base font-bold text-purple">{event.model}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
        <div>
          <span className="font-semibold text-muted-foreground/70">Model ID: </span>
          {event.useCaseId}
        </div>
        <div>
          <span className="font-semibold text-muted-foreground/70">Trained: </span>
          {event.modelTrainedDate}
        </div>
        <div>
          <span className="font-semibold text-muted-foreground/70">Last eval mAP: </span>
          {event.modelMaP}
        </div>
      </div>
    </div>
  );
}

/* ── Section heading ─────────────────────────────────────────────────────── */

function SectionTitle({
  children,
  aside,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      {aside}
    </div>
  );
}

/* ── Detail grid ─────────────────────────────────────────────────────────── */

function DetailGrid({ event }: { event: DetectionEvent }) {
  const rows: Array<[string, React.ReactNode]> = [
    ["Model ID", <span className="font-mono text-xs">{event.useCaseId}</span>],
    ["Detection Type", event.typeLabel],
    ...(event.assetId
      ? [["Asset ID", <span className="font-mono text-xs text-primary">{event.assetId}</span>] as [string, React.ReactNode]]
      : []),
    ...(event.personId
      ? [["Person ID", <span className="font-mono text-xs text-primary">{event.personId}</span>] as [string, React.ReactNode]]
      : []),
    ["Area", event.areaDisplay],
    ["Camera", event.camera],
    ["Site", event.siteDisplay],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
      {rows.map(([label, value]) => (
        <div key={label as string} className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="text-base font-medium text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── VLM block ───────────────────────────────────────────────────────────── */

function VlmBlock({ text }: { text: string }) {
  return (
    <div className="relative rounded-lg border border-purple/25 bg-[linear-gradient(135deg,hsl(270_95%_65%/0.06),hsl(270_95%_65%/0.02))] p-4 text-base leading-relaxed text-muted-foreground">
      {parseEventText(text)}
    </div>
  );
}

/* ── Entity mini card (for the Entities Involved section) ───────────────── */

const EVENT_ENTITY_STYLE: Record<string, { borderColor: string; chipClass: string; label: string }> = {
  person:  { borderColor: "var(--info)",    chipClass: "border-info/25 bg-info/10 text-info",       label: "Person"  },
  asset:   { borderColor: "var(--primary)", chipClass: "border-primary/25 bg-primary/10 text-primary", label: "Asset"   },
  vehicle: { borderColor: "var(--success)", chipClass: "border-success/25 bg-success/10 text-success", label: "Vehicle" },
};

export function inferEntityKind(id: string): string {
  if (id.startsWith("PER-")) return "person";
  if (id.startsWith("VEH-")) return "vehicle";
  return "asset";
}

export function EventEntityCard({
  entityId,
  entity,
  onViewInfo,
}: {
  entityId: string;
  entity: AnyEntity | undefined;
  onViewInfo?: () => void;
}) {
  const kind = entity?.kind ?? inferEntityKind(entityId);
  const style = EVENT_ENTITY_STYLE[kind] ?? EVENT_ENTITY_STYLE.asset;

  function renderSubtitle() {
    if (!entity) return <p className="mb-1 text-sm italic text-muted-foreground">No profile on record</p>;
    if (entity.kind === "person")
      return <p className="mb-1 text-base text-muted-foreground">{entity.name}</p>;
    if (entity.kind === "vehicle") {
      const v = entity;
      return (
        <p className="mb-1 text-base text-muted-foreground">
          {[v.vehicleType, v.color].filter(Boolean).join(" · ")}
          {v.plate && <span className="ml-1 font-mono text-sm text-foreground">{v.plate}</span>}
        </p>
      );
    }
    return (
      <p className="mb-1 text-base text-muted-foreground">
        {entity.type}
        <span className="mx-1 opacity-40">·</span>
        {entity.category}
      </p>
    );
  }

  function renderStats() {
    if (!entity) return null;
    if (entity.kind === "person") {
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-muted-foreground/70">RE-ID:</span>
            {(entity.reIdConfidence / 100).toFixed(3)}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-muted-foreground/70">Detections:</span>
            {entity.totalDetections}
          </span>
        </div>
      );
    }
    if (entity.kind === "vehicle") {
      if (!entity.registeredTo) return null;
      return (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold text-muted-foreground/70">Registered:</span>
            {entity.registeredTo}
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <div
      className="flex items-start justify-between gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:bg-muted/20"
      style={{ borderLeftWidth: 3, borderLeftColor: style.borderColor }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded border px-1.5 py-px text-2xs font-bold uppercase tracking-wider",
              style.chipClass
            )}
          >
            {style.label}
          </span>
          <span className="font-mono text-sm font-semibold text-foreground">{entityId}</span>
        </div>
        {renderSubtitle()}
        {renderStats()}
      </div>
      {entity && onViewInfo && (
        <button
          onClick={onViewInfo}
          className="mt-0.5 flex-shrink-0 text-sm font-medium text-primary hover:underline"
        >
          View Info →
        </button>
      )}
    </div>
  );
}

/* ── Main drawer ─────────────────────────────────────────────────────────── */

interface EventDrawerProps {
  event: DetectionEvent | null;
  open: boolean;
  onClose: () => void;
  onEscalate: () => void;
  onDismiss: () => void;
}

export function EventDrawer({ event, open, onClose, onEscalate, onDismiss }: EventDrawerProps) {
  const [viewEntity, setViewEntity] = React.useState<AnyEntity | null>(null);

  React.useEffect(() => {
    setViewEntity(null);
  }, [event?.id]);

  const eventEntities = React.useMemo(() => {
    if (!event) return [];
    return [
      event.assetId,
      event.personId,
      event.vehicleId,
    ]
      .filter((id): id is string => !!id)
      .map((id) => ({ id, entity: ENTITY_PROFILES[id] as AnyEntity | undefined }));
  }, [event]);

  if (!event) return null;

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <SeverityBadge severity={event.severity} />
              </div>
              <SheetTitle className="text-lg font-bold leading-snug">
                {event.typeLabel}
              </SheetTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {event.id} · {event.useCaseId} · {event.dateDisplay}, {event.time}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <DrawerThumb event={event} />

          {/* Event Summary */}
          <div>
            <SectionTitle>Event Summary</SectionTitle>
            <div className="rounded-lg border border-border bg-card p-4 text-base leading-relaxed text-muted-foreground">
              {parseEventText(event.summary)}
            </div>
          </div>

          {/* VLM Reasoning */}
          <div>
            <SectionTitle
              aside={
                <span className="rounded bg-purple-soft px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-purple">
                  AI-generated · 8s clip
                </span>
              }
            >
              <span className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-purple" />
                VLM Reasoning
              </span>
            </SectionTitle>
            <VlmBlock text={event.vlmReasoning} />
          </div>

          {/* Detected By */}
          <div>
            <SectionTitle
              aside={
                <button className="text-2xs text-purple hover:underline">View model →</button>
              }
            >
              Detected By
            </SectionTitle>
            <ModelCard event={event} />
          </div>

          {/* Detection Details */}
          <div>
            <SectionTitle>Detection Details</SectionTitle>
            <DetailGrid event={event} />
          </div>

          {/* Detection Confidence */}
          <div>
            <DetectionConfidenceSection event={event} />
          </div>

          {/* Entities Involved */}
          {eventEntities.length > 0 && (
            <div>
              <SectionTitle
                aside={
                  <span className="rounded-full bg-muted px-2 py-px text-xs font-semibold text-muted-foreground">
                    {eventEntities.length}
                  </span>
                }
              >
                Entities Involved
              </SectionTitle>
              <div className="space-y-2">
                {eventEntities.map(({ id, entity }) => (
                  <EventEntityCard
                    key={id}
                    entityId={id}
                    entity={entity}
                    onViewInfo={entity ? () => setViewEntity(entity) : undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
          {event.status === "escalated" && event.caseId ? (
            <Button variant="outline" size="sm">
              View {event.caseId} →
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onEscalate();
              }}
            >
              Escalate Case
            </Button>
          )}
          {event.status !== "escalated" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
            >
              Link Case
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-sev-critical hover:bg-sev-critical/10 hover:text-sev-critical"
            onClick={() => {
              onClose();
              onDismiss();
            }}
          >
            Dismiss
          </Button>
        </div>
      </SheetContent>
    </Sheet>

    <EntityDrawer
      entity={viewEntity}
      open={viewEntity !== null}
      onClose={() => setViewEntity(null)}
    />
    </>
  );
}
