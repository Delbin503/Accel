import * as React from "react";
import { ArrowRight, Check, Crown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";

/* Where the "Accept ownership" button in the Ownership Transfer Request email
   lands. The transfer is only a request until the chosen member confirms it
   here, so the workspace never ends up with an Owner who didn't agree to be one.

   Two steps in one modal: review and accept, or step sideways to decline with an
   optional note for the current Owner. */

export interface OwnershipRequest {
  orgName: string;
  /** The current Owner, who sent the request. */
  fromName: string;
  /** The recipient's role today, as shown on their badge. */
  currentRole: string;
  /** Already formatted for display. */
  expiresAt: string;
}

const OWNER_TAKES_OVER = [
  "Billing, subscription and seats",
  "Every user, role and site in the workspace",
  "Irreversible controls: transferring ownership and deleting the workspace",
];

export function AcceptOwnershipModal({
  open,
  onOpenChange,
  request,
  onAccept,
  onDecline,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: OwnershipRequest;
  onAccept: () => void;
  /** `reason` is empty when the member declined without a note. */
  onDecline: (reason: string) => void;
}) {
  const [step, setStep] = React.useState<"review" | "decline">("review");
  const [understood, setUnderstood] = React.useState(false);
  const [reason, setReason] = React.useState("");

  // Reopening always starts from the review step with nothing ticked.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setStep("review");
      setUnderstood(false);
      setReason("");
    }
  }

  const declining = step === "decline";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="lg">
        <ModalHeader
          title={declining ? "Decline Ownership" : "Accept Ownership"}
          description={
            declining
              ? `${request.fromName} stays the Owner and is told by email.`
              : `${request.fromName} wants to make you the Owner of ${request.orgName}.`
          }
        />

        {declining ? (
          <ModalBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Nothing changes for you: you keep your <strong className="text-foreground">{request.currentRole}</strong>{" "}
              role. {request.fromName} can send a new request later.
            </p>
            <div>
              <label htmlFor="decline-reason" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Note to {request.fromName} (optional)
              </label>
              <Textarea
                id="decline-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I'm moving teams next month, please pick someone else."
                rows={3}
                className="text-base"
              />
            </div>
          </ModalBody>
        ) : (
          <ModalBody className="space-y-4">
            {/* Role change, at a glance — the same from → to card as Transfer Ownership. */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="min-w-0">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Your role today</p>
                <p className="truncate text-sm font-semibold text-foreground">{request.currentRole}</p>
              </div>
              <div className="flex size-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <ArrowRight className="size-3.5" />
              </div>
              <div className="min-w-0 text-right">
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">After you accept</p>
                <p className="truncate text-sm font-semibold text-foreground">Owner</p>
              </div>
            </div>

            {/* What changes — the consequence box used by the app's confirm dialogs. */}
            <div className="rounded-lg border border-primary/25 bg-primary-muted p-3 text-sm">
              <p className="mb-2 font-semibold text-foreground">As Owner you take over</p>
              <ul className="space-y-1.5 text-muted-foreground">
                {OWNER_TAKES_OVER.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-3.5 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-info/30 bg-info/[0.06] px-3 py-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-info" />
              <p className="text-sm leading-snug text-muted-foreground">
                There is only one Owner per workspace, so{" "}
                <strong className="text-foreground">{request.fromName}</strong> becomes an Admin the moment you accept.
                This request expires on <strong className="text-foreground">{request.expiresAt}</strong>.
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="accept-ownership-understood"
                checked={understood}
                onCheckedChange={(v) => setUnderstood(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="accept-ownership-understood" className="text-sm font-normal leading-snug text-foreground">
                I understand I become responsible for billing and account control of {request.orgName}.
              </Label>
            </div>
          </ModalBody>
        )}

        {declining ? (
          <ModalFooter>
            <Button variant="ghost" size="sm" onClick={() => setStep("review")}>Back</Button>
            <Button variant="destructive" size="sm" onClick={() => onDecline(reason.trim())}>
              Decline Transfer
            </Button>
          </ModalFooter>
        ) : (
          <ModalFooter>
            {/* Closing with × is "not now"; the request stays open until it expires. */}
            <Button variant="ghost" size="sm" onClick={() => setStep("decline")}>Decline</Button>
            <Button size="sm" disabled={!understood} onClick={onAccept} className="gap-1.5">
              <Crown className="size-3.5" />
              Accept Ownership
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
}
