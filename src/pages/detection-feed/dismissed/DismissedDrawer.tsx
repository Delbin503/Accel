import * as React from "react";
import { Play, Settings, Sparkles, RotateCcw, MessageSquare } from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerFooter,
  DetailDrawerFooterStart,
  DetailDrawerHeader,
  DetailDrawerSection,
  DetailDrawerTitle,
} from "@accel/ui/components/shared/DetailDrawer";
import { DescriptionItem, DescriptionList } from "@accel/ui/components/shared/DescriptionList";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { cn } from "@accel/ui/lib/utils";
import { SeverityBadge } from "../shared";
import { parseEventText } from "../shared-utils";
import { FP_REASON_LABELS } from "@/mocks/detectionFeed";
import { ENTITY_PROFILES } from "@/mocks/entities";
import { DetectionConfidenceSection, EventEntityCard } from "../EventDrawer";
import type { DismissedEvent, FpReason } from "@/types/detection";
import type { AnyEntity } from "@/types/entities";

/* ── Reason chip ─────────────────────────────────────────────────────────── */

const REASON_CHIP: Record<FpReason, string> = {
  "wrong-class":     "bg-severity-medium/15 text-severity-medium",
  "wrong-person":    "bg-severity-high/15 text-severity-high",
  "known-exemption": "bg-success/15 text-success",
  "staged":          "bg-info/15 text-info",
  "threshold":       "bg-violet/15 text-violet",
  "other":           "bg-muted text-muted-foreground",
};

function ReasonChip({ reason }: { reason: FpReason }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
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
    <div data-slot="dismissed-drawer-media" className="relative h-[200px] shrink-0 overflow-hidden rounded-xl bg-camera-feed">
      {event.bboxes.map((box, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "absolute border-2 opacity-60",
              box.variant === "person"  ? "border-info bg-info/10"
              : box.variant === "vehicle" ? "border-violet bg-violet/10"
              : "border-primary bg-primary/10"
            )}
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <span
            className={cn(
              "absolute -translate-y-full rounded-sm px-1 py-px text-3xs font-semibold text-status-foreground opacity-60",
              box.variant === "person"  ? "bg-info"
              : box.variant === "vehicle" ? "bg-violet"
              : "bg-primary-fill text-primary-foreground"
            )}
            style={{ top: box.top, left: box.left }}
          >
            {box.label}
          </span>
        </React.Fragment>
      ))}
      {/* Dismissed overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-scrim/30">
        <div className="flex items-center gap-2 rounded-full border border-media-foreground/20 bg-scrim/60 px-3 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-media-foreground/70">
            Dismissed
          </span>
          <ReasonChip reason={item.reason} />
        </div>
      </div>
      <Button variant="ghost" size="icon-lg" className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-0 bg-media-foreground/10 text-media-foreground/60 transition-colors hover:bg-primary/80 hover:text-media-foreground active:not-aria-[haspopup]:-translate-y-1/2 dark:hover:bg-primary/80">
        <Play className="size-4 fill-media-foreground/60" />
      </Button>
      <span className="absolute bottom-2.5 left-3 rounded bg-scrim/75 px-1.5 py-0.5 font-mono text-2xs text-media-foreground">
        {event.time}
      </span>
    </div>
  );
}

/* ── Detection details grid ──────────────────────────────────────────────── */

function DetailGrid({ item }: { item: DismissedEvent }) {
  const { event } = item;
  return (
    <DescriptionList columns={2} variant="card">
      <DescriptionItem label="Model ID" mono>{event.useCaseId}</DescriptionItem>
      <DescriptionItem label="Detection Type">{event.typeLabel}</DescriptionItem>
      {event.assetId && (
        <DescriptionItem label="Asset ID" mono>
          <span className="text-primary-ink">{event.assetId}</span>
        </DescriptionItem>
      )}
      {event.personId && (
        <DescriptionItem label="Person ID" mono>
          <span className="text-primary-ink">{event.personId}</span>
        </DescriptionItem>
      )}
      <DescriptionItem label="Area">{event.areaDisplay}</DescriptionItem>
      <DescriptionItem label="Camera">{event.camera}</DescriptionItem>
      <DescriptionItem label="Site">{event.siteDisplay}</DescriptionItem>
      <DescriptionItem label="Dismissed by">{item.dismissedBy}</DescriptionItem>
      <DescriptionItem label="Dismissed at">{item.dismissedAtDisplay}</DescriptionItem>
    </DescriptionList>
  );
}

/* ── Model card ──────────────────────────────────────────────────────────── */

function ModelCard({ item }: { item: DismissedEvent }) {
  const { event } = item;
  return (
    <div className="rounded-lg border border-violet/15 bg-[linear-gradient(135deg,hsl(270_95%_65%/0.06),hsl(0_0%_9%))] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Settings className="size-4 text-violet" />
        <span className="font-mono text-base font-bold text-violet">{event.model}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
        <div><span className="font-semibold text-muted-foreground">Model ID: </span>{event.useCaseId}</div>
        <div><span className="font-semibold text-muted-foreground">Trained: </span>{event.modelTrainedDate}</div>
        <div><span className="font-semibold text-muted-foreground">Last eval mAP: </span>{event.modelMaP}</div>
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
    <DetailDrawer open={open} onOpenChange={(v) => !v && onClose()} size="lg">
      {/* Header */}
      <DetailDrawerHeader data-slot="dismissed-drawer-header">
        <div className="flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={event.severity} />
          <ReasonChip reason={item.reason} />
        </div>
        <DetailDrawerTitle className="leading-snug">
          <TruncatedText text={event.typeLabel} />
        </DetailDrawerTitle>
        <DetailDrawerDescription>
          {event.id} · {event.useCaseId} · {event.dateDisplay}, {event.time}
        </DetailDrawerDescription>
      </DetailDrawerHeader>

      {/* Scrollable body */}
      <DetailDrawerBody data-slot="dismissed-drawer-body">
        <DrawerThumb item={item} />

        {/* Operator Notes — highlighted first since this is the key dismissal context */}
        {item.notes && (
          <DetailDrawerSection
            data-slot="dismissed-drawer-notes"
            title={
              <span className="flex items-center gap-2">
                <MessageSquare className="size-3.5 text-severity-medium" />
                Operator Notes
              </span>
            }
          >
            <div className="rounded-lg border border-severity-medium/25 bg-severity-medium/15 p-4 text-base leading-relaxed text-foreground">
              {item.notes}
            </div>
          </DetailDrawerSection>
        )}

        {/* Original Detection Summary */}
        <DetailDrawerSection data-slot="dismissed-drawer-summary" title="Original Detection Summary">
          <div className="rounded-lg border border-border bg-card p-4 text-base leading-relaxed text-muted-foreground">
            {parseEventText(event.summary)}
          </div>
        </DetailDrawerSection>

        {/* VLM Reasoning */}
        {event.vlmReasoning && (
          <DetailDrawerSection
            data-slot="dismissed-drawer-reasoning"
            title={
              <span className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-violet" />
                VLM Reasoning
              </span>
            }
            action={
              <span className="rounded bg-violet/15 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-violet">
                AI-generated · 8s clip
              </span>
            }
          >
            <div className="relative rounded-lg border border-violet/25 bg-[linear-gradient(135deg,hsl(270_95%_65%/0.06),hsl(270_95%_65%/0.02))] p-4 text-base leading-relaxed text-muted-foreground">
              {parseEventText(event.vlmReasoning)}
            </div>
          </DetailDrawerSection>
        )}

        {/* Detected By */}
        <DetailDrawerSection data-slot="dismissed-drawer-model" title="Detected By">
          <ModelCard item={item} />
        </DetailDrawerSection>

        {/* Detection Details */}
        <DetailDrawerSection data-slot="dismissed-drawer-details" title="Detection Details">
          <DetailGrid item={item} />
        </DetailDrawerSection>

        {/* Detection Confidence (parity with active event drawer) */}
        <DetectionConfidenceSection data-slot="dismissed-drawer-confidence" event={event} />

        {/* Entities Involved */}
        {eventEntities.length > 0 && (
          <DetailDrawerSection
            data-slot="dismissed-drawer-entities"
            title="Entities Involved"
            action={
              <span className="rounded-full bg-muted px-2 py-px text-xs font-semibold text-muted-foreground">
                {eventEntities.length}
              </span>
            }
          >
            <div className="space-y-2">
              {eventEntities.map(({ id, entity }) => (
                <EventEntityCard key={id} entityId={id} entity={entity} />
              ))}
            </div>
          </DetailDrawerSection>
        )}
      </DetailDrawerBody>

      {/* Footer */}
      <DetailDrawerFooter data-slot="dismissed-drawer-footer">
        <DetailDrawerFooterStart className="gap-2">
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
        </DetailDrawerFooterStart>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </DetailDrawerFooter>
    </DetailDrawer>
  );
}
