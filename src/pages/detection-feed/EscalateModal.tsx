import * as React from "react";
import { Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { CaseAssignee } from "@/types/incidents";
import { ASSIGNEES } from "@/mocks/incidentCases";

export interface EscalateFormData {
  title: string;
  severity: Severity;
  assignee: CaseAssignee;
  notes: string;
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
    }
  }, [open, event, isBulk, bulkCount]);

  const sla = SLA_BY_SEVERITY[pickedSev];

  function handleConfirm() {
    if (!title.trim()) return;
    onConfirm({ title: title.trim(), severity: pickedSev, assignee, notes });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Escalate to Incident Case</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
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
                <p className="text-[12px] font-semibold text-primary">
                  Escalating {bulkCount} selected events
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  All events will be linked to this new incident case.
                </p>
              </div>
            </div>
          )}

          {/* Case title */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Case Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-[13px]"
              placeholder="Describe the incident..."
            />
          </div>

          {/* Severity + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Severity
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "critical"] as Severity[]).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setPickedSev(sev)}
                    className={cn(
                      "flex-1 rounded border px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors",
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
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assign To
              </label>
              <select
                value={assignee.id}
                onChange={(e) => {
                  const found = ASSIGNEES.find((a) => a.id === e.target.value);
                  if (found) setAssignee(found);
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground focus:border-primary focus:outline-none"
              >
                {ASSIGNEES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SLA */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {l}
                  </div>
                  <div className="font-mono text-sm font-bold text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Initial Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context for the investigator..."
              className="min-h-[70px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" disabled={!title.trim()} onClick={handleConfirm}>
            Create Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
