import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Check, FolderOpen, MapPin, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { parseEventText, SeverityBadge } from "@/pages/detection-feed/shared";
import IncidentCasesPage from "@/pages/incident-cases";
import { cn } from "@/lib/utils";
import type { Severity } from "@/types/detection";
import { FloatingBar } from "../PRD_Phase_1_3/FloatingBar";
import { useTrmsStore } from "./useTrmsStore";
import {
  KIND_LABEL,
  STATIONS,
  toDetectionEvent,
  type DetectionKind,
  type DetectionStatus,
  type TrmsDetection,
} from "./trmsData";
import { hhmmss, whereLabel } from "./trmsFormat";
import { KindIcon, StatusChip } from "./detectionUi";

/* Alert Log — the Detection Feed and Incident Cases as one module.

   Detections are the TRMS store's records, the same ones Live Monitoring
   raises, so "Open in Alert Log" from a live toast lands on the matching row.
   Escalating opens a case in the real incident-cases store, and the Cases tab
   is the real Incident Cases page — so a case opened here is a full case. */

type Tab = "detections" | "cases";

interface AlertLogState {
  eventId?: string;
  tab?: Tab;
  openCaseId?: string;
}

/* ── Snapshot thumbnail — same chrome as the Detection Feed card ────── */

function Snapshot({ detection: d, selected, size = "sm" }: {
  detection: TrmsDetection; selected?: boolean; size?: "sm" | "lg";
}) {
  const box = toDetectionEvent(d).bboxes[0];
  const person = d.kind === "person";
  return (
    <div className={cn(
      "relative overflow-hidden rounded-lg border border-border bg-neutral-950",
      size === "sm" ? "h-[88px] w-[140px]" : "aspect-video w-full"
    )}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
      {selected !== undefined && (
        <span className={cn(
          "absolute left-1.5 top-1.5 z-10 flex size-4 items-center justify-center rounded border-2",
          selected ? "border-primary bg-primary" : "border-white/60 bg-black/40"
        )}>
          {selected && <Check className="size-2.5 text-white" strokeWidth={3} />}
        </span>
      )}
      <div
        className={cn("absolute border-2", person ? "border-info bg-info/10" : "border-primary bg-primary/10")}
        style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
      />
      <span
        className={cn("absolute -translate-y-full rounded-sm px-0.5 py-px text-3xs font-semibold text-white", person ? "bg-info" : "bg-primary")}
        style={{ top: box.top, left: box.left }}
      >
        {box.label}
      </span>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1 py-px font-mono text-2xs text-white">
        {hhmmss(d.at).slice(0, 5)}
      </span>
    </div>
  );
}

/* ── Event card ──────────────────────────────────────────────────────── */

function EventCard({ detection: d, selected, focused, onSelect, onOpen, onEscalate, onDismiss, onViewCase }: {
  detection: TrmsDetection;
  selected: boolean;
  focused: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onEscalate: () => void;
  onDismiss: () => void;
  onViewCase: () => void;
}) {
  const event = toDetectionEvent(d);
  return (
    <div
      onClick={onOpen}
      data-event-id={d.id}
      className={cn(
        "relative grid cursor-pointer grid-cols-[140px_1fr] gap-3 rounded-xl border border-l-[3px] bg-card p-3.5 transition-all hover:bg-muted/30 sm:grid-cols-[140px_1fr_auto] sm:gap-4",
        selected ? "border-primary bg-primary-muted" : focused ? "border-primary" : "border-border",
        focused && "shadow-[0_0_0_2px_var(--primary)]",
        d.status !== "pending" && "opacity-75"
      )}
      style={{ borderLeftColor: `var(--sev-${d.severity})` }}
    >
      <div className="self-start" onClick={(e) => { e.stopPropagation(); if (d.status === "pending") onSelect(); }}>
        <Snapshot detection={d} selected={d.status === "pending" ? selected : undefined} />
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={d.severity} />
          <span className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
            <KindIcon kind={d.kind} className={cn("size-3.5", d.kind === "person" ? "text-info" : "text-warning")} />
            {KIND_LABEL[d.kind]}
          </span>
          <StatusChip detection={d} />
          <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{d.id}</span>
        </div>
        <p className="mb-2 text-base leading-relaxed text-muted-foreground">{parseEventText(event.summary)}</p>
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" />
            IMT Camp · {whereLabel(d)}
          </span>
          <span className="font-mono">{hhmmss(d.at)}</span>
          <span>{(d.confidence * 100).toFixed(0)}% confidence</span>
        </div>
      </div>

      <div
        className="col-span-2 flex flex-wrap gap-1.5 sm:col-span-1 sm:flex-col sm:items-stretch sm:self-start"
        onClick={(e) => e.stopPropagation()}
      >
        {d.status === "escalated" ? (
          <Button variant="outline" size="sm" className="text-xs" onClick={onViewCase}>View Case →</Button>
        ) : d.status === "dismissed" ? (
          <span className="px-2 py-1 text-xs text-muted-foreground">Dismissed</span>
        ) : (
          <>
            <Button size="sm" className="text-xs" onClick={onEscalate}>Escalate Case</Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={onDismiss}>Dismiss</Button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Detail drawer ───────────────────────────────────────────────────── */

function DetectionDrawer({ detection: d, onClose, onEscalate, onDismiss, onViewCase }: {
  detection: TrmsDetection | null;
  onClose: () => void;
  onEscalate: () => void;
  onDismiss: () => void;
  onViewCase: () => void;
}) {
  return (
    <Sheet open={!!d} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-[min(560px,92vw)] max-w-[92vw] flex-col gap-0 p-0">
        {d && (
          <>
            <SheetHeader className="border-b border-border bg-card px-5 py-4">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <SeverityBadge severity={d.severity} />
                <StatusChip detection={d} />
              </div>
              <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                <KindIcon kind={d.kind} className="size-4" />
                {KIND_LABEL[d.kind]}
              </SheetTitle>
              <p className="font-mono text-2xs text-muted-foreground">{d.id} · {hhmmss(d.at)}</p>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <Snapshot detection={d} size="lg" />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
                {([
                  ["Subject", d.subject],
                  ["Station", STATIONS.find((s) => s.id === d.stationId)?.name ?? d.stationId],
                  ["Lane", `Lane ${d.lane}`],
                  ["Camera", <span className="font-mono">{d.cameraId}</span>],
                  ["Assignment", d.assignmentId
                    ? <span className="font-mono">{d.assignmentId}</span>
                    : <span className="text-sev-critical">None active</span>],
                  ["Confidence", `${(d.confidence * 100).toFixed(0)}%`],
                ] as [string, React.ReactNode][]).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                    <span className="text-base font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
              {d.status === "escalated" ? (
                <Button className="gap-1.5" onClick={onViewCase}>
                  <FolderOpen className="size-3.5" />
                  Open {d.caseId}
                </Button>
              ) : d.status === "pending" ? (
                <>
                  <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
                  <Button onClick={onEscalate}>Escalate Case</Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Dismissed — no further action.</span>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Detections tab ──────────────────────────────────────────────────── */

type StatusFilter = "all" | DetectionStatus;

function DetectionsTab({ focusId, onViewCase }: { focusId: string | null; onViewCase: (caseId: string) => void }) {
  const detections = useTrmsStore((s) => s.detections);
  const escalate = useTrmsStore((s) => s.escalate);
  const dismiss = useTrmsStore((s) => s.dismiss);

  const [search, setSearch] = React.useState("");
  const [kind, setKind] = React.useState<"all" | DetectionKind>("all");
  const [severity, setSeverity] = React.useState<"all" | Severity>("all");
  const [station, setStation] = React.useState("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [openId, setOpenId] = React.useState<string | null>(null);

  const filtered = detections.filter((d) => {
    if (kind !== "all" && d.kind !== kind) return false;
    if (severity !== "all" && d.severity !== severity) return false;
    if (station !== "all" && d.stationId !== station) return false;
    if (status !== "all" && d.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![d.id, d.subject, d.cameraId, d.stationId, d.assignmentId ?? ""].join(" ").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Arriving from a live toast: bring that row into view.
  React.useEffect(() => {
    if (!focusId) return;
    document.querySelector(`[data-event-id="${focusId}"]`)?.scrollIntoView({ block: "center" });
  }, [focusId]);

  function doEscalate(ids: string[]) {
    const caseId = escalate(ids);
    if (!caseId) return;
    setSelected(new Set());
    toast.success(`Case ${caseId} opened`, {
      description: `${ids.length} detection${ids.length === 1 ? "" : "s"} linked.`,
      action: { label: "View case", onClick: () => onViewCase(caseId) },
    });
  }

  function doDismiss(ids: string[]) {
    dismiss(ids);
    setSelected(new Set());
    toast.message(`${ids.length} detection${ids.length === 1 ? "" : "s"} dismissed`);
  }

  function toggle(id: string) {
    setSelected((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const counts = {
    total: detections.length,
    pending: detections.filter((d) => d.status === "pending").length,
    escalated: detections.filter((d) => d.status === "escalated").length,
    critical: detections.filter((d) => d.severity === "critical" && d.status === "pending").length,
  };
  const open = detections.find((d) => d.id === openId) ?? null;

  return (
    <div className={cn("flex flex-col gap-4", selected.size > 0 && "pb-24")}>
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Detections</PageHeader.Title>
          <PageHeader.Description>
            Every person and weapon the cameras have raised — the same events Live Monitoring shows.
            Escalate one to open an incident case.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <KpiGrid cols={4}>
        <KpiCard label="Total Detections" value={String(counts.total)} sub="Today, all stations" accent="primary"
          active={status === "all" && severity === "all"} onClick={() => { setStatus("all"); setSeverity("all"); }} />
        <KpiCard label="Pending" value={String(counts.pending)} sub="Awaiting triage" accent="warning"
          active={status === "pending"} onClick={() => setStatus((s) => (s === "pending" ? "all" : "pending"))} />
        <KpiCard label="Escalated" value={String(counts.escalated)} sub="Linked to a case" accent="success"
          active={status === "escalated"} onClick={() => setStatus((s) => (s === "escalated" ? "all" : "escalated"))} />
        <KpiCard label="Critical Pending" value={String(counts.critical)} sub="Weapon with no assignment" accent="sev-critical"
          active={severity === "critical"} onClick={() => { setSeverity((v) => (v === "critical" ? "all" : "critical")); setStatus("pending"); }} />
      </KpiGrid>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by detection, person, weapon, camera or assignment…"
            className="h-9 w-full border-0 bg-transparent pl-9 text-base focus-visible:ring-0" />
        </div>
        <Select value={kind} onValueChange={(v) => setKind(v as "all" | DetectionKind)}>
          <SelectTrigger className="h-9 w-auto" aria-label="Detection kind"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All kinds</SelectItem>
            <SelectItem value="person">Person detected</SelectItem>
            <SelectItem value="weapon">Weapon detected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => setSeverity(v as "all" | Severity)}>
          <SelectTrigger className="h-9 w-auto" aria-label="Severity"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={station} onValueChange={setStation}>
          <SelectTrigger className="h-9 w-auto" aria-label="Base station"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stations</SelectItem>
            {STATIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.id}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="h-9 w-auto" aria-label="Status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong> detection{filtered.length === 1 ? "" : "s"} match current filters
      </p>

      <div className="space-y-2.5">
        {filtered.map((d) => (
          <EventCard
            key={d.id}
            detection={d}
            selected={selected.has(d.id)}
            focused={d.id === focusId}
            onSelect={() => toggle(d.id)}
            onOpen={() => setOpenId(d.id)}
            onEscalate={() => doEscalate([d.id])}
            onDismiss={() => doDismiss([d.id])}
            onViewCase={() => d.caseId && onViewCase(d.caseId)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
            No detections match the current filters.
          </div>
        )}
      </div>

      {selected.size > 0 && (
        <FloatingBar className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </div>
            <span className="text-base font-semibold text-foreground">
              {selected.size} detection{selected.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setSelected(new Set())}>
              <X className="size-3.5" />
              Clear selection
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => doDismiss([...selected])}>
              <Trash2 className="size-3.5" />
              Dismiss
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => doEscalate([...selected])}>
              <FolderOpen className="size-3.5" />
              Escalate Case
            </Button>
          </div>
        </FloatingBar>
      )}

      <DetectionDrawer
        detection={open}
        onClose={() => setOpenId(null)}
        onEscalate={() => { if (open) doEscalate([open.id]); }}
        onDismiss={() => { if (open) { doDismiss([open.id]); setOpenId(null); } }}
        onViewCase={() => { if (open?.caseId) { setOpenId(null); onViewCase(open.caseId); } }}
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export function TrmsAlertLog() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as AlertLogState | null) ?? {};
  const tab: Tab = state.tab ?? "detections";
  const escalatedCount = useTrmsStore((s) => s.detections.filter((d) => d.status === "escalated").length);
  const pendingCount = useTrmsStore((s) => s.detections.filter((d) => d.status === "pending").length);

  function go(next: AlertLogState) {
    navigate("/alerts", { state: next });
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "detections", label: "Detections", count: pendingCount },
    { key: "cases", label: "Incident Cases", count: escalatedCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* One module, two views — each view carries its own header. */}
      <div role="tablist" aria-label="Alert Log" className="flex gap-1 self-start rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => go({ tab: t.key })}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.label}
            <span className={cn(
              "rounded-full px-1.5 py-px font-mono text-2xs",
              tab === t.key ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {tab === "detections" ? (
        <DetectionsTab
          focusId={state.eventId ?? null}
          onViewCase={(caseId) => go({ tab: "cases", openCaseId: caseId })}
        />
      ) : (
        // Keyed so arriving with a different case to open remounts the page,
        // which reads openCaseId from the location on mount.
        <IncidentCasesPage key={state.openCaseId ?? "cases"} />
      )}
    </div>
  );
}
