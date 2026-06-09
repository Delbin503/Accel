import * as React from "react";
import { toast } from "sonner";
import {
  X,
  MapPin,
  Link2,
  UserCog,
  RefreshCw,
  FileDown,
  Search,
  Check,
  AlertTriangle,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SeverityBadge, parseEventText } from "@/pages/detection-feed/shared";
import { EventDrawer } from "@/pages/detection-feed/EventDrawer";
import { CaseStatusBadge, STATUS_CONFIG } from "@/pages/incident-cases/shared";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { ASSIGNEES } from "@/mocks/incidentCases";
import type { CaseStatus, CaseAssignee, CaseActivity, ActivityType } from "@/types/incidents";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { AnyEntity } from "@/types/entities";
import { EntityDrawer } from "@/pages/incident-cases/EntityDrawer";
import { ENTITY_PROFILES } from "@/mocks/entities";
import { TruncatedText } from "@/components/shared/TruncatedText";

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

/* ── Linked incident thumbnail ───────────────────────────────────────────── */

function LinkedThumb({ event }: { event: DetectionEvent }) {
  return (
    <div className="relative h-[90px] w-[140px] flex-shrink-0 overflow-hidden rounded-md bg-[linear-gradient(135deg,#2a1a0e_0%,#1a1a1a_100%)]">
      {event.bboxes.map((box, i) => (
        <React.Fragment key={i}>
          <div
            className={cn(
              "absolute border-2",
              box.variant === "person" ? "border-info bg-info/10" : "border-primary bg-primary/10"
            )}
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <span
            className={cn(
              "absolute -translate-y-full rounded-sm px-0.5 py-px text-3xs font-semibold text-white",
              box.variant === "person" ? "bg-info" : "bg-primary"
            )}
            style={{ top: box.top, left: box.left }}
          >
            {box.label}
          </span>
        </React.Fragment>
      ))}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/75 px-1 py-px font-mono text-2xs text-white">
        {event.time.slice(0, 5)}
      </span>
    </div>
  );
}


/* ── Clickable linked event card — mirrors Detection Feed EventCard ──────── */

function LinkedEventCard({
  event,
  onView,
}: {
  event: DetectionEvent;
  onView: () => void;
}) {
  return (
    <div
      onClick={onView}
      className="grid cursor-pointer grid-cols-[140px_1fr] gap-3 rounded-xl border border-l-[3px] bg-card p-3.5 transition-all hover:bg-muted/30 hover:-translate-y-px"
      style={{ borderLeftColor: `var(--sev-${event.severity})` }}
    >
      <LinkedThumb event={event} />

      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={event.severity} />
          <span className="text-base font-semibold text-foreground">{event.typeLabel}</span>
          <span
            title={event.useCaseTitle}
            className="cursor-help rounded border border-border bg-muted px-1.5 py-px font-mono text-xs text-muted-foreground hover:border-primary hover:text-primary"
          >
            {event.useCaseId}
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-purple/20 bg-purple-soft px-1.5 py-px font-mono text-2xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-purple" />
            {event.model}
          </span>
        </div>
        <p className="mb-2 line-clamp-2 text-base leading-relaxed text-muted-foreground">
          {parseEventText(event.summary)}
        </p>
        <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-2.5" />
            {event.areaDisplay} · {event.camera}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Change Status modal ─────────────────────────────────────────────────── */

const STATUS_OPTIONS: { value: CaseStatus; label: string; desc: string }[] = [
  { value: "open", label: "Open", desc: "Awaiting initial review" },
  { value: "in-review", label: "In Review", desc: "Investigation in progress" },
  { value: "action-taken", label: "Action Taken", desc: "Remediation steps completed" },
  { value: "closed", label: "Closed", desc: "Case resolved and archived" },
];

function ChangeStatusModal({
  open,
  currentStatus,
  onClose,
  onConfirm,
}: {
  open: boolean;
  currentStatus: CaseStatus;
  onClose: () => void;
  onConfirm: (s: CaseStatus) => void;
}) {
  const [picked, setPicked] = React.useState<CaseStatus>(currentStatus);

  React.useEffect(() => {
    if (open) setPicked(currentStatus);
  }, [open, currentStatus]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Change Case Status</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Select the new status for this incident case.
          </p>
        </DialogHeader>

        <div className="space-y-2 p-5">
          {STATUS_OPTIONS.map((opt) => {
            const s = STATUS_CONFIG[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => setPicked(opt.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                  picked === opt.value
                    ? "border-primary bg-primary-muted"
                    : "border-border bg-muted/30 hover:border-primary"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                    picked === opt.value ? "border-primary" : "border-muted-foreground/40"
                  )}
                >
                  {picked === opt.value && <span className="size-2 rounded-full bg-primary" />}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{opt.label}</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-px text-2xs font-bold uppercase tracking-wider",
                        s.badge
                      )}
                    >
                      <span className={cn("size-1 rounded-full", s.dot)} />
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={picked === currentStatus} onClick={() => onConfirm(picked)}>
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Reassign modal ──────────────────────────────────────────────────────── */

const ROLE_STYLES: Record<NonNullable<CaseAssignee["role"]>, { bg: string; text: string; label: string }> = {
  owner: { bg: "bg-success/15 border-success/30",     text: "text-success",   label: "Owner" },
  admin: { bg: "bg-info/15 border-info/30",           text: "text-info",      label: "Admin" },
  user:  { bg: "bg-warning/15 border-warning/30",     text: "text-warning",   label: "User"  },
};

function ReassignModal({
  open,
  current,
  onClose,
  onConfirm,
}: {
  open: boolean;
  current: CaseAssignee;
  onClose: () => void;
  onConfirm: (a: CaseAssignee) => void;
}) {
  const [picked, setPicked] = React.useState<CaseAssignee>(current);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<"all" | "owner" | "admin" | "user">("all");

  React.useEffect(() => {
    if (open) { setPicked(current); setSearch(""); setRoleFilter("all"); }
  }, [open, current]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return ASSIGNEES.filter((a) => {
      if (roleFilter !== "all" && a.role !== roleFilter) return false;
      if (q && !`${a.name} ${a.id} ${a.role ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, roleFilter]);

  const ROLE_PILLS: { key: typeof roleFilter; label: string }[] = [
    { key: "all",   label: "All" },
    { key: "owner", label: "Owners" },
    { key: "admin", label: "Admins" },
    { key: "user",  label: "Users" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Reassign Case</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Transfer ownership to another team member.
          </p>
        </DialogHeader>

        {/* Filter bar */}
        <div className="flex-shrink-0 space-y-2 border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, user ID or role…"
              className="h-9 pl-9 text-base"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
            {ROLE_PILLS.map((p) => {
              const active = roleFilter === p.key;
              const count = p.key === "all" ? ASSIGNEES.length : ASSIGNEES.filter((a) => a.role === p.key).length;
              return (
                <button
                  key={p.key}
                  onClick={() => setRoleFilter(p.key)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {p.label} <span className="font-mono opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-muted-foreground">
              No members match the current filters.
            </p>
          ) : filtered.map((a) => {
            const role = a.role ? ROLE_STYLES[a.role] : null;
            return (
              <button
                key={a.id}
                onClick={() => setPicked(a)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left transition-colors",
                  picked.id === a.id
                    ? "border-primary bg-primary-muted"
                    : "border-border bg-muted/30 hover:border-primary"
                )}
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {a.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-foreground">{a.name}</span>
                    {role && (
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-1.5 py-px text-3xs font-bold uppercase tracking-wider",
                        role.bg, role.text
                      )}>
                        {role.label}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{a.id}</div>
                </div>
                {picked.id === a.id && <Check className="size-4 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={picked.id === current.id} onClick={() => onConfirm(picked)}>
            Reassign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Link New Incidents modal ─────────────────────────────────────────────── */

function LinkNewIncidentsModal({
  open,
  caseSite,
  alreadyLinked,
  onClose,
  onConfirm,
}: {
  open: boolean;
  caseSite: string;
  alreadyLinked: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [areaFilter, setAreaFilter] = React.useState("all");
  const [cameraFilter, setCameraFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelectedIds(new Set());
      setAreaFilter("all");
      setCameraFilter("all");
      setSearch("");
    }
  }, [open]);

  const candidates = React.useMemo(
    () =>
      MOCK_EVENTS.filter(
        (e) => e.site === caseSite && !alreadyLinked.includes(e.id) && e.status !== "dismissed"
      ),
    [caseSite, alreadyLinked]
  );

  const areas = React.useMemo(
    () => [...new Set(candidates.map((e) => e.areaDisplay))],
    [candidates]
  );
  const cameras = React.useMemo(
    () => [...new Set(candidates.map((e) => e.camera))],
    [candidates]
  );

  const visible = candidates.filter((e) => {
    if (areaFilter !== "all" && e.areaDisplay !== areaFilter) return false;
    if (cameraFilter !== "all" && e.camera !== cameraFilter) return false;
    if (
      search.trim() &&
      !e.id.toLowerCase().includes(search.toLowerCase()) &&
      !e.typeLabel.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Link New Incidents</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Select incidents from the same site to add to this case.
          </p>
        </DialogHeader>

        <div className="space-y-3 p-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="relative col-span-3 sm:col-span-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={cameraFilter}
              onChange={(e) => setCameraFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">All cameras</option>
              {cameras.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8 text-muted-foreground">
              <Search className="size-8 opacity-20" />
              <p className="text-base">No available incidents from this site.</p>
            </div>
          ) : (
            <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-0.5">
              {visible.map((e) => {
                const sel = selectedIds.has(e.id);
                return (
                  <button
                    key={e.id}
                    onClick={() => toggle(e.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      sel
                        ? "border-primary bg-primary-muted"
                        : "border-border bg-muted/20 hover:border-primary"
                    )}
                    style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${e.severity})` }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                        sel ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {sel && (
                        <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {e.typeLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {e.areaDisplay} · {e.camera} · {e.dateDisplay}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedIds.size > 0 && (
            <p className="text-right text-sm font-semibold text-primary">
              {selectedIds.size} incident{selectedIds.size > 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selectedIds.size === 0}
            onClick={() => onConfirm([...selectedIds])}
          >
            Link {selectedIds.size > 0 ? selectedIds.size : ""} Incident
            {selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit Case modal ─────────────────────────────────────────────────────── */

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

function EditCaseModal({
  open,
  title: initialTitle,
  severity: initialSeverity,
  notes: initialNotes,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  severity: Severity;
  notes: string;
  onClose: () => void;
  onConfirm: (title: string, severity: Severity, notes: string) => void;
}) {
  const [title, setTitle] = React.useState(initialTitle);
  const [severity, setSeverity] = React.useState<Severity>(initialSeverity);
  const [notes, setNotes] = React.useState(initialNotes);

  React.useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSeverity(initialSeverity);
      setNotes(initialNotes);
    }
  }, [open, initialTitle, initialSeverity, initialNotes]);

  const unchanged =
    title.trim() === initialTitle && severity === initialSeverity && notes === initialNotes;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Edit Case</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Update the case title, severity, and notes.
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Case Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder="Case title..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Severity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSeverity(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border py-2.5 text-xs font-semibold transition-colors",
                    severity === opt.value
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary"
                  )}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: `var(--sev-${opt.value})` }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              placeholder="Add case notes..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!title.trim() || unchanged}
            onClick={() => onConfirm(title.trim(), severity, notes)}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete confirmation modal ───────────────────────────────────────────── */

function DeleteCaseModal({
  open,
  caseId,
  caseTitle,
  onClose,
  onConfirm,
}: {
  open: boolean;
  caseId: string;
  caseTitle: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-destructive">Delete Case</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">This action cannot be undone.</p>
        </DialogHeader>

        <div className="px-5 py-5">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div>
                <p className="text-base font-semibold text-foreground">
                  You are about to permanently delete:
                </p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{caseId}</p>
                <p className="mt-0.5 text-base text-muted-foreground">{caseTitle}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            All linked incident associations will be removed. The original detection events will not
            be affected.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={onConfirm}
          >
            <Trash2 className="size-3.5" />
            Delete Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── PDF export ──────────────────────────────────────────────────────────── */

function handleExportPDF(
  c: ReturnType<typeof useIncidentCasesStore.getState>["cases"][0],
  events: DetectionEvent[]
) {
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Export blocked", { description: "Please allow pop-ups for this page." });
    return;
  }

  const statusLabel = STATUS_CONFIG[c.status].label;
  const sevColour: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#d97706",
    low: "#16a34a",
  };
  const statusColour: Record<string, string> = {
    open: "#1d4ed8",
    "in-review": "#d97706",
    "action-taken": "#7c3aed",
    closed: "#16a34a",
  };

  const evRows = events
    .map(
      (e) => `
      <tr>
        <td>${e.id}</td>
        <td>${e.typeLabel}</td>
        <td>${e.areaDisplay}</td>
        <td>${e.camera}</td>
        <td>${e.dateDisplay} ${e.time.slice(0, 5)}</td>
        <td style="text-transform:capitalize;color:${sevColour[e.severity] ?? "#111"}">${e.severity}</td>
      </tr>`
    )
    .join("");

  /* eslint-disable-next-line no-useless-concat */
  const styleOpen = "<" + "style>";
  const styleClose = "<" + "/style>";
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Incident Case ${c.id}</title>
  ${styleOpen}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; color: #111; padding: 48px; font-size: 14px; line-height: 1.5; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .meta-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 600; display: block; margin-bottom: 2px; }
    .meta-item span { font-size: 13px; color: #111; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; font-weight: 700; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin: 24px 0 12px; }
    .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; font-size: 13px; color: #92400e; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; }
    td { padding: 8px 12px; border: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } @page { margin: 2cm; } }
  ${styleClose}
</head>
<body>
  <div class="header">
    <div class="badges">
      <span class="badge" style="background:#fee2e2;color:${sevColour[c.severity] ?? "#111"}">${c.severity.toUpperCase()}</span>
      <span class="badge" style="background:#eff6ff;color:${statusColour[c.status] ?? "#111"}">${statusLabel.toUpperCase()}</span>
    </div>
    <h1>${c.title}</h1>
    <div style="font-family:monospace;font-size:13px;color:#6b7280;margin-top:4px">${c.id} · ${c.siteDisplay}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><label>Assigned To</label><span>${c.assignedTo.name} (${c.assignedTo.id})</span></div>
    <div class="meta-item"><label>Site</label><span>${c.siteDisplay}</span></div>
    <div class="meta-item"><label>Created</label><span>${c.createdAtDisplay}</span></div>
    <div class="meta-item"><label>Last Updated</label><span>${c.updatedAtDisplay}</span></div>
    <div class="meta-item"><label>Linked Incidents</label><span>${c.incidentIds.length}</span></div>
    <div class="meta-item"><label>Severity</label><span style="text-transform:capitalize;color:${sevColour[c.severity] ?? "#111"};font-weight:700">${c.severity}</span></div>
  </div>

  ${
    c.notes
      ? `<div class="section-title">Case Notes</div>
  <div class="notes">${c.notes}</div>`
      : ""
  }

  <div class="section-title">Linked Incidents (${events.length})</div>
  ${
    events.length > 0
      ? `<table>
    <thead>
      <tr>
        <th>Event ID</th>
        <th>Type</th>
        <th>Area</th>
        <th>Camera</th>
        <th>Date / Time</th>
        <th>Severity</th>
      </tr>
    </thead>
    <tbody>${evRows}</tbody>
  </table>`
      : `<p style="color:#9ca3af;font-size:13px">No incident details available.</p>`
  }

  <div class="footer">
    <span>Exported from Delbin Accel TRMS</span>
    <span>${new Date().toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
  w.document.close();
  toast.success("PDF export ready", {
    description: "Your browser's print dialog has been opened.",
  });
}

/* ── Case Activity timeline ──────────────────────────────────────────────── */

const ACTIVITY_DOT: Record<ActivityType, string> = {
  created: "border-secondary",
  acknowledged: "border-success",
  status: "border-info",
  note: "border-warning",
  reassign: "border-purple",
  link: "border-info",
  sla: "border-sev-critical",
  edit: "border-muted-foreground",
};

function ActivityItem({
  entry,
  isLast,
}: {
  entry: CaseActivity;
  isLast: boolean;
}) {
  const isSla = entry.type === "sla";
  return (
    <div className="relative flex gap-4">
      {/* Dot + vertical connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 mt-0.5 size-3.5 flex-shrink-0 rounded-full border-2 bg-card",
            ACTIVITY_DOT[entry.type]
          )}
        />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className={cn("min-w-0 pb-5", isLast && "pb-0")}>
        <p className="mb-0.5 text-xs text-muted-foreground">
          {entry.timestampDisplay}
          <span className="mx-1.5 opacity-40">·</span>
          {entry.elapsed}
        </p>
        <p
          className={cn(
            "text-base font-semibold leading-snug",
            isSla ? "text-sev-critical" : "text-foreground"
          )}
        >
          {isSla && (
            <AlertTriangle className="mr-1 inline-block size-3.5 align-text-bottom" />
          )}
          {entry.title}
        </p>
        {entry.description && (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {entry.description}
          </p>
        )}
      </div>
    </div>
  );
}

function CaseActivityTimeline({ activity }: { activity: CaseActivity[] }) {
  if (activity.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center text-base text-muted-foreground">
        No activity recorded yet.
      </div>
    );
  }
  return (
    <div>
      {activity.map((entry, i) => (
        <ActivityItem key={entry.id} entry={entry} isLast={i === activity.length - 1} />
      ))}
    </div>
  );
}

/* ── Entity involved card ────────────────────────────────────────────────── */

const ENTITY_KIND_STYLE: Record<string, { borderColor: string; chipClass: string; label: string }> = {
  person: {
    borderColor: "var(--info)",
    chipClass: "border-info/25 bg-info/10 text-info",
    label: "Person",
  },
  asset: {
    borderColor: "var(--primary)",
    chipClass: "border-primary/25 bg-primary/10 text-primary",
    label: "Asset",
  },
  vehicle: {
    borderColor: "var(--success)",
    chipClass: "border-success/25 bg-success/10 text-success",
    label: "Vehicle",
  },
};

function inferKind(entityId: string): string {
  if (entityId.startsWith("PER-")) return "person";
  if (entityId.startsWith("VEH-")) return "vehicle";
  return "asset";
}

function EntityCard({
  entityId,
  entity,
  onViewInfo,
}: {
  entityId: string;
  entity: AnyEntity | undefined;
  onViewInfo?: () => void;
}) {
  const kind = entity?.kind ?? inferKind(entityId);
  const style = ENTITY_KIND_STYLE[kind] ?? ENTITY_KIND_STYLE.asset;

  function renderSubtitle() {
    if (!entity) return <p className="mb-1 text-sm italic text-muted-foreground">No profile on record</p>;
    if (entity.kind === "person")
      return <p className="mb-1 text-base text-muted-foreground">{entity.name}</p>;
    if (entity.kind === "vehicle") {
      const v = entity;
      return (
        <p className="mb-1 text-base text-muted-foreground">
          {[v.vehicleType, v.color].filter(Boolean).join(" · ")}
          {v.plate && (
            <span className="ml-1 font-mono text-sm text-foreground">{v.plate}</span>
          )}
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

/* ── Update Case dropdown button ─────────────────────────────────────────── */

interface UpdateCaseMenuProps {
  isActive: boolean;
  onChangeStatus: () => void;
  onReassign: () => void;
  onLinkIncidents: () => void;
  onEditCase: () => void;
  onDeleteCase: () => void;
}

function UpdateCaseMenu({
  isActive,
  onChangeStatus,
  onReassign,
  onLinkIncidents,
  onEditCase,
  onDeleteCase,
}: UpdateCaseMenuProps) {
  const [open, setOpen] = React.useState(false);

  function item(
    icon: React.ReactNode,
    label: string,
    handler: () => void,
    danger = false,
    disabled = false
  ) {
    return (
      <button
        onClick={() => {
          if (disabled) return;
          setOpen(false);
          handler();
        }}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-base transition-colors",
          danger
            ? "text-destructive hover:bg-destructive/10"
            : "text-foreground hover:bg-muted",
          disabled && "pointer-events-none opacity-40"
        )}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-1.5 text-sm">
          Update Case
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-52 p-1.5">
        <div className="mb-1 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Manage
        </div>
        {item(<RefreshCw className="size-3.5" />, "Change Status", onChangeStatus)}
        {item(
          <UserCog className="size-3.5" />,
          "Reassign",
          onReassign,
          false,
          !isActive
        )}
        {item(
          <Link2 className="size-3.5" />,
          "Link Incidents",
          onLinkIncidents,
          false,
          !isActive
        )}
        <div className="my-1.5 border-t border-border" />
        <div className="mb-1 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Case
        </div>
        {item(<Pencil className="size-3.5" />, "Edit Case", onEditCase)}
        {item(<Trash2 className="size-3.5" />, "Delete Case", onDeleteCase, true)}
      </PopoverContent>
    </Popover>
  );
}

/* ── Case Drawer ─────────────────────────────────────────────────────────── */

interface CaseDrawerProps {
  caseId: string | null;
  onClose: () => void;
}

export function CaseDrawer({ caseId, onClose }: CaseDrawerProps) {
  const { cases, updateStatus, reassign, linkEvents, editCase, deleteCase } =
    useIncidentCasesStore();
  const caseData = caseId ? (cases.find((c) => c.id === caseId) ?? null) : null;

  const [statusModal, setStatusModal] = React.useState(false);
  const [reassignModal, setReassignModal] = React.useState(false);
  const [linkModal, setLinkModal] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);
  const [deleteModal, setDeleteModal] = React.useState(false);

  const [areaFilter, setAreaFilter] = React.useState("all");
  const [cameraFilter, setCameraFilter] = React.useState("all");

  const [viewEvent, setViewEvent] = React.useState<DetectionEvent | null>(null);
  const [viewEntity, setViewEntity] = React.useState<AnyEntity | null>(null);

  React.useEffect(() => {
    setAreaFilter("all");
    setCameraFilter("all");
    setStatusModal(false);
    setReassignModal(false);
    setLinkModal(false);
    setEditModal(false);
    setDeleteModal(false);
    setViewEvent(null);
    setViewEntity(null);
  }, [caseId]);

  const isActive = caseData?.status === "open" || caseData?.status === "in-review";

  const allLinkedEvents = caseData
    ? MOCK_EVENTS.filter((e) => caseData.incidentIds.includes(e.id))
    : [];

  const linkedAreas = [...new Set(allLinkedEvents.map((e) => e.areaDisplay))];
  const linkedCameras = [...new Set(allLinkedEvents.map((e) => e.camera))];

  const filteredEvents = allLinkedEvents.filter((e) => {
    if (areaFilter !== "all" && e.areaDisplay !== areaFilter) return false;
    if (cameraFilter !== "all" && e.camera !== cameraFilter) return false;
    return true;
  });

  const involvedEntities = React.useMemo(() => {
    const assetIds = [...new Set(allLinkedEvents.flatMap((e) => (e.assetId ? [e.assetId] : [])))];
    const personIds = [...new Set(allLinkedEvents.flatMap((e) => (e.personId ? [e.personId] : [])))];
    const vehicleIds = [...new Set(allLinkedEvents.flatMap((e) => (e.vehicleId ? [e.vehicleId] : [])))];
    return [
      ...assetIds.map((id) => ({ id, entity: ENTITY_PROFILES[id] as AnyEntity | undefined })),
      ...personIds.map((id) => ({ id, entity: ENTITY_PROFILES[id] as AnyEntity | undefined })),
      ...vehicleIds.map((id) => ({ id, entity: ENTITY_PROFILES[id] as AnyEntity | undefined })),
    ];
  }, [allLinkedEvents]);

  function handleStatusConfirm(s: CaseStatus) {
    if (!caseData) return;
    updateStatus(caseData.id, s);
    setStatusModal(false);
    toast.success("Status updated", {
      description: `Case ${caseData.id} is now ${STATUS_CONFIG[s].label}.`,
    });
  }

  function handleReassignConfirm(a: CaseAssignee) {
    if (!caseData) return;
    reassign(caseData.id, a);
    setReassignModal(false);
    toast.success("Case reassigned", {
      description: `${caseData.id} has been assigned to ${a.name}.`,
    });
  }

  function handleLinkConfirm(ids: string[]) {
    if (!caseData) return;
    linkEvents(caseData.id, ids);
    setLinkModal(false);
    toast.success(`${ids.length} incident${ids.length > 1 ? "s" : ""} linked`, {
      description: `Added to case ${caseData.id}.`,
    });
  }

  function handleEditConfirm(title: string, severity: Severity, notes: string) {
    if (!caseData) return;
    editCase(caseData.id, { title, severity, notes });
    setEditModal(false);
    toast.success("Case updated", { description: `${caseData.id} has been updated.` });
  }

  function handleDeleteConfirm() {
    if (!caseData) return;
    const id = caseData.id;
    deleteCase(id);
    setDeleteModal(false);
    onClose();
    toast.success("Case deleted", { description: `${id} has been permanently removed.` });
  }

  const unresolvedIds = caseData
    ? caseData.incidentIds.filter((id) => !MOCK_EVENTS.find((e) => e.id === id))
    : [];

  return (
    <>
      <Sheet open={caseId !== null} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <SheetHeader className="border-b border-border bg-card px-5 py-4">
            {caseData ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <SeverityBadge severity={caseData.severity} />
                    <CaseStatusBadge status={caseData.status} />
                  </div>
                  <SheetTitle className="text-lg font-bold leading-snug">
                    {caseData.title}
                  </SheetTitle>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {caseData.id} · {caseData.siteDisplay}
                  </p>
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
                <SheetTitle className="text-md text-muted-foreground">
                  Case not found
                </SheetTitle>
                <button
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </SheetHeader>

          {/* ── Body ───────────────────────────────────────────────────────── */}
          {caseData ? (
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              {/* Case Details */}
              <div>
                <SectionTitle>Case Details</SectionTitle>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
                  {(
                    [
                      [
                        "Case ID",
                        <span className="font-mono text-xs text-primary">{caseData.id}</span>,
                      ],
                      ["Site", caseData.siteDisplay],
                      ["Status", <CaseStatusBadge status={caseData.status} />],
                      ["Severity", <SeverityBadge severity={caseData.severity} />],
                      [
                        "Assigned To",
                        <span className="inline-flex items-center gap-1.5">
                          <span className="flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-3xs font-bold text-primary">
                            {caseData.assignedTo.name.charAt(0)}
                          </span>
                          <TruncatedText text={caseData.assignedTo.name} className="text-sm" />
                          <span className="font-mono text-2xs text-muted-foreground">
                            ({caseData.assignedTo.id})
                          </span>
                        </span>,
                      ],
                      [
                        "Incidents",
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-px text-sm font-bold text-foreground">
                          {caseData.incidentIds.length}
                        </span>,
                      ],
                      ["Created", caseData.createdAtDisplay],
                      ["Updated", caseData.updatedAtDisplay],
                    ] as [string, React.ReactNode][]
                  ).map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {label}
                      </span>
                      <span className="text-base font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Notes */}
              {caseData.notes && (
                <div>
                  <SectionTitle>Case Notes</SectionTitle>
                  <div className="rounded-lg border border-sev-medium/25 bg-sev-medium-soft p-3.5 text-base leading-relaxed text-foreground">
                    {caseData.notes}
                  </div>
                </div>
              )}

              {/* Entities Involved */}
              {involvedEntities.length > 0 && (
                <div>
                  <SectionTitle
                    aside={
                      <span className="rounded-full bg-muted px-2 py-px text-xs font-semibold text-muted-foreground">
                        {involvedEntities.length}
                      </span>
                    }
                  >
                    Entities Involved
                  </SectionTitle>
                  <div className="space-y-2">
                    {involvedEntities.map(({ id, entity }) => (
                      <EntityCard
                        key={id}
                        entityId={id}
                        entity={entity}
                        onViewInfo={entity ? () => setViewEntity(entity) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Incidents */}
              <div>
                <SectionTitle
                  aside={
                    <div className="flex items-center gap-1.5">
                      {(areaFilter !== "all" || cameraFilter !== "all") && (
                        <button
                          onClick={() => {
                            setAreaFilter("all");
                            setCameraFilter("all");
                          }}
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          Clear ×
                        </button>
                      )}
                      <span className="rounded-full bg-muted px-2 py-px text-xs font-semibold text-muted-foreground">
                        {filteredEvents.length}
                        {filteredEvents.length !== allLinkedEvents.length
                          ? ` / ${allLinkedEvents.length}`
                          : ""}
                      </span>
                    </div>
                  }
                >
                  Linked Incidents
                </SectionTitle>

                {allLinkedEvents.length > 0 && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <select
                      value={areaFilter}
                      onChange={(e) => setAreaFilter(e.target.value)}
                      className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="all">All areas</option>
                      {linkedAreas.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <select
                      value={cameraFilter}
                      onChange={(e) => setCameraFilter(e.target.value)}
                      className="h-7 rounded-md border border-border bg-card px-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="all">All cameras</option>
                      {linkedCameras.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-muted-foreground">
                      Click a card to view event details
                    </span>
                  </div>
                )}

                {allLinkedEvents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-muted-foreground">
                    <Link2 className="size-7 opacity-20" />
                    <p className="text-base">No incidents linked yet.</p>
                    {isActive && (
                      <Button variant="ghost" size="sm" onClick={() => setLinkModal(true)}>
                        Link incidents
                      </Button>
                    )}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-muted-foreground">
                    <p className="text-base">No incidents match this filter.</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAreaFilter("all");
                        setCameraFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.map((e) => (
                      <LinkedEventCard key={e.id} event={e} onView={() => setViewEvent(e)} />
                    ))}
                  </div>
                )}

                {unresolvedIds.length > 0 && (
                  <div className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      <strong className="text-foreground">{unresolvedIds.length}</strong> additional
                      incident{unresolvedIds.length > 1 ? "s" : ""} linked (details pending sync):{" "}
                      <span className="font-mono text-2xs">{unresolvedIds.join(", ")}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Case Activity */}
              <div>
                <SectionTitle>Case Activity</SectionTitle>
                <CaseActivityTimeline activity={caseData.activity} />
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <AlertTriangle className="size-8 opacity-20" />
              <p className="text-sm">Case not found.</p>
            </div>
          )}

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          {caseData && (
            <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
              <UpdateCaseMenu
                isActive={!!isActive}
                onChangeStatus={() => setStatusModal(true)}
                onReassign={() => setReassignModal(true)}
                onLinkIncidents={() => setLinkModal(true)}
                onEditCase={() => setEditModal(true)}
                onDeleteCase={() => setDeleteModal(true)}
              />
              <Button
                variant="outline"
                size="sm"
                className="ml-auto gap-1.5 text-sm"
                onClick={() => handleExportPDF(caseData, allLinkedEvents)}
              >
                <FileDown className="size-3.5" />
                Export PDF
              </Button>
            </div>
          )}

          {/* ── Modals ─────────────────────────────────────────────────────── */}
          {caseData && (
            <>
              <ChangeStatusModal
                open={statusModal}
                currentStatus={caseData.status}
                onClose={() => setStatusModal(false)}
                onConfirm={handleStatusConfirm}
              />
              <ReassignModal
                open={reassignModal}
                current={caseData.assignedTo}
                onClose={() => setReassignModal(false)}
                onConfirm={handleReassignConfirm}
              />
              <LinkNewIncidentsModal
                open={linkModal}
                caseSite={caseData.site}
                alreadyLinked={caseData.incidentIds}
                onClose={() => setLinkModal(false)}
                onConfirm={handleLinkConfirm}
              />
              <EditCaseModal
                open={editModal}
                title={caseData.title}
                severity={caseData.severity}
                notes={caseData.notes}
                onClose={() => setEditModal(false)}
                onConfirm={handleEditConfirm}
              />
              <DeleteCaseModal
                open={deleteModal}
                caseId={caseData.id}
                caseTitle={caseData.title}
                onClose={() => setDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
              />
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Nested event detail drawer ──────────────────────────────────── */}
      <EventDrawer
        event={viewEvent}
        open={viewEvent !== null}
        onClose={() => setViewEvent(null)}
        onEscalate={() => setViewEvent(null)}
        onDismiss={() => setViewEvent(null)}
      />

      {/* ── Nested entity detail drawer ─────────────────────────────────── */}
      <EntityDrawer
        entity={viewEntity}
        open={viewEntity !== null}
        onClose={() => setViewEntity(null)}
      />
    </>
  );
}
