import { PartyPopper, ArrowRight } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { roleLabel, siteLabels, type InviteContext } from "./shared";

export function WelcomeModal({
  open,
  firstName,
  invite,
  onEnter,
}: {
  open: boolean;
  firstName: string;
  invite: InviteContext;
  onEnter: () => void;
}) {
  return (
    <Modal open={open}>
      <ModalContent
        size="sm"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <ModalHeader
          title={`Welcome to Accel${firstName ? `, ${firstName}` : ""}!`}
          description={
            <>
              Your account is all set. You've joined{" "}
              <strong className="text-foreground">{invite.orgName}</strong> with the{" "}
              <strong className="text-foreground">{roleLabel(invite.role)}</strong> role.
            </>
          }
          icon={PartyPopper}
        />

        <ModalBody>
          <div className="rounded-lg border border-border bg-card p-3.5">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
              You now have access to
            </p>
            <p className="text-sm text-foreground">{siteLabels(invite.siteIds)}</p>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onEnter} className="w-full gap-1.5" size="lg">
            Enter dashboard
            <ArrowRight className="size-4" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
