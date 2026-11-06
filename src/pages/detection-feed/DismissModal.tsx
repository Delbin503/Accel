import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChoiceDropdown } from "@/components/shared/ChoiceDropdown";
import type { DetectionEvent } from "@/types/detection";

const FP_REASONS = [
  {
    id: "wrong-class",
    label: "Wrong object class",
    description: "Model misclassified what it saw",
  },
  {
    id: "wrong-person",
    label: "Wrong person",
    description: "Re-ID matched incorrectly",
  },
  {
    id: "known-exemption",
    label: "Known exemption",
    description: "Authorized activity not in rules yet",
  },
  {
    id: "staged",
    label: "Staged event",
    description: "Drill, test, maintenance",
  },
  {
    id: "threshold",
    label: "Threshold tuning needed",
    description: "Trigger should be less sensitive",
  },
  {
    id: "other",
    label: "Other",
    description: "Specify in notes",
  },
];

interface DismissModalProps {
  event: DetectionEvent | null;
  bulkCount?: number;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DismissModal({ event, bulkCount, open, onClose, onConfirm }: DismissModalProps) {
  const isBulk = (bulkCount ?? 0) > 1;
  const [selectedReason, setSelectedReason] = React.useState("wrong-class");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSelectedReason("wrong-class");
      setNotes("");
    }
  }, [open]);

  const model = event ? event.model.replace(/\.\d+$/, ".3") : "accel-vms v4.3";

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Dismiss as False Positive" />
        <ModalBody className="space-y-4">
          {/* One sentence replaces the bulk banner and the "feedback retrains" banner. */}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isBulk ? (
              <>
                Are you sure you want to dismiss <strong className="text-foreground">{bulkCount} selected events</strong>?
                One reason applies to all, and it retrains <strong className="text-foreground">{model}</strong>.
              </>
            ) : (
              <>
                Are you sure you want to dismiss <strong className="text-foreground">{event?.id ?? "this event"}</strong>?
                Your reason retrains <strong className="text-foreground">{model}</strong>.
              </>
            )}
          </p>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why is this a false positive?
            </label>
            <ChoiceDropdown
              value={selectedReason}
              onChange={setSelectedReason}
              ariaLabel="Why is this a false positive?"
              options={FP_REASONS.map((r) => ({ value: r.id, label: r.label, description: r.description }))}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details — helps the model team understand the context..."
              className="min-h-[60px] w-full resize-y"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button size="sm" variant="destructive" onClick={onConfirm}>
            {isBulk ? `Dismiss ${bulkCount} Events` : "Dismiss Event"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
