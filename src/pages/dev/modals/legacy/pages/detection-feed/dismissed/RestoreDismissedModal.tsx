import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import type { DismissedEvent } from "@/types/detection";

/**
 * Frozen copy of the bulk-restore confirm as last committed, before the 2026
 * modal redesign — it was inline in src/pages/detection-feed/dismissed/index.tsx.
 * Only the Modal Gallery's "Old" side shows it. The live one is
 * src/pages/detection-feed/dismissed/RestoreDismissedModal.tsx.
 */
export function RestoreDismissedModal({
  open,
  items,
  onClose,
  onConfirm,
}: {
  open: boolean;
  items: DismissedEvent[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Restore dismissed events?"
          description={
            <>
              You&apos;re about to restore <strong className="text-foreground">{items.length}</strong>{" "}
              event{items.length === 1 ? "" : "s"} back to the Detection Feed. They&apos;ll re-enter triage
              and their false-positive feedback will be withdrawn from model retraining.
            </>
          }
        />
        <ModalBody className="max-h-[40vh] space-y-1.5">
          {items.map((d) => (
            <div key={d.event.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{d.event.id}</span>
              <span className="truncate font-semibold text-foreground">{d.event.typeLabel}</span>
              <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
                {d.event.siteDisplay} · {d.event.camera}
              </span>
            </div>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <RotateCcw className="size-3.5" />
            Restore {items.length}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
