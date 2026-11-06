import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { CaseAssignee } from "@/types/incidents";
import { ASSIGNEES } from "@/mocks/incidentCases";
import { ChoiceDropdown } from "@/components/shared/ChoiceDropdown";

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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Escalate to Incident Case" />
        <ModalBody className="space-y-4">
          {/* One sentence replaces the description and the bulk banner. */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isBulk ? (
              <>
                Create one case from <strong className="text-foreground">{bulkCount} selected events</strong>;
                they&apos;ll all be linked to it.
              </>
            ) : (
              <>Create an incident case from <strong className="text-foreground">{event?.id}</strong>.</>
            )}
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Case Title
            </label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (titleErr) setTitleErr(null); }}
              aria-invalid={!!titleErr}
              className="h-9 text-base"
              placeholder="Describe the incident..."
            />
            {titleErr && <p className="mt-1 text-xs text-sev-critical">{titleErr}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Severity
              </label>
              <div className="flex gap-1.5">
                {(["low", "medium", "critical"] as Severity[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setPickedSev(sev)}
                    className={cn(
                      "h-9 flex-1 rounded-md border text-2xs font-bold uppercase tracking-wider transition-colors",
                      pickedSev === sev ? SEV_OPTION_STYLES[sev] : "border-input text-muted-foreground hover:border-ring"
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
              <ChoiceDropdown
                value={assignee.id}
                onChange={(id) => setAssignee(ASSIGNEES.find((a) => a.id === id) ?? assignee)}
                ariaLabel="Assign to"
                options={ASSIGNEES.map((a) => ({ value: a.id, label: a.name, hint: a.id }))}
              />
            </div>
          </div>

          {/* The SLA box becomes one line under the severity it follows. */}
          <p className="text-xs text-muted-foreground">
            SLA: acknowledge in <strong className="text-foreground">{sla.acknowledge}</strong> · act within{" "}
            <strong className="text-foreground">{sla.action}</strong> · resolve within{" "}
            <strong className="text-foreground">{sla.resolution}</strong>
          </p>

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
        </ModalBody>

        <ModalFooter>
          <Button size="sm" onClick={handleConfirm}>Create Case</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
