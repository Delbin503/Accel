import * as React from "react";
import { toast } from "sonner";
import { X, MapPin, Clock, Shield, Cpu, Sparkles, Check, ChevronDown, Info, GitMerge } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnyEntity, PersonEntity, AssetEntity, VehicleEntity, EntityTimelineEntry, PossibleIdentityMatch } from "@/types/entities";
import type { Severity } from "@/types/detection";

/* ── Derived helpers (no type/mock changes needed) ───────────────────────── */

function deriveAssetType(entity: AssetEntity): string {
  if (entity.id.startsWith("AST-WPN")) return "Weapon";
  if (entity.id.startsWith("AST-EQP")) return "Equipment";
  if (entity.id.startsWith("AST-VEH")) return "Vehicle";
  return entity.category || "Asset";
}

function deriveVehicleTitle(entity: VehicleEntity): string {
  const parts = [entity.color, entity.vehicleType].filter(Boolean) as string[];
  const head = parts.join(" ");
  if (entity.plate) return head ? `${head} · ${entity.plate}` : entity.plate;
  return head || "Unidentified Vehicle";
}

function deriveLastSeen(timeline: EntityTimelineEntry[]): string {
  if (!timeline || timeline.length === 0) return "—";
  const t = timeline[0];
  // strip "Today · " or "Yesterday · " noise, keep the date
  const date = t.dateDisplay.replace(/^(Today|Yesterday)\s·\s/, "");
  const hhmm = t.time.length >= 5 ? t.time.slice(0, 5) : t.time;
  return `${date}, ${hhmm}`;
}

/* ── Severity helpers ────────────────────────────────────────────────────── */

const SEV_LABEL: Record<Severity, string> = {
  critical: "Critical",
  medium: "Medium",
  low: "Low",
};

function SeverityChip({ severity }: { severity: Severity }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-px text-2xs font-bold uppercase tracking-wider text-white"
      style={{ background: `var(--sev-${severity})` }}
    >
      {SEV_LABEL[severity]}
    </span>
  );
}

/* ── KPI card ────────────────────────────────────────────────────────────── */

import { KpiCard as SharedKpiCard, type KpiAccent } from "@/components/shared/KpiCard";

/* ── Timeline entry row ──────────────────────────────────────────────────── */

function TimelineRow({ entry }: { entry: EntityTimelineEntry }) {
  return (
    <div
      className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/30"
      style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${entry.severity})` }}
    >
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <SeverityChip severity={entry.severity} />
          <span className="text-base font-semibold text-foreground">{entry.eventType}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" />
            {entry.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Cpu className="size-2.5" />
            {entry.camera} · {entry.siteDisplay}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-2.5" />
            {entry.dateDisplay}, {entry.time}
          </span>
        </div>
        {entry.note && (
          <p className="mt-1.5 text-xs text-muted-foreground italic">"{entry.note}"</p>
        )}
      </div>
      <div className="flex flex-col items-end justify-start gap-1">
        <span className="font-mono text-xs text-muted-foreground">
          {(entry.confidence / 100).toFixed(3)} conf
        </span>
        {entry.caseId && (
          <span className="rounded bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
            {entry.caseId}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Linked case card (read-only) ────────────────────────────────────────── */

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  "in-review": "In Review",
  "action-taken": "Action Taken",
  closed: "Closed",
};

const STATUS_DOT: Record<string, string> = {
  open: "bg-info",
  "in-review": "bg-sev-medium",
  "action-taken": "bg-purple",
  closed: "bg-success",
};

function LinkedCaseCard({
  id,
  title,
  severity,
  status,
  assignee,
  eventCount,
}: {
  id: string;
  title: string;
  severity: Severity;
  status: string;
  assignee: string;
  eventCount: number;
}) {
  return (
    <div
      className="rounded-xl border bg-card p-4"
      style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${severity})` }}
    >
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <SeverityChip severity={severity} />
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-px text-2xs font-bold uppercase tracking-wider",
            STATUS_DOT[status] && "text-foreground"
          )}
        >
          <span className={cn("size-1.5 rounded-full", STATUS_DOT[status] ?? "bg-muted")} />
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>
      <p className="mb-1.5 text-base font-semibold leading-snug text-foreground">{title}</p>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="font-mono">{id}</span>
        <span>Assigned: {assignee}</span>
        <span className="ml-auto rounded-full bg-muted px-2 py-px text-xs font-semibold text-foreground">
          {eventCount} event{eventCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

/* ── Shared: unified KPI row (same 4 cards for all entity kinds) ─────────── */

function EntityKpiRow({
  totalDetections,
  reIdConfidence,
  priorIncidents,
}: {
  totalDetections: number;
  reIdConfidence: number | null;
  priorIncidents: number;
}) {
  const reidAccent: KpiAccent =
    reIdConfidence == null ? "muted" : reIdConfidence >= 85 ? "success" : "sev-medium";
  const reidLabel =
    reIdConfidence == null ? "Not available" :
    reIdConfidence >= 85 ? "High confidence" :
    reIdConfidence >= 70 ? "Medium confidence" :
    "Low confidence";
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <SharedKpiCard compact
        label="Total Detections"
        value={totalDetections}
        sub={totalDetections === 0 ? "No events recorded" : totalDetections === 1 ? "1 event recorded" : "Recorded events"}
        accent={totalDetections > 0 ? "sev-critical" : "muted"}
      />
      <SharedKpiCard compact
        label="RE-ID Confidence"
        value={reIdConfidence != null ? (reIdConfidence / 100).toFixed(3) : "—"}
        sub={reidLabel}
        accent={reidAccent}
      />
      {(() => {
        // If the entity has been seen multiple times, the implicit prior count is N-1.
        // Honor any higher explicit value passed in.
        const impliedPrior = Math.max(0, totalDetections - 1);
        const prior = Math.max(priorIncidents, impliedPrior);
        return (
          <SharedKpiCard compact
            label="Prior Incidents"
            value={prior}
            sub={prior === 0 ? "Clean history" : prior === 1 ? "1 prior case" : `${prior} prior cases`}
            accent={prior > 0 ? "sev-medium" : "muted"}
          />
        );
      })()}
    </div>
  );
}

/* ── Shared: detected timeline (no filter tabs) ──────────────────────────── */

function DetectedTimeline({ entries }: { entries: EntityTimelineEntry[] }) {
  return (
    <div>
      <div className="mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Detected Timeline
        </span>
      </div>
      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-8 text-center text-base text-muted-foreground">
          No detections recorded.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <TimelineRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Possible Identity Matches (adaptive ReID) ───────────────────────────── */

type MatchVerdict = "pending" | "approved" | "rejected";

function PossibleMatchCard({
  match, verdict, onApprove, onReject,
}: {
  match: PossibleIdentityMatch;
  verdict: MatchVerdict;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const isApproved = verdict === "approved";
  const isRejected = verdict === "rejected";

  const scoreColor = match.similarity >= 80 ? "text-success" : match.similarity >= 65 ? "text-warning" : "text-muted-foreground";
  const scoreBg = match.similarity >= 80 ? "bg-success/15 border-success/40" : match.similarity >= 65 ? "bg-warning/15 border-warning/40" : "bg-muted border-border";

  return (
    <div className={cn(
      "overflow-hidden rounded-lg border bg-card transition-colors",
      isApproved ? "border-success/50 bg-success/[0.04]" :
      isRejected ? "border-border opacity-50" :
                   "border-info/40"
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3 px-3.5 py-3">
        {/* Side-by-side avatars */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <div className="flex size-9 items-center justify-center rounded-full border-2 border-info bg-info/15 font-mono text-2xs font-bold text-info">
            ?
          </div>
          <ChevronDown className="size-3 rotate-[-90deg] text-muted-foreground" />
          <div className="flex size-9 items-center justify-center rounded-full border-2 border-success bg-success/15 font-mono text-2xs font-bold text-success">
            {match.candidateLabel.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
        </div>

        {/* Detail */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-base font-bold text-foreground">
              Potentially <span className="font-mono text-success">{match.candidateId}</span>
            </p>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", scoreBg, scoreColor)}>
              {match.similarity}% match
            </span>
            {isApproved && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
                <Check className="size-2.5" strokeWidth={3} />
                Merged
              </span>
            )}
            {isRejected && (
              <span className="inline-flex items-center gap-0.5 rounded-full border border-sev-critical/30 bg-sev-critical/15 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-sev-critical">
                <X className="size-2.5" strokeWidth={3} />
                Rejected
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {match.candidateLabel} · {match.reasonLabel}
          </p>
          <p className="mt-0.5 text-2xs text-muted-foreground/80">
            {match.candidateDetections} prior detection{match.candidateDetections === 1 ? "" : "s"} · last seen {match.candidateLastSeen}
          </p>
        </div>

        {/* Actions */}
        {verdict === "pending" && (
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Button variant="outline" onClick={onReject}
              className="gap-1.5 border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10">
              <X className="size-3" />
              Reject
            </Button>
            <Button onClick={onApprove} className="gap-1.5">
              <GitMerge className="size-3" />
              Approve & Merge
            </Button>
          </div>
        )}
      </div>

      {/* Expandable detail */}
      <button onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 border-t border-border/40 px-3.5 py-1.5 text-2xs text-muted-foreground hover:bg-muted/30">
        <span>{expanded ? "Hide" : "Show"} similarity breakdown</span>
        <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="space-y-1.5 border-t border-border/40 px-3.5 py-3">
          <p className="mb-1 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
            Per-feature similarity
          </p>
          {match.features.map((f) => {
            const c = f.score >= 80 ? "bg-success" : f.score >= 65 ? "bg-warning" : "bg-muted-foreground/40";
            const t = f.score >= 80 ? "text-success" : f.score >= 65 ? "text-warning" : "text-muted-foreground";
            return (
              <div key={f.label} className="flex items-center gap-2">
                <p className="w-32 flex-shrink-0 text-xs text-muted-foreground">{f.label}</p>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("absolute inset-y-0 left-0 rounded-full", c)} style={{ width: `${f.score}%` }} />
                </div>
                <p className={cn("w-10 flex-shrink-0 text-right font-mono text-xs font-bold", t)}>{f.score}%</p>
              </div>
            );
          })}
          <div className="mt-3 rounded border border-border bg-background px-2.5 py-1.5 text-2xs text-muted-foreground">
            <p className="mb-0.5 font-semibold text-foreground">Candidate profile</p>
            <p>Sites: {match.candidateSitesObserved.join(", ")}</p>
            <p>First seen: {match.candidateFirstSeenDisplay} · {match.candidateDetections} historical detections</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PossibleMatchesSection({ entity, matches }: { entity: PersonEntity; matches: PossibleIdentityMatch[] }) {
  const [verdicts, setVerdicts] = React.useState<Record<string, MatchVerdict>>({});
  const [showInfo, setShowInfo] = React.useState(false);
  // The merge confirmation banner auto-dismisses after 10s (the merge itself persists).
  const [mergeBannerVisible, setMergeBannerVisible] = React.useState(false);
  const bannerTimer = React.useRef<number | null>(null);
  React.useEffect(() => () => { if (bannerTimer.current) clearTimeout(bannerTimer.current); }, []);

  if (matches.length === 0) return null;

  function approve(m: PossibleIdentityMatch) {
    setVerdicts((v) => ({ ...v, [m.candidateId]: "approved" }));
    setMergeBannerVisible(true);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setMergeBannerVisible(false), 10000);
    toast.success(`Merged into ${m.candidateId}`, {
      description: `${entity.id} → ${m.candidateId} (${m.candidateLabel}). The recognition model and historical profile have been updated.`,
    });
  }
  function reject(m: PossibleIdentityMatch) {
    setVerdicts((v) => ({ ...v, [m.candidateId]: "rejected" }));
    toast.message("Match rejected", {
      description: `${m.candidateId} will no longer be suggested for ${entity.id}.`,
    });
  }

  const pending = matches.filter((m) => (verdicts[m.candidateId] ?? "pending") === "pending").length;
  const approvedMatch = matches.find((m) => verdicts[m.candidateId] === "approved");
  const rejectedCount = matches.filter((m) => verdicts[m.candidateId] === "rejected").length;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-3 text-info" />
          Possible Identity Matches
          {pending > 0 && (
            <span className="rounded-full bg-info/15 px-1.5 py-px text-2xs font-bold normal-case tracking-normal text-info">
              {pending} pending review
            </span>
          )}
        </span>
        <button onClick={() => setShowInfo((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline hover:text-primary">
          <Info className="size-3" />
          {showInfo ? "Hide" : "How does this work?"}
        </button>
      </div>

      {/* Merge confirmation banner — auto-dismisses after 10s */}
      {approvedMatch && mergeBannerVisible && (
        <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-success/40 bg-success/[0.08] px-3.5 py-2.5">
          <div className="mt-px flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-success">
            <GitMerge className="size-3 text-white" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Identities merged — <span className="font-mono">{entity.id}</span> now linked to <span className="font-mono text-success">{approvedMatch.candidateId}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {approvedMatch.candidateLabel} · Recognition model retrained with combined embeddings · {approvedMatch.candidateDetections + entity.totalDetections} historical detections unified
            </p>
          </div>
        </div>
      )}
      {rejectedCount > 0 && !approvedMatch && (
        <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
          <X className="mt-0.5 size-3.5 flex-shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {rejectedCount} suggestion{rejectedCount > 1 ? "s" : ""} rejected — these candidates will not be re-suggested for <span className="font-mono">{entity.id}</span>.
          </p>
        </div>
      )}

      {showInfo && (
        <div className="mb-3 rounded-lg border border-info/30 bg-info/[0.04] px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            The system uses <strong className="text-foreground">adaptive identity recognition</strong> to maintain a consistent profile even when a person's appearance changes.
            If significant changes (new hairstyle, accessories, occlusion, lighting) drop direct-match confidence, the system classifies them as a new ID
            but runs a secondary similarity analysis against historical embeddings.
          </p>
          <p className="mt-2">
            Strong similarities surface as a suggestion here. Approving will <strong className="text-foreground">merge the two IDs</strong> — the recognition model is updated, historical detections
            are unified under one profile, and future appearances will be correctly recognised even with visual changes.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {matches.map((m) => (
          <PossibleMatchCard key={m.candidateId} match={m}
            verdict={verdicts[m.candidateId] ?? "pending"}
            onApprove={() => approve(m)}
            onReject={() => reject(m)} />
        ))}
      </div>
    </div>
  );
}

/* ── Shared: linked cases section ────────────────────────────────────────── */

function LinkedCasesSection({ linkedCases }: { linkedCases: import("@/types/entities").EntityLinkedCase[] }) {
  if (linkedCases.length === 0) return null;
  return (
    <div>
      <div className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Linked Cases
      </div>
      <div className="space-y-2">
        {linkedCases.map((c) => (
          <LinkedCaseCard key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}

/* ── Person body ─────────────────────────────────────────────────────────── */

function PersonBody({ entity }: { entity: PersonEntity }) {
  return (
    <>
      <EntityKpiRow
        totalDetections={entity.totalDetections}
        reIdConfidence={entity.reIdConfidence}
        priorIncidents={entity.priorEventCount}
      />

      {/* Meta grid — First Seen removed */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
        {(
          [
            ["Person ID", <span className="font-mono text-xs text-info">{entity.id}</span>],
            ["Last Seen", `${entity.lastSeen} (${entity.lastSeenAgo})`],
            [
              "Sites Observed",
              <span className="flex flex-wrap gap-1">
                {entity.sitesObserved.map((s) => (
                  <span key={s} className="rounded bg-muted px-1.5 py-px text-xs text-muted-foreground">{s}</span>
                ))}
              </span>,
            ],
            ["Identification", entity.identified ? "Identified" : "Unidentified"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div key={label as string} className="flex flex-col gap-0.5">
            <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="text-base font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>

      {entity.possibleMatches && entity.possibleMatches.length > 0 && (
        <PossibleMatchesSection entity={entity} matches={entity.possibleMatches} />
      )}

      <DetectedTimeline entries={entity.timeline} />
      <LinkedCasesSection linkedCases={entity.linkedCases} />
    </>
  );
}

/* ── Asset body — mirrors Person layout ──────────────────────────────────── */

function AssetBody({ entity }: { entity: AssetEntity }) {
  return (
    <>
      <EntityKpiRow
        totalDetections={entity.totalIncidents}
        reIdConfidence={entity.reIdConfidence ?? null}
        priorIncidents={entity.priorEventCount ?? 0}
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
        {(
          [
            ["Asset ID",       <span className="font-mono text-xs text-primary">{entity.id}</span>],
            ["Asset Title",    entity.type || "Unidentified Object"],
            ["Asset Type",     deriveAssetType(entity)],
            [
              "Sites Observed",
              <span className="flex flex-wrap gap-1">
                {entity.sitesObserved.map((s) => (
                  <span key={s} className="rounded bg-muted px-1.5 py-px text-xs text-muted-foreground">{s}</span>
                ))}
              </span>,
            ],
            ["Last Seen",      deriveLastSeen(entity.timeline)],
            ["Identification", entity.identified ? "Identified" : "Unidentified"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div key={label as string} className="flex flex-col gap-0.5">
            <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="text-base font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <DetectedTimeline entries={entity.timeline} />
      <LinkedCasesSection linkedCases={entity.linkedCases} />
    </>
  );
}

/* ── Vehicle body — mirrors Person layout ────────────────────────────────── */

function VehicleBody({ entity }: { entity: VehicleEntity }) {
  return (
    <>
      <EntityKpiRow
        totalDetections={entity.totalIncidents}
        reIdConfidence={entity.reIdConfidence ?? null}
        priorIncidents={entity.priorEventCount ?? 0}
      />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
        {(
          [
            ["Asset ID",       <span className="font-mono text-xs text-success">{entity.id}</span>],
            ["Asset Title",    deriveVehicleTitle(entity)],
            ["Asset Type",     "Vehicle"],
            [
              "Sites Observed",
              <span className="flex flex-wrap gap-1">
                {entity.sitesObserved.map((s) => (
                  <span key={s} className="rounded bg-muted px-1.5 py-px text-xs text-muted-foreground">{s}</span>
                ))}
              </span>,
            ],
            ["Last Seen",      deriveLastSeen(entity.timeline)],
            ["Identification", entity.identified ? "Identified" : "Unidentified"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div key={label as string} className="flex flex-col gap-0.5">
            <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            <span className="text-base font-medium text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <DetectedTimeline entries={entity.timeline} />
      <LinkedCasesSection linkedCases={entity.linkedCases} />
    </>
  );
}

/* ── Main drawer ─────────────────────────────────────────────────────────── */

interface EntityDrawerProps {
  entity: AnyEntity | null;
  open: boolean;
  onClose: () => void;
}

const KIND_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  person: {
    label: "Person",
    className:
      "inline-flex items-center gap-1 rounded border border-info/30 bg-info/10 px-2 py-px text-2xs font-bold uppercase tracking-wider text-info",
  },
  asset: {
    label: "Asset",
    className:
      "inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-2 py-px text-2xs font-bold uppercase tracking-wider text-primary",
  },
  vehicle: {
    label: "Vehicle",
    className:
      "inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-2 py-px text-2xs font-bold uppercase tracking-wider text-success",
  },
};

function entitySubtitle(entity: AnyEntity): string {
  if (entity.kind === "person") return (entity as PersonEntity).name;
  if (entity.kind === "asset") {
    const a = entity as AssetEntity;
    return `${a.type} · ${a.category}`;
  }
  const v = entity as VehicleEntity;
  return [v.vehicleType, v.color, v.plate].filter(Boolean).join(" · ");
}

export function EntityDrawer({ entity, open, onClose }: EntityDrawerProps) {
  const badge = entity ? KIND_BADGE[entity.kind] : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[min(680px,48vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          {entity ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  {badge && (
                    <span className={badge.className}>
                      <Shield className="size-2.5" />
                      {badge.label}
                    </span>
                  )}
                  {entity.identified ? (
                    <span className="rounded border border-success/20 bg-success-soft px-1.5 py-px text-2xs font-semibold text-success">
                      Identified
                    </span>
                  ) : (
                    <span className="rounded border border-border bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">
                      Unidentified
                    </span>
                  )}
                </div>
                <SheetTitle className="font-mono text-lg font-bold leading-snug">
                  {entity.id}
                </SheetTitle>
                <p className="mt-0.5 text-base text-muted-foreground">{entitySubtitle(entity)}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <SheetTitle className="text-md text-muted-foreground">Entity not found</SheetTitle>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        {entity && (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {entity.kind === "person" ? (
              <PersonBody entity={entity as PersonEntity} />
            ) : entity.kind === "vehicle" ? (
              <VehicleBody entity={entity as VehicleEntity} />
            ) : (
              <AssetBody entity={entity as AssetEntity} />
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
