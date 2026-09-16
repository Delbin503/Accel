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
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalSubheader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ListErrorState } from "@/components/shared/PageStates";
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

export function ChangeStatusModal({
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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Change Case Status"
          description="Select the new status for this incident case."
        />

        <ModalBody className="space-y-2">
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
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={picked === currentStatus} onClick={() => onConfirm(picked)}>
            Update Status
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Reassign modal ──────────────────────────────────────────────────────── */

const ROLE_STYLES: Record<NonNullable<CaseAssignee["role"]>, { bg: string; text: string; label: string }> = {
  owner: { bg: "bg-success/15 border-success/30",     text: "text-success",   label: "Owner" },
  admin: { bg: "bg-info/15 border-info/30",           text: "text-info",      label: "Admin" },
  user:  { bg: "bg-warning/15 border-warning/30",     text: "text-warning",   label: "User"  },
};

export function ReassignModal({
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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Reassign Case"
          description="Transfer ownership to another team member."
        />

        {/* Filter bar */}
        <ModalSubheader className="space-y-2">
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
        </ModalSubheader>

        <ModalBody className="space-y-1.5">
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
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={picked.id === current.id} onClick={() => onConfirm(picked)}>
            Reassign
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Link New Incidents modal ─────────────────────────────────────────────── */

export function LinkNewIncidentsModal({
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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Link New Incidents"
          description="Select incidents from the same site to add to this case."
        />

        <ModalBody className="space-y-3">
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
            <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v)}>
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue placeholder="All areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All areas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cameraFilter} onValueChange={(v) => setCameraFilter(v)}>
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue placeholder="All cameras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cameras</SelectItem>
                {cameras.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </ModalBody>

        <ModalFooter>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Edit Case modal ─────────────────────────────────────────────────────── */

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function EditCaseModal({
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
  const [titleErr, setTitleErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSeverity(initialSeverity);
      setNotes(initialNotes);
      setTitleErr(null);
    }
  }, [open, initialTitle, initialSeverity, initialNotes]);

  const unchanged =
    title.trim() === initialTitle && severity === initialSeverity && notes === initialNotes;

  function handleSave() {
    if (!title.trim()) {
      setTitleErr("Case title is required.");
      return;
    }
    onConfirm(title.trim(), severity, notes);
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Edit Case"
          description="Update the case title, severity, and notes."
        />

        <ModalBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Case Title
            </label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleErr) setTitleErr(null); }}
              className={cn(
                "h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                titleErr && "border-sev-critical"
              )}
              placeholder="Case title..."
            />
            {titleErr && <p className="mt-1 text-xs text-sev-critical">{titleErr}</p>}
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
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full text-base"
              placeholder="Add case notes..."
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={unchanged}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete confirmation modal ───────────────────────────────────────────── */

export function DeleteCaseModal({
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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Delete Case"
          description="This action cannot be undone."
          tone="destructive"
        />

        <ModalBody>
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
        </ModalBody>

        <ModalFooter>
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
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── PDF export ──────────────────────────────────────────────────────────── */

/** Print palette — the app's tokens resolved to fixed values for paper. */
const PRINT_SEVERITY: Record<string, { fg: string; bg: string }> = {
  critical: { fg: "#b91c1c", bg: "#fef2f2" },
  high:     { fg: "#c2410c", bg: "#fff7ed" },
  medium:   { fg: "#b45309", bg: "#fffbeb" },
  low:      { fg: "#15803d", bg: "#f0fdf4" },
};

const PRINT_STATUS: Record<string, { fg: string; bg: string }> = {
  open:           { fg: "#1d4ed8", bg: "#eff6ff" },
  "in-review":    { fg: "#b45309", bg: "#fffbeb" },
  "action-taken": { fg: "#6d28d9", bg: "#f5f3ff" },
  closed:         { fg: "#15803d", bg: "#f0fdf4" },
};

/** Timeline dot colour per activity kind — mirrors ACTIVITY_DOT on screen. */
const PRINT_ACTIVITY: Record<ActivityType, string> = {
  created:      "#6d28d9",
  acknowledged: "#15803d",
  status:       "#1d4ed8",
  note:         "#b45309",
  reassign:     "#6d28d9",
  link:         "#1d4ed8",
  sla:          "#b91c1c",
  edit:         "#6b7280",
};

/** Escapes case-authored text — notes and titles land in the report as markup. */
function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function handleExportPDF(
  c: ReturnType<typeof useIncidentCasesStore.getState>["cases"][0],
  events: DetectionEvent[]
) {
  const w = window.open("", "_blank");
  if (!w) {
    toast.error("Export blocked", { description: "Please allow pop-ups for this page." });
    return;
  }

  const sev = PRINT_SEVERITY[c.severity] ?? { fg: "#111827", bg: "#f3f4f6" };
  const status = PRINT_STATUS[c.status] ?? { fg: "#111827", bg: "#f3f4f6" };
  const statusLabel = STATUS_CONFIG[c.status].label;

  const exportedAt = new Date().toLocaleString("en-SG", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  /* Severity mix across the linked incidents — the report's one summary stat. */
  const sevCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.severity] = (acc[e.severity] ?? 0) + 1;
    return acc;
  }, {});
  const sevSummary = ["critical", "high", "medium", "low"]
    .filter((k) => sevCounts[k])
    .map((k) => `${sevCounts[k]} ${k}`)
    .join(" · ");

  const evRows = events
    .map((e, i) => {
      const c2 = PRINT_SEVERITY[e.severity] ?? { fg: "#111827", bg: "#f3f4f6" };
      return `
      <tr>
        <td class="num">${i + 1}</td>
        <td class="mono">${esc(e.id)}</td>
        <td><strong>${esc(e.typeLabel)}</strong></td>
        <td>${esc(e.areaDisplay)}</td>
        <td class="mono">${esc(e.camera)}</td>
        <td class="nowrap">${esc(e.dateDisplay)} ${esc(e.time.slice(0, 5))}</td>
        <td><span class="pill" style="color:${c2.fg};background:${c2.bg}">${esc(e.severity)}</span></td>
      </tr>`;
    })
    .join("");

  const activityRows = c.activity
    .map(
      (a) => `
      <li class="event" style="--dot:${PRINT_ACTIVITY[a.type] ?? "#6b7280"}">
        <div class="event-meta">${esc(a.timestampDisplay)} · ${esc(a.elapsed)}</div>
        <div class="event-title">${esc(a.title)}</div>
        ${a.description ? `<div class="event-desc">${esc(a.description)}</div>` : ""}
      </li>`
    )
    .join("");

  /* eslint-disable-next-line no-useless-concat */
  const styleOpen = "<" + "style>";
  const styleClose = "<" + "/style>";
  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(c.id)} — Incident Case Report</title>
  ${styleOpen}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #111827; background: #fff;
      font-size: 12px; line-height: 1.55;
      padding: 40px 44px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact;
    }

    /* ── Masthead ── */
    .masthead { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
      border-bottom: 3px solid #111827; padding-bottom: 14px; }
    .brand { display: flex; align-items: center; gap: 9px; }
    .brand svg { width: 26px; height: 26px; color: #ea580c; }
    .brand-name { font-size: 17px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-sub { font-size: 9px; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; font-weight: 700; margin-top: 1px; }
    .doc-type { text-align: right; }
    .doc-type .kind { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #6b7280; font-weight: 700; }
    .doc-type .ref { font-family: ui-monospace, Menlo, monospace; font-size: 13px; font-weight: 700; margin-top: 2px; }
    .doc-type .when { font-size: 10px; color: #9ca3af; margin-top: 2px; }

    /* ── Title block ── */
    .title-block { margin: 22px 0 18px; }
    .pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .pill { display: inline-block; padding: 2px 9px; border-radius: 3px; font-size: 9px;
      font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em;
      white-space: nowrap; }
    h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.25; }
    .subject { font-size: 11px; color: #6b7280; margin-top: 4px; }

    /* ── Summary table ── */
    .facts { width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
    .facts tr + tr { border-top: 1px solid #e5e7eb; }
    .facts th, .facts td { padding: 8px 12px; text-align: left; vertical-align: top; font-size: 11px; }
    .facts th { width: 122px; background: #f9fafb; border-right: 1px solid #e5e7eb;
      font-size: 9px; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; font-weight: 700; }

    /* ── Sections ── */
    h2 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #374151;
      font-weight: 800; border-bottom: 1px solid #d1d5db; padding-bottom: 5px; margin: 26px 0 11px; }
    h2 .count { color: #9ca3af; font-weight: 700; }
    .notes { border-left: 3px solid #fbbf24; background: #fffbeb; padding: 11px 14px;
      font-size: 11.5px; color: #78350f; white-space: pre-wrap; }
    .empty { color: #9ca3af; font-style: italic; font-size: 11px; }

    /* ── Incidents table ── */
    table.data { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    table.data th { text-align: left; padding: 7px 9px; background: #f3f4f6;
      border-bottom: 1.5px solid #d1d5db; font-size: 9px; text-transform: uppercase;
      letter-spacing: 0.06em; color: #4b5563; font-weight: 800; }
    table.data td { padding: 7px 9px; border-bottom: 1px solid #f3f4f6; vertical-align: top;
      overflow-wrap: anywhere; }
    table.data tr:last-child td { border-bottom: 1px solid #e5e7eb; }
    .num { color: #9ca3af; width: 22px; }
    .mono { font-family: ui-monospace, Menlo, monospace; font-size: 10px; }
    .nowrap { white-space: nowrap; }
    .tally { margin-top: 7px; font-size: 10px; color: #6b7280; }

    /* ── Activity timeline ── */
    ol.timeline { list-style: none; padding-left: 4px; }
    li.event { position: relative; padding: 0 0 13px 19px; border-left: 1.5px solid #d1d5db; }
    li.event:last-child { border-left-color: transparent; padding-bottom: 0; }
    li.event::before { content: ""; position: absolute; left: -5.5px; top: 3px;
      width: 9px; height: 9px; border-radius: 50%; background: #fff;
      border: 2px solid var(--dot); }
    .event-meta { font-size: 9.5px; color: #9ca3af; font-family: ui-monospace, Menlo, monospace; }
    .event-title { font-size: 11.5px; font-weight: 700; margin-top: 1px; }
    .event-desc { font-size: 10.5px; color: #4b5563; margin-top: 2px; }

    /* ── Footer ── */
    .signoff { margin-top: 26px; display: flex; gap: 40px; }
    .sign { flex: 1; }
    .sign .line { border-bottom: 1px solid #9ca3af; height: 30px; }
    .sign .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em;
      color: #6b7280; font-weight: 700; margin-top: 5px; }
    footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #e5e7eb;
      display: flex; justify-content: space-between; font-size: 9.5px; color: #9ca3af; }

    /* Keep a section and its heading together across a page break. */
    h2, li.event, .signoff { break-inside: avoid; }
    h2 { break-after: avoid; }
    tr { break-inside: avoid; }
    @media print { body { padding: 0; } @page { margin: 1.6cm; } }
  ${styleClose}
</head>
<body>
  <div class="masthead">
    <div class="brand">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M20.5 11 L28.5 31.5 L12.5 31.5 Z" fill="currentColor" />
        <path d="M16 33 C 24.5 28.4 30.5 23.8 40 14.6 C 35.6 24 29 29.2 21 34.8 Z" fill="currentColor" />
        <path d="M30.6 31.2 L37.6 27 L36 34 L29 35.6 Z" fill="currentColor" />
      </svg>
      <div>
        <div class="brand-name">Accel</div>
        <div class="brand-sub">Threat Response</div>
      </div>
    </div>
    <div class="doc-type">
      <div class="kind">Incident Case Report</div>
      <div class="ref">${esc(c.id)}</div>
      <div class="when">Exported ${esc(exportedAt)}</div>
    </div>
  </div>

  <div class="title-block">
    <div class="pills">
      <span class="pill" style="color:${sev.fg};background:${sev.bg}">${esc(c.severity)}</span>
      <span class="pill" style="color:${status.fg};background:${status.bg}">${esc(statusLabel)}</span>
    </div>
    <h1>${esc(c.title)}</h1>
    <div class="subject">${esc(c.siteDisplay)} · ${c.incidentIds.length} linked incident${c.incidentIds.length === 1 ? "" : "s"}</div>
  </div>

  <table class="facts">
    <tr>
      <th>Case ID</th><td class="mono">${esc(c.id)}</td>
      <th>Site</th><td>${esc(c.siteDisplay)}</td>
    </tr>
    <tr>
      <th>Severity</th><td style="color:${sev.fg};font-weight:700;text-transform:capitalize">${esc(c.severity)}</td>
      <th>Status</th><td style="color:${status.fg};font-weight:700">${esc(statusLabel)}</td>
    </tr>
    <tr>
      <th>Assigned To</th><td>${esc(c.assignedTo.name)} <span class="mono" style="color:#9ca3af">${esc(c.assignedTo.id)}</span></td>
      <th>Linked Incidents</th><td>${events.length}</td>
    </tr>
    <tr>
      <th>Opened</th><td>${esc(c.createdAtDisplay)}</td>
      <th>Last Updated</th><td>${esc(c.updatedAtDisplay)}</td>
    </tr>
  </table>

  <h2>Case Notes</h2>
  ${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : `<p class="empty">No notes recorded on this case.</p>`}

  <h2>Linked Incidents <span class="count">(${events.length})</span></h2>
  ${
    events.length > 0
      ? `<table class="data">
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Event ID</th>
        <th>Detection</th>
        <th>Area</th>
        <th>Camera</th>
        <th>Date / Time</th>
        <th>Severity</th>
      </tr>
    </thead>
    <tbody>${evRows}</tbody>
  </table>
  ${sevSummary ? `<p class="tally">Severity mix — ${esc(sevSummary)}.</p>` : ""}`
      : `<p class="empty">No incidents are linked to this case.</p>`
  }

  <h2>Case Activity <span class="count">(${c.activity.length})</span></h2>
  ${
    c.activity.length > 0
      ? `<ol class="timeline">${activityRows}</ol>`
      : `<p class="empty">No activity recorded on this case.</p>`
  }

  <div class="signoff">
    <div class="sign"><div class="line"></div><div class="label">Reviewed by</div></div>
    <div class="sign"><div class="line"></div><div class="label">Date</div></div>
  </div>

  <footer>
    <span>Accel TRMS · ${esc(c.id)} · ${esc(c.siteDisplay)}</span>
    <span>Confidential — internal distribution only</span>
  </footer>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`);
  w.document.close();
  toast.success("Incident report ready", {
    description: `${c.id} opened in your browser's print dialog.`,
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
  /** Prototype hook — forces the drawer's data-state (loading / error). */
  forcedState?: "normal" | "loading" | "empty" | "error";
  onRetry?: () => void;
}

/* Prototype-only loading skeleton for the drawer body. */
function CaseDrawerSkeleton() {
  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function CaseDrawer({ caseId, onClose, forcedState = "normal", onRetry }: CaseDrawerProps) {
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
            {forcedState === "loading" || forcedState === "error" ? (
              <div className="flex items-center justify-between">
                <SheetTitle className="text-md text-muted-foreground">
                  {forcedState === "loading" ? "Loading case…" : "Couldn't load case"}
                </SheetTitle>
                <button
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : caseData ? (
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
          {forcedState === "loading" ? (
            <CaseDrawerSkeleton />
          ) : forcedState === "error" ? (
            <div className="flex flex-1 items-center justify-center p-5">
              <ListErrorState onRetry={onRetry} title="Couldn't load this case" />
            </div>
          ) : caseData ? (
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
                    <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v)}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue placeholder="All areas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All areas</SelectItem>
                        {linkedAreas.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={cameraFilter} onValueChange={(v) => setCameraFilter(v)}>
                      <SelectTrigger className="h-7 w-full text-xs">
                        <SelectValue placeholder="All cameras" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All cameras</SelectItem>
                        {linkedCameras.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          {caseData && forcedState !== "loading" && forcedState !== "error" && (
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
