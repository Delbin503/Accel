/**
 * Frozen copy of src/pages/incident-cases/CaseDrawer.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/incident-cases/CaseDrawer.tsx.
 */
import * as React from "react";
import { MapPin, Search, Check, Trash2 } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalSubheader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/pages/incident-cases/shared";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { ASSIGNEES } from "@/mocks/incidentCases";
import type { CaseStatus, CaseAssignee } from "@/types/incidents";
import type { Severity } from "@/types/detection";

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
