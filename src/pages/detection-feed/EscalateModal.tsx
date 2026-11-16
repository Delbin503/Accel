import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import { Button } from "@accel/ui/components/ui/button";
import { Input } from "@accel/ui/components/ui/input";
import { Textarea } from "@accel/ui/components/ui/textarea";
import { cn } from "@accel/ui/lib/utils";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { CaseAssignee } from "@/types/incidents";
import { ASSIGNEES } from "@/mocks/incidentCases";
import { ChoiceDropdown } from "@accel/ui/components/shared/ChoiceDropdown";
import { SegmentedControl, SegmentedControlItem } from "@accel/ui/components/ui/segmented-control";

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
  critical: "data-[state=on]:bg-severity-critical/15 data-[state=on]:text-severity-critical hover:text-severity-critical border-severity-critical",
  medium: "data-[state=on]:bg-severity-medium/15 data-[state=on]:text-severity-medium hover:text-severity-medium border-severity-medium",
  low: "data-[state=on]:bg-severity-low/15 data-[state=on]:text-severity-low hover:text-severity-low border-severity-low",
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
  // Prefill for the event (or bulk selection) — null leaves the field as is.
  const prefill = (): { sev: Severity; title: string } | null =>
    !open
      ? null
      : event
        ? { sev: event.severity, title: `${event.typeLabel} — ${event.siteDisplay} ${event.camera}` }
        : isBulk
          ? { sev: "medium", title: `Bulk escalation — ${bulkCount} selected events` }
          : null;
  const [pickedSev, setPickedSev] = React.useState<Severity>(() => prefill()?.sev ?? "medium");
  const [assignee, setAssignee] = React.useState<CaseAssignee>(ASSIGNEES[0]);
  const [notes, setNotes] = React.useState("");
  const [title, setTitle] = React.useState(() => prefill()?.title ?? "");
  const [titleErr, setTitleErr] = React.useState<string | null>(null);

  // Re-prefill when the modal opens or its target changes (adjusted during
  // render rather than in an effect).
  const [prevSync, setPrevSync] = React.useState({ open, event, isBulk, bulkCount });
  if (
    prevSync.open !== open ||
    prevSync.event !== event ||
    prevSync.isBulk !== isBulk ||
    prevSync.bulkCount !== bulkCount
  ) {
    setPrevSync({ open, event, isBulk, bulkCount });
    if (open) {
      const next = prefill();
      if (next) {
        setPickedSev(next.sev);
        setTitle(next.title);
      }
      setNotes("");
      setAssignee(ASSIGNEES[0]);
      setTitleErr(null);
    }
  }

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
          <p data-slot="escalate-modal-intro" className="text-sm leading-relaxed text-muted-foreground">
            {isBulk ? (
              <>
                Create one case from <strong className="text-foreground">{bulkCount} selected events</strong>;
                they&apos;ll all be linked to it.
              </>
            ) : (
              <>Create an incident case from <strong className="text-foreground">{event?.id}</strong>.</>
            )}
          </p>

          <div data-slot="escalate-modal-title-field">
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
            {titleErr && <p className="mt-1 text-xs text-severity-critical">{titleErr}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Severity
              </label>
              <SegmentedControl
                type="single"
                value={pickedSev}
                onValueChange={(next) => next && setPickedSev(next as Severity)}
                className="flex w-full gap-1.5 rounded-none bg-transparent p-0"
              >
                {(["low", "medium", "critical"] as Severity[]).map((sev) => (
                  <SegmentedControlItem
                    key={sev}
                    value={sev}
                    className={cn(
                      "h-9 flex-1 rounded-md border px-0 text-2xs font-bold uppercase tracking-wider transition-colors data-[state=on]:shadow-none",
                      pickedSev === sev ? SEV_OPTION_STYLES[sev] : "border-input text-muted-foreground hover:border-ring hover:text-muted-foreground"
                    )}
                  >
                    {sev}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
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
