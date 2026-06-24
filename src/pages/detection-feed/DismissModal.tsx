import * as React from "react";
import { Info, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Dismiss as False Positive</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {event ? `From event ${event.id}` : isBulk ? `From ${bulkCount} selected events` : "From selected events"}
          </p>
        </DialogHeader>

        <div className="space-y-4 p-5">
          {/* Bulk banner */}
          {isBulk && (
            <div className="flex items-start gap-2.5 rounded-lg border border-sev-medium/25 bg-sev-medium-soft p-3">
              <Layers className="mt-0.5 size-4 flex-shrink-0 text-sev-medium" />
              <div>
                <p className="text-sm font-semibold text-sev-medium">
                  Dismissing {bulkCount} selected events
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The same reason and notes will be applied to all selected events.
                </p>
              </div>
            </div>
          )}

          {/* Feedback info banner */}
          <div className="flex gap-2.5 rounded-lg border border-purple/20 bg-purple-soft p-3">
            <Info className="mt-0.5 size-4 flex-shrink-0 text-purple" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your feedback retrains the detection model. The more specific you are, the faster{" "}
              <strong className="text-purple">
                {event ? event.model.replace(/\.\d+$/, ".3") : "accel-vms v4.3"}
              </strong>{" "}
              improves.
            </p>
          </div>

          {/* FP reason grid */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why is this a false positive?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FP_REASONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={cn(
                    "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors",
                    selectedReason === r.id
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-border bg-muted hover:border-primary"
                  )}
                >
                  {/* Radio-style circle */}
                  <span
                    className={cn(
                      "mt-0.5 flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                      selectedReason === r.id
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {selectedReason === r.id && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <div>
                    <div className="font-semibold leading-tight">{r.label}</div>
                    <div className="mt-0.5 text-2xs text-muted-foreground/70">
                      {r.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
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
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="bg-sev-critical-soft text-sev-critical border border-sev-critical hover:bg-sev-critical hover:text-white"
            onClick={onConfirm}
          >
            Dismiss Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
