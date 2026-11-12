import type { ReactNode } from "react";
import { ArrowRight, Check, CreditCard } from "lucide-react";
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
}

/**
 * "Payment successful" confirmation, shown after checkout charges the card
 * (On-Cloud sign-up). Recaps what was paid, then continues the flow. Like
 * SetupCompleteModal it can't be dismissed by clicking outside, so the next
 * step always runs through the Continue button.
 */
export function PaymentSuccessModal({
  receipt,
  onContinue,
  continueLabel = "Continue",
}: {
  receipt: PaymentReceipt | null;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <Modal open={receipt !== null}>
      <ModalContent
        size="sm"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <ModalHeader
          title="Payment successful"
          description={receipt ? `${receipt.amount} paid for the ${receipt.planName} plan. A receipt has been emailed to you.` : undefined}
          icon={Check}
          tone="success"
        />

        {receipt && (
          <ModalBody className="flex flex-col items-center gap-5 py-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 flex size-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-success/40" />
                <div className="absolute inset-1.5 rounded-full border border-success/25" />
                <div className="relative flex size-12 items-center justify-center rounded-full border border-success/40 bg-success/10">
                  <Check className="size-6 text-success" strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Amount paid</p>
              <p className="font-mono text-3xl font-bold text-foreground">{receipt.amount}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-success">
                Subscription active
              </span>
            </div>

            <dl className="w-full divide-y divide-border rounded-lg border border-border bg-background/40 text-sm">
              <Row label="Plan" value={`${receipt.planName} · ${receipt.cycle === "annual" ? "Annual" : "Monthly"}`} />
              {receipt.card && (
                <Row
                  label="Paid with"
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <CreditCard className="size-3.5 text-muted-foreground" />
                      {receipt.card}
                    </span>
                  }
                />
              )}
              <Row label="Date" value={receipt.date} />
              <Row label="Reference" value={<span className="font-mono">{receipt.reference}</span>} />
            </dl>
          </ModalBody>
        )}

        <ModalFooter>
          <Button onClick={onContinue} className="h-10 w-full gap-1.5 text-sm">
            {continueLabel} <ArrowRight className="size-3.5" />
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
