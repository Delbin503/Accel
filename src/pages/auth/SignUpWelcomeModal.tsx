import type { ElementType, ReactNode } from "react";
import { PartyPopper, CreditCard, Building2, Users, Video, Check } from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@accel/ui/components/shared/Modal";
import type { PaymentReceipt } from "@/components/app/PaymentSuccessModal";

/** What the sign-up wizard hands the dashboard (as router state) once checkout is confirmed. */
export interface SignUpWelcome {
  firstName: string;
  siteName: string;
  /** People invited on the Invite Team step (the owner not counted). */
  invited: number;
  /** Present when a paid plan was checked out; absent when the plan step was skipped. */
  receipt?: PaymentReceipt;
}

/**
 * First-run welcome, shown on the dashboard right after the On-Cloud sign-up
 * wizard's Review & Checkout step. Recaps what the wizard set up — plan and
 * payment, site, team — and points at the next thing to do.
 */
export function SignUpWelcomeModal({
  welcome,
  open,
  onClose,
  onDownloadInvoice,
}: {
  welcome: SignUpWelcome;
  open: boolean;
  onClose: () => void;
  onDownloadInvoice?: (receipt: PaymentReceipt) => void;
}) {
  const { firstName, siteName, invited, receipt } = welcome;
  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <ModalContent size="sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <ModalHeader
          title={`Welcome to Accel${firstName ? `, ${firstName}` : ""}!`}
          description="Your workspace is ready. Here's what you set up."
          icon={PartyPopper}
        />

        <ModalBody className="flex flex-col gap-2">
          <SetupRow
            icon={CreditCard}
            title={receipt ? `${receipt.planName} plan active` : "Free trial active"}
            detail={
              receipt ? (
                <>
                  {receipt.amount} paid{receipt.card ? ` · ${receipt.card}` : ""} ·{" "}
                  <span className="font-mono">{receipt.reference}</span>
                </>
              ) : (
                "Choose a plan any time from Billing."
              )
            }
          />
          <SetupRow icon={Building2} title="Site created" detail={siteName || "Your first site"} />
          <SetupRow
            icon={Users}
            title={invited > 0 ? "Team invited" : "Just you for now"}
            detail={
              invited > 0
                ? `${invited} invitation${invited === 1 ? "" : "s"} sent — they'll appear as Pending until accepted.`
                : "Invite people any time from User Management."
            }
          />
          <div data-slot="sign-up-welcome-next" className="mt-1 flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5">
            <Video className="mt-0.5 size-4 shrink-0 text-primary-ink" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Next up:</span> add your first camera to start live monitoring.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className={receipt ? "grid grid-cols-2 gap-2" : undefined}>
          {receipt && (
            <Button variant="outline" onClick={() => onDownloadInvoice?.(receipt)} className="h-10 text-sm">
              Download invoice
            </Button>
          )}
          <Button onClick={onClose} className="h-10 w-full text-sm">
            Get started
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function SetupRow({ icon: Icon, title, detail }: { icon: ElementType; title: string; detail: ReactNode }) {
  return (
    <div data-slot="sign-up-welcome-row" className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {title}
          <Check className="size-3.5 text-success" strokeWidth={3} />
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
