import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import type { DetectionEvent } from "@/types/detection";

/**
 * Gallery-only copy of Dismiss as False Positive in the new confirm style:
 * one "Are you sure…" sentence (it absorbs the retraining and bulk banners),
 * the reason as a dropdown (no radio circles; the pick is highlighted) instead
 * of a 2×3 card grid, the
 * notes field, and a single red action. The page still renders its own.
 */

const FP_REASONS = [
  { id: "wrong-class", label: "Wrong object class", description: "Model misclassified what it saw" },
  { id: "wrong-person", label: "Wrong person", description: "Re-ID matched incorrectly" },
  { id: "known-exemption", label: "Known exemption", description: "Authorized activity not in rules yet" },
  { id: "staged", label: "Staged event", description: "Drill, test, maintenance" },
  { id: "threshold", label: "Threshold tuning needed", description: "Trigger should be less sensitive" },
  { id: "other", label: "Other", description: "Specify in notes" },
];

const NOTE = "text-sm leading-relaxed text-muted-foreground";
const HI = "font-semibold text-foreground";
const FIELD_LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function DismissCopy({ event, bulkCount, onClose }: {
  event: DetectionEvent | null;
  bulkCount?: number;
  onClose: () => void;
}) {
  const isBulk = (bulkCount ?? 0) > 1;
  const [reason, setReason] = React.useState("wrong-class");
  const [notes, setNotes] = React.useState("");
  const picked = FP_REASONS.find((r) => r.id === reason) ?? FP_REASONS[0];
  const model = event ? event.model.replace(/\.\d+$/, ".3") : "accel-vms v4.3";

  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm" className="w-[550px]">
        <ModalHeader title="Dismiss as False Positive" description={null} />
        <ModalBody className="space-y-4">
          <p className={NOTE}>
            {isBulk ? (
              <>
                Are you sure you want to dismiss <span className={HI}>{bulkCount} selected events</span>? One reason
                applies to all, and it retrains <span className={HI}>{model}</span>.
              </>
            ) : (
              <>
                Are you sure you want to dismiss <span className={HI}>{event?.id ?? "this event"}</span>? Your reason
                retrains <span className={HI}>{model}</span>.
              </>
            )}
          </p>

          <div>
            <label className={FIELD_LABEL}>Why is this a false positive?</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-base text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:border-ring dark:bg-input/30"
                >
                  <span className="truncate">{picked.label}</span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                <DropdownMenuRadioGroup value={reason} onValueChange={setReason}>
                  {FP_REASONS.map((r) => (
                    <DropdownMenuRadioItem
                      key={r.id}
                      value={r.id}
                      // No radio circle: hide the menu's built-in dot and drop its left gutter;
                      // the chosen reason is marked by a highlight and an orange label instead.
                      className="group/reason py-2 pl-2 data-[state=checked]:bg-accent [&>span:first-child]:hidden"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm text-foreground group-data-[state=checked]/reason:text-primary">
                          {r.label}
                        </span>
                        <span className="block text-2xs text-muted-foreground">{r.description}</span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <label className={FIELD_LABEL}>Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details — helps the model team understand the context..."
              className="min-h-[60px] w-full resize-y"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="destructive" size="sm" onClick={onClose}>
            {isBulk ? `Dismiss ${bulkCount} Events` : "Dismiss Event"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
