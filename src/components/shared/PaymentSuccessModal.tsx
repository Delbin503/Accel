import type { ReactNode } from "react";
import { Check, CreditCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";

export interface PaymentReceipt {
  /** Formatted amount charged, e.g. "S$2,083". */
  amount: string;
  planName: string;
  cycle: "monthly" | "annual";
  /** Card the payment went through, e.g. "Visa ···· 4242". */
  card?: string;
  /** Receipt / invoice number shown for reference. */
  reference: string;
  /** Formatted payment date. */
  date: string;
  /** Formatted next renewal date, e.g. "12 Nov 2027". */
  renews?: string;
  /** Where the receipt email went. */
  email?: string;
}

/**
 * "Payment successful" confirmation, shown after checkout charges the card
 * (On-Cloud sign-up). Recaps what was paid, offers the invoice, then continues
 * the flow. Like SetupCompleteModal it can't be dismissed by clicking outside,
 * so the next step always runs through the Continue button.
 */
export function PaymentSuccessModal({
  receipt,
  onContinue,
  onDownloadInvoice,
  continueLabel = "Continue",
}: {
  receipt: PaymentReceipt | null;
  onContinue: () => void;
  onDownloadInvoice?: (receipt: PaymentReceipt) => void;
  continueLabel?: string;
}) {
  return (
    <Modal open={receipt !== null}>
      <ModalContent
        size="sm"
        showCloseButton={false}
        className="max-h-[90vh]"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <ModalHeader
          title="Payment successful"
          description={receipt ? `${receipt.amount} paid for the ${receipt.planName} plan.` : undefined}
          className="sr-only"
        />

        {receipt && (
          <ModalBody className="flex flex-col gap-5 px-6 pb-2 pt-7">
            {/* Hero: tick, headline, amount */}
            <div className="flex flex-col items-center text-center">
              <div className="relative flex size-16 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-success/10" />
                <span className="absolute inset-2 rounded-full bg-success/15" />
                <span className="relative flex size-9 items-center justify-center rounded-full bg-success text-background">
                  <Check className="size-5" strokeWidth={3} />
                </span>
              </div>
              <p className="mt-4 text-lg font-bold text-foreground">Payment successful</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Your {receipt.planName} subscription is now active.</p>
              <p className="mt-4 font-mono text-4xl font-bold tracking-tight text-foreground">{receipt.amount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Paid on {receipt.date}
                {receipt.renews && <> · Renews {receipt.renews}</>}
              </p>
            </div>

            {/* Receipt — a ticket with a dashed tear line */}
            <div className="rounded-xl border border-border bg-muted/30">
              <dl className="space-y-2.5 px-4 py-3.5 text-sm">
                <Row label="Plan" value={receipt.planName} />
                <Row label="Billing" value={receipt.cycle === "annual" ? "Annual" : "Monthly"} />
                {receipt.card && (
                  <Row
                    label="Paid with"
                    value={
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="size-4 text-muted-foreground" />
                        {receipt.card}
                      </span>
                    }
                  />
                )}
              </dl>
              <dl className="border-t border-dashed border-border px-4 py-3 text-sm">
                <Row label="Invoice" value={<span className="font-mono">{receipt.reference}</span>} />
              </dl>
            </div>

            {receipt.email && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                Receipt sent to <span className="font-medium text-foreground">{receipt.email}</span>
              </p>
            )}
          </ModalBody>
        )}

        {/* The plain modal chrome hides icons in footer buttons, so these are text only. */}
        <ModalFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          <Button variant="outline" onClick={() => receipt && onDownloadInvoice?.(receipt)} className="h-10 text-sm">
            Download invoice
          </Button>
          <Button onClick={onContinue} className="h-10 text-sm">
            {continueLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
