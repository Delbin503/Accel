import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import type { DismissedEvent } from "@/types/detection";

/** Bulk-restore confirmation: lists the selected dismissed events before they go back to the feed. */
export function RestoreDismissedModal({
  open,
  items,
  onClose,
  onConfirm,
}: {
  open: boolean;
  /** The dismissed events being restored. */
  items: DismissedEvent[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const count = items.length;
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Restore dismissed events?" />
        <ModalBody>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to restore{" "}
            <strong className="text-foreground">{count === 1 ? "this event" : `these ${count} events`}</strong> to the Detection Feed?
          </p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onConfirm}>Restore {count}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
