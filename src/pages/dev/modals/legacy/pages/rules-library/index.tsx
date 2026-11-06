/**
 * Frozen copy of src/pages/rules-library/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/rules-library/index.tsx.
 */
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";

/* ── Delete modal ────────────────────────────────────────────────────────── */

export function DeleteModal({
  ruleName,
  onConfirm,
  onCancel,
}: {
  ruleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onCancel()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Delete Rule"
          description="This action cannot be undone."
          icon={Trash2}
          tone="destructive"
        />
        <ModalBody className="text-base text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{ruleName}</span>? Any models that
          reference this rule will need to be updated.
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} className="gap-1.5">
            <Trash2 className="size-3.5" />
            Delete Rule
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
