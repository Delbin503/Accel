import * as React from "react";
import { Layers, Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { CaseAssignee } from "@/types/incidents";
import { ASSIGNEES } from "@/mocks/incidentCases";
import { TruncatedText } from "@/components/shared/TruncatedText";

export interface EscalateFormData {
  title: string;
  severity: Severity;
  assignee: CaseAssignee;
  notes: string;
}

/* Searchable assignee combobox — typeahead with name + id matching. */
function AssigneeSearchSelect({ value, onChange }: { value: CaseAssignee; onChange: (next: CaseAssignee) => void }) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ASSIGNEES;
    return ASSIGNEES.filter((a) =>
      `${a.name} ${a.id}`.toLowerCase().includes(q)
    );
  }, [query]);

  const displayLabel = `${value.name} (${value.id})`;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={open ? query : displayLabel}
          placeholder="Search assignees by name or ID…"
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
          className="h-9 pl-9 text-base"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm italic text-muted-foreground">No assignees match "{query}".</p>
          ) : (
            filtered.map((a) => {
              const selected = a.id === value.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => { onChange(a); setOpen(false); setQuery(""); }}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-base hover:bg-muted/50",
                    selected && "bg-primary/10"
                  )}
                >
                  <Check className={cn("size-3 flex-shrink-0", selected ? "text-primary" : "opacity-0")} strokeWidth={3} />
                  <TruncatedText text={a.name} className="text-foreground" />
                  <span className="ml-auto font-mono text-2xs text-muted-foreground">{a.id}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const SLA_BY_SEVERITY: Record<
  Severity,
  { acknowledge: string; action: string; resolution: string }
> = {
  critical: { acknowledge: "15 min", action: "1 hour", resolution: "4 hours" },
  medium: { acknowledge: "1 hour", action: "4 hours", resolution: "24 hours" },
  low: { acknowledge: "4 hours", action: "12 hours", resolution: "72 hours" },
};

const SEV_OPTION_STYLES: Record<Severity, string> = {
  critical: "bg-sev-critical-soft text-sev-critical border-sev-critical",
  medium: "bg-sev-medium-soft text-sev-medium border-sev-medium",
  low: "bg-sev-low-soft text-sev-low border-sev-low",
};

interface EscalateModalProps {
  event: DetectionEvent | null;
  bulkCount?: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (data: EscalateFormData) => void;
}

export function EscalateModal({
  event,
  bulkCount,
  open,
  onClose,
  onConfirm,
}: EscalateModalProps) {
  const isBulk = (bulkCount ?? 0) > 1;
  const [pickedSev, setPickedSev] = React.useState<Severity>("medium");
  const [assignee, setAssignee] = React.useState<CaseAssignee>(ASSIGNEES[0]);
  const [notes, setNotes] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [titleErr, setTitleErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (event) {
        setPickedSev(event.severity);
        setTitle(`${event.typeLabel} — ${event.siteDisplay} ${event.camera}`);
      } else if (isBulk) {
        setPickedSev("medium");
        setTitle(`Bulk escalation — ${bulkCount} selected events`);
      }
      setNotes("");
      setAssignee(ASSIGNEES[0]);
      setTitleErr(null);
    }
  }, [open, event, isBulk, bulkCount]);

  const sla = SLA_BY_SEVERITY[pickedSev];

  function handleConfirm() {
    if (!title.trim()) {
      setTitleErr("Provide a case title.");
      return;
    }
    onConfirm({ title: title.trim(), severity: pickedSev, assignee, notes });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Escalate to Incident Case</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {event
              ? `From event ${event.id}`
              : isBulk
              ? `From ${bulkCount} selected events`
              : "From selected events"}
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Bulk banner */}
          {isBulk && (
            <div className="flex items-start gap-2.5 rounded-lg border border-primary/25 bg-primary-muted p-3">
              <Layers className="mt-0.5 size-4 flex-shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-primary">
                  Escalating {bulkCount} selected events
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  All events will be linked to this new incident case.
                </p>
              </div>
            </div>
          )}

          {/* Case title */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Case Title
            </label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleErr) setTitleErr(null); }}
              aria-invalid={!!titleErr}
              className="text-base"
              placeholder="Describe the incident..."
            />
            {titleErr && <p className="mt-1 text-xs text-sev-critical">{titleErr}</p>}
          </div>

          {/* Severity + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Severity
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "critical"] as Severity[]).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setPickedSev(sev)}
                    className={cn(
                      "flex-1 rounded border px-2 py-2 text-2xs font-bold uppercase tracking-wider text-muted-foreground transition-colors",
                      pickedSev === sev
                        ? SEV_OPTION_STYLES[sev]
                        : "border-border bg-muted hover:border-primary"
                    )}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assign To
              </label>
              <AssigneeSearchSelect value={assignee} onChange={setAssignee} />
            </div>
          </div>

          {/* SLA */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SLA Target (auto-set by severity)
            </label>
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-card p-3">
              {(
                [
                  ["Acknowledge", sla.acknowledge],
                  ["Initial Action", sla.action],
                  ["Resolution", sla.resolution],
                ] as [string, string][]
              ).map(([l, v]) => (
                <div key={l}>
                  <div className="mb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {l}
                  </div>
                  <div className="font-mono text-sm font-bold text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Initial Notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context for the investigator..."
              className="min-h-[70px] w-full resize-y text-base"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleConfirm}>
            Create Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
