import * as React from "react";
import { X, Play, Settings, Sparkles, RotateCcw, MessageSquare } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SeverityBadge, parseEventText } from "../shared";
import { FP_REASON_LABELS } from "@/mocks/detectionFeed";
import { ENTITY_PROFILES } from "@/mocks/entities";
import { DetectionConfidenceSection, EventEntityCard } from "../EventDrawer";
import type { DismissedEvent, FpReason } from "@/types/detection";
import type { AnyEntity } from "@/types/entities";

/* ── Reason chip ─────────────────────────────────────────────────────────── */

const REASON_CHIP: Record<FpReason, string> = {
  "wrong-class":     "bg-sev-medium-soft text-sev-medium",
  "wrong-person":    "bg-sev-high-soft text-sev-high",
  "known-exemption": "bg-success-soft text-success",
  "staged":          "bg-info-soft text-info",
  "threshold":       "bg-purple-soft text-purple",
  "other":           "bg-muted text-muted-foreground",
};

function ReasonChip({ reason }: { reason: FpReason }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        REASON_CHIP[reason]
      )}
    >
      {FP_REASON_LABELS[reason]}
    </span>
  );
}

/* ── Thumbnail ───────────────────────────────────────────────────────────── */

function DrawerThumb({ item }: { item: DismissedEvent }) {
  const { event } = item;
  return (
    <div className="relative mb-4 h-[200px] overflow-hidden rounded-xl bg-[linear-gradient(135deg,#2a1a0e_0%,#1a1a1a_100%)]">
      {event.bboxes.map((box, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "absolute border-2 opacity-60",
              box.variant === "person"  ? "border-info bg-info/10"
              : box.variant === "vehicle" ? "border-purple bg-purple/10"
              : "border-primary bg-primary/10"
            )}
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <span
            className={cn(
              "absolute -translate-y-full rounded-sm px-1 py-px text-[9px] font-semibold text-white opacity-60",
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
      {/* Dismissed overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            Dismissed
          </span>
          <ReasonChip reason={item.reason} />
        </div>
      </div>
      <button className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-primary/80 hover:text-white">
        <Play className="size-4 fill-white/60" />
      </button>
      <span className="absolute bottom-2.5 left-3 rounded bg-black/75 px-1.5 py-0.5 font-mono text-[10px] text-white">
        {event.time}
      </span>
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
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      {aside}
    </div>
  );
}

/* ── Detection details grid ──────────────────────────────────────────────── */

function DetailGrid({ item }: { item: DismissedEvent }) {
  const { event } = item;
  const rows: Array<[string, React.ReactNode]> = [
    ["Use Case ID", <span className="font-mono text-xs">{event.useCaseId}</span>],
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
    ["Dismissed by", item.dismissedBy],
    ["Dismissed at", item.dismissedAtDisplay],
  ];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
      {rows.map(([label, value]) => (
        <div key={label as string} className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <span className="text-[13px] font-medium text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Model card ──────────────────────────────────────────────────────────── */

function ModelCard({ item }: { item: DismissedEvent }) {
  const { event } = item;
  return (
    <div className="rounded-lg border border-purple-soft bg-[linear-gradient(135deg,hsl(270_95%_65%/0.06),hsl(0_0%_9%))] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Settings className="size-4 text-purple" />
        <span className="font-mono text-[13px] font-bold text-purple">{event.model}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 text-[11px] text-muted-foreground">
        <div><span className="font-semibold text-muted-foreground/70">Use case: </span>{event.useCaseId}</div>
        <div><span className="font-semibold text-muted-foreground/70">Trained: </span>{event.modelTrainedDate}</div>
        <div><span className="font-semibold text-muted-foreground/70">Training data: </span>{event.modelTrainingSamples} samples</div>
        <div><span className="font-semibold text-muted-foreground/70">Last eval mAP: </span>{event.modelMaP}</div>
      </div>
      <div className="mt-2.5 border-t border-purple/15 pt-2.5 text-[11px] text-muted-foreground">
        <span className="font-semibold text-purple">⬢ Synthetic data: </span>
        {event.syntheticPct}% of training set generated via Terra (Sigmawave AI).
      </div>
    </div>
  );
}

/* ── Main drawer ─────────────────────────────────────────────────────────── */

interface DismissedDrawerProps {
  item: DismissedEvent | null;
  open: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
}

export function DismissedDrawer({ item, open, onClose, onRestore }: DismissedDrawerProps) {
  if (!item) return null;
  const { event } = item;

  const eventEntities = [event.assetId, event.personId, event.vehicleId]
    .filter((id): id is string => !!id)
    .map((id) => ({ id, entity: ENTITY_PROFILES[id] as AnyEntity | undefined }));

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <SeverityBadge severity={event.severity} />
              <div className="min-w-0">
                <SheetTitle className="truncate text-[17px] font-bold">
                  {event.typeLabel}
                </SheetTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-[12px] text-muted-foreground">
                    {event.id} · {event.useCaseId} · {event.dateDisplay}, {event.time}
                  </p>
                  <ReasonChip reason={item.reason} />
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <DrawerThumb item={item} />

          {/* Operator Notes — highlighted first since this is the key dismissal context */}
          {item.notes && (
            <div>
              <SectionTitle>
                <span className="flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-sev-medium" />
                  Operator Notes
                </span>
              </SectionTitle>
              <div className="rounded-lg border border-sev-medium/25 bg-sev-medium-soft p-4 text-[13px] leading-relaxed text-foreground">
                {item.notes}
              </div>
            </div>
          )}

          {/* Original Detection Summary */}
          <div>
            <SectionTitle>Original Detection Summary</SectionTitle>
            <div className="rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground">
              {parseEventText(event.summary)}
            </div>
          </div>

          {/* VLM Reasoning */}
          {event.vlmReasoning && (
            <div>
              <SectionTitle
                aside={
                  <span className="rounded bg-purple-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple">
                    AI-generated · 8s clip
                  </span>
                }
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-purple" />
                  VLM Reasoning
                </span>
              </SectionTitle>
              <div className="relative rounded-lg border border-purple/25 bg-[linear-gradient(135deg,hsl(270_95%_65%/0.06),hsl(270_95%_65%/0.02))] p-4 text-[13px] leading-relaxed text-muted-foreground">
                {parseEventText(event.vlmReasoning)}
              </div>
            </div>
          )}

          {/* Detected By */}
          <div>
            <SectionTitle>Detected By</SectionTitle>
            <ModelCard item={item} />
          </div>

          {/* Detection Details */}
          <div>
            <SectionTitle>Detection Details</SectionTitle>
            <DetailGrid item={item} />
          </div>

          {/* Detection Confidence (parity with active event drawer) */}
          <div>
            <DetectionConfidenceSection event={event} />
          </div>

          {/* Entities Involved */}
          {eventEntities.length > 0 && (
            <div>
              <SectionTitle
                aside={
                  <span className="rounded-full bg-muted px-2 py-px text-[11px] font-semibold text-muted-foreground">
                    {eventEntities.length}
                  </span>
                }
              >
                Entities Involved
              </SectionTitle>
              <div className="space-y-2">
                {eventEntities.map(({ id, entity }) => (
                  <EventEntityCard key={id} entityId={id} entity={entity} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              onRestore(event.id);
              onClose();
            }}
          >
            <RotateCcw className="size-3.5" />
            Restore to Feed
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
