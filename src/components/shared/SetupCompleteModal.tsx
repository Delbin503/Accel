import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";

/**
 * Onboarding "You're all set" modal.
 *
 * Shown after the final Finish & Enter Dashboard click in both the On-Cloud
 * and On-Premise sign-up flows. Confirms the setup completed, then hands the
 * user off to the dashboard when they click Enter Dashboard.
 */
export function SetupCompleteModal({
  open,
  onEnter,
  workspaceName,
}: {
  open: boolean;
  onEnter: () => void;
  workspaceName?: string;
}) {
  return (
    <Modal open={open}>
      <ModalContent
        size="sm"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <ModalHeader
          title="You're all set"
          description={`Your ${workspaceName ? `${workspaceName} workspace` : "Accel workspace"} is configured and ready for the first live monitoring session.`}
          icon={Check}
          tone="success"
        />

        <ModalBody className="flex flex-col items-center py-6 text-center">
          {/* Server icon with success ring */}
          <div data-slot="setup-complete-modal-icon" className="relative mb-5 flex size-20 items-center justify-center">
            <div data-slot="setup-complete-modal-ring-outer" className="absolute inset-0 rounded-full border-2 border-success/40" />
            <div data-slot="setup-complete-modal-ring-inner" className="absolute inset-1.5 rounded-full border border-success/25" />
            <div data-slot="setup-complete-modal-icon-core" className="relative flex size-12 items-center justify-center rounded-xl border border-success/40 bg-success/10">
              <Check className="size-6 text-success" strokeWidth={2.5} />
            </div>
          </div>

          <span data-slot="setup-complete-modal-badge" className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-success">
            System Setup Complete
          </span>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onEnter} className="h-10 w-full gap-1.5 text-sm">
            Enter dashboard <ArrowRight className="size-3.5" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
