/**
 * Frozen copy of src/pages/settings/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/settings/index.tsx.
 */
import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";

/** Typed-confirmation gate — the owner's delete is irreversible and unrecoverable. */
const DELETE_PHRASE = "DELETE";

/* Mounted only while open (see the call site), so the typed confirmation starts
   empty on every open without needing a reset effect. */
export function DeleteAccountModal({
  onClose,
  orgName,
}: {
  onClose: () => void;
  orgName: string;
}) {
  const [typed, setTyped] = React.useState("");

  const canDelete = typed.trim() === DELETE_PHRASE;

  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Delete account"
          description={<>This permanently deletes <strong className="text-foreground">{orgName}</strong> and everything in it. It cannot be undone.</>}
          icon={Trash2}
        />
        <ModalBody className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-sev-critical" />
            <ul className="space-y-1 text-sm text-foreground">
              <li>All sites, cameras and NVR links are removed.</li>
              <li>Deployed models stop and their detection history is deleted.</li>
              <li>Every member loses access immediately.</li>
              <li>Active subscriptions are cancelled without refund.</li>
            </ul>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Type <span className="font-mono text-foreground">{DELETE_PHRASE}</span> to confirm
            </label>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={DELETE_PHRASE}
              autoComplete="off"
              className="h-9 font-mono text-base"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={!canDelete}
            onClick={() => {
              onClose();
              toast.success("Account scheduled for deletion", {
                description: "You have 30 days to cancel before data is erased.",
              });
            }}
            className="gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Delete account
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
