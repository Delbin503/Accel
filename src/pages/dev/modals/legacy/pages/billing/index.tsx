/**
 * Frozen copy of src/pages/billing/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/billing/index.tsx.
 */
import * as React from "react";
import { CreditCard, Plus, Sparkles, Zap, Rocket, Check, AlertTriangle, RefreshCw, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { PLANS, SEAT_PRICING, type Invoice, type PlanTier } from "@/mocks/licenses";

/* ── Saved card type ──────────────────────────────────────────────────────── */

interface SavedCard {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const PLAN_ICONS: Record<PlanTier, React.ElementType> = {
  starter: Sparkles,
  professional: Zap,
  enterprise: Rocket,
};

const PLAN_COLORS: Record<PlanTier, { bg: string; border: string; text: string; chip: string }> = {
  starter:      { bg: "bg-info/10",       border: "border-info/40",       text: "text-info",       chip: "bg-info/15 text-info"           },
  professional: { bg: "bg-purple/10",     border: "border-purple/40",     text: "text-purple",     chip: "bg-purple/15 text-purple"        },
  enterprise:   { bg: "bg-success/10",    border: "border-success/40",    text: "text-success",    chip: "bg-success/15 text-success"      },
};

/* ── Charges for a cycle ───────────────────────────────────────────────────── */

type Seats = { owner: number; admin: number; user: number };

/** Plan base + seat add-ons for one billing cycle. Annual takes the plan's
    annual price; seats have no annual discount, so they bill as 12 months. */
function cycleCharges(tier: PlanTier, seats: Seats, cycle: "monthly" | "annual") {
  const plan = PLANS[tier];
  const userSeats = seats.admin + seats.user;
  const seatsMonthly = seats.admin * SEAT_PRICING.admin.pricePerMonth + seats.user * SEAT_PRICING.user.pricePerMonth;
  const annual = cycle === "annual";
  const lines: { label: string; note: string; amount: number }[] = [
    { label: `${plan.name} plan`, note: `${annual ? "Annual" : "Monthly"} base · incl. owner seat`, amount: annual ? plan.pricePerYear : plan.pricePerMonth },
    ...(userSeats > 0
      ? [{ label: "User seats (Add On)", note: annual ? `${userSeats} seats × 12 months` : `${userSeats} seats`, amount: annual ? seatsMonthly * 12 : seatsMonthly }]
      : []),
  ];
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) };
}

/* ── Add Card modal (reused from payment flow) ────────────────────────────── */

export function AddCardModal({ open, onClose, onSave }: {
  open: boolean; onClose: () => void;
  onSave: (last4: string, expiry: string, brand: "Visa" | "Mastercard" | "Amex") => void;
}) {
  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [errors, setErrors] = React.useState<{ cardName?: string; cardNumber?: string; expiry?: string; cvc?: string }>({});

  React.useEffect(() => {
    if (open) { setCardName(""); setCardNumber(""); setExpiry(""); setCvc(""); setErrors({}); }
  }, [open]);

  const cleaned = cardNumber.replace(/\s/g, "");
  const last4 = cleaned.slice(-4);

  function handleAdd() {
    const next: { cardName?: string; cardNumber?: string; expiry?: string; cvc?: string } = {};
    if (cardName.trim().length === 0) next.cardName = "Name on card is required.";
    if (cleaned.length < 13) next.cardNumber = "Enter a valid card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) next.expiry = "Enter a valid expiry (MM/YY).";
    if (cvc.length < 3) next.cvc = "Enter a valid CVC.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSave(last4, expiry, detectBrand(cleaned));
  }

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }
  function detectBrand(num: string): "Visa" | "Mastercard" | "Amex" {
    if (num.startsWith("4")) return "Visa";
    if (num.startsWith("5")) return "Mastercard";
    return "Amex";
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Add Payment Method"
          description="Card details are encrypted — never stored here."
        />
        <ModalBody className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name on Card</label>
            <Input value={cardName} onChange={(e) => { setCardName(e.target.value); setErrors((p) => ({ ...p, cardName: undefined })); }} placeholder="Delbin Arkar" className="h-9 text-base" aria-invalid={!!errors.cardName} />
            {errors.cardName && <p className="mt-1 text-xs text-sev-critical">{errors.cardName}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card Number</label>
            <Input value={cardNumber} onChange={(e) => { setCardNumber(formatCard(e.target.value)); setErrors((p) => ({ ...p, cardNumber: undefined })); }} placeholder="1234 5678 9012 3456" className="h-9 font-mono text-base" inputMode="numeric" aria-invalid={!!errors.cardNumber} />
            {errors.cardNumber && <p className="mt-1 text-xs text-sev-critical">{errors.cardNumber}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry</label>
              <Input value={expiry} onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setErrors((p) => ({ ...p, expiry: undefined })); }} placeholder="MM/YY" className="h-9 font-mono text-base" inputMode="numeric" aria-invalid={!!errors.expiry} />
              {errors.expiry && <p className="mt-1 text-xs text-sev-critical">{errors.expiry}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVC</label>
              <Input value={cvc} onChange={(e) => { setCvc(e.target.value.replace(/\D/g, "").slice(0, 4)); setErrors((p) => ({ ...p, cvc: undefined })); }} placeholder="123" className="h-9 font-mono text-base" inputMode="numeric" aria-invalid={!!errors.cvc} />
              {errors.cvc && <p className="mt-1 text-xs text-sev-critical">{errors.cvc}</p>}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} className="gap-1.5">
            <CreditCard className="size-3.5" /> Add Card
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Retry payment modal ──────────────────────────────────────────────────── */

export function RetryPaymentModal({ open, invoice, cards, onClose, onAddCard, onConfirm }: {
  open: boolean;
  invoice: Invoice | null;
  cards: SavedCard[];
  onClose: () => void;
  onAddCard: () => void;
  onConfirm: (cardId: string) => void;
}) {
  const [selected, setSelected] = React.useState<string>("");

  React.useEffect(() => {
    if (open) setSelected(cards.find((c) => c.isDefault)?.id ?? cards[0]?.id ?? "");
  }, [open, cards]);

  if (!invoice) return null;
  const total = invoice.amount + Math.round(invoice.amount * 0.07);
  const brandColors: Record<string, string> = { Visa: "text-info", Mastercard: "text-sev-critical", Amex: "text-success" };

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Retry Payment"
          description={<>Choose a card to re-attempt the charge for <strong className="text-foreground">{invoice.id}</strong>.</>}
        />
        <ModalBody className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-sev-critical/40 bg-sev-critical/[0.06] p-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-sev-critical" />
            <p className="text-muted-foreground">
              The previous charge of <strong className="text-foreground">${total.toLocaleString()}</strong> failed.
              Select a card below — or update your card details — and we'll try again.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment card</p>
            {cards.map((card) => (
              <button key={card.id} onClick={() => setSelected(card.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                  selected === card.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}>
                <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                  selected === card.id ? "border-primary" : "border-muted-foreground/40")}>
                  {selected === card.id && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <CreditCard className={cn("size-4 flex-shrink-0", brandColors[card.brand] ?? "text-secondary")} />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground">{card.brand} ···· {card.last4}</p>
                  <p className="text-2xs text-muted-foreground">Expires {card.expiryMonth}/{card.expiryYear}</p>
                </div>
                {card.isDefault && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-primary">Default</span>
                )}
              </button>
            ))}
          </div>

          <button onClick={onAddCard}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <Plus className="size-3.5" /> Use a different card / update details
          </button>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={() => onConfirm(selected)} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry ${total.toLocaleString()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Purchase / confirm plan modal ────────────────────────────────────────── */

export function PurchasePlanModal({ tier, cycle, cards, onClose, onAddCard, onConfirm }: {
  tier: PlanTier | null;
  cycle: "monthly" | "annual";
  cards: SavedCard[];
  onClose: () => void;
  onAddCard: () => void;
  onConfirm: (cardId: string) => void;
}) {
  const [selected, setSelected] = React.useState<string>("");

  React.useEffect(() => {
    if (tier) setSelected(cards.find((c) => c.isDefault)?.id ?? cards[0]?.id ?? "");
  }, [tier, cards]);

  if (!tier) return null;
  const plan = PLANS[tier];
  const color = PLAN_COLORS[tier];
  const Icon = PLAN_ICONS[tier];
  const price = cycle === "annual" ? plan.pricePerYear : plan.pricePerMonth;
  const brandColors: Record<string, string> = { Visa: "text-info", Mastercard: "text-sev-critical", Amex: "text-success" };

  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Confirm subscription"
          description="Review your plan and choose a payment method to activate your account."
        />
        <ModalBody className="space-y-4">
          {/* Plan summary */}
          <div className={cn("flex items-center gap-3 rounded-lg border p-3", color.border, color.bg)}>
            <div className={cn("flex size-10 flex-shrink-0 items-center justify-center rounded-lg border bg-background/40", color.border)}>
              <Icon className={cn("size-5", color.text)} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-md font-bold text-foreground">{plan.name} plan</p>
              <p className="text-2xs text-muted-foreground">{cycle === "annual" ? "Annual" : "Monthly"} billing · incl. owner seat</p>
            </div>
            <div className="text-right">
              <p className={cn("font-mono text-lg font-bold", color.text)}>${price.toLocaleString()}</p>
              <p className="text-2xs text-muted-foreground">/{cycle === "annual" ? "yr" : "mo"}</p>
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment method</p>
            {cards.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">
                No cards on file. Add one to continue.
              </p>
            )}
            {cards.map((card) => (
              <button key={card.id} onClick={() => setSelected(card.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                  selected === card.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}>
                <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                  selected === card.id ? "border-primary" : "border-muted-foreground/40")}>
                  {selected === card.id && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <CreditCard className={cn("size-4 flex-shrink-0", brandColors[card.brand] ?? "text-secondary")} />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground">{card.brand} ···· {card.last4}</p>
                  <p className="text-2xs text-muted-foreground">Expires {card.expiryMonth}/{card.expiryYear}</p>
                </div>
                {card.isDefault && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-primary">Default</span>
                )}
              </button>
            ))}
            <button onClick={onAddCard}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              <Plus className="size-3.5" /> Add a new card
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={() => onConfirm(selected)} className="gap-1.5">
            <Check className="size-3.5" /> Confirm & subscribe
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Switch monthly → annual modal ────────────────────────────────────────── */

/* An in-place change of billing cycle — same plan, seats and sites. The annual
   term starts today; unused time on the monthly period comes off the first
   annual charge, so nothing is paid twice and nothing has to be cancelled. */
export function SwitchToAnnualModal({ tier, seats, credit, daysLeft, renewsOn, cards, onClose, onAddCard, onConfirm }: {
  tier: PlanTier;
  seats: Seats;
  /** Unused monthly time, credited against the annual charge. */
  credit: number;
  daysLeft: number;
  /** When the new annual term renews. */
  renewsOn: string;
  cards: SavedCard[];
  onClose: () => void;
  onAddCard: () => void;
  onConfirm: (cardId: string) => void;
}) {
  // Mounted only while open, so the default card is picked fresh each time.
  const [selected, setSelected] = React.useState<string>(() => cards.find((c) => c.isDefault)?.id ?? cards[0]?.id ?? "");

  const plan = PLANS[tier];
  const color = PLAN_COLORS[tier];
  const Icon = PLAN_ICONS[tier];
  const monthly = cycleCharges(tier, seats, "monthly").total;
  const annual = cycleCharges(tier, seats, "annual");
  const saving = monthly * 12 - annual.total;
  const dueToday = annual.total - credit;
  const brandColors: Record<string, string> = { Visa: "text-info", Mastercard: "text-sev-critical", Amex: "text-success" };

  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Switch to annual billing"
          description={<>Your {plan.name} plan, seats and sites stay exactly as they are. Annual billing starts today — no need to cancel.</>}
        />
        <ModalBody className="space-y-4">
          {/* Monthly vs annual */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Now · Monthly</p>
              <p className="mt-1 font-mono text-lg font-bold text-foreground">
                ${monthly.toLocaleString()}<span className="text-xs font-medium text-muted-foreground">/mo</span>
              </p>
              <p className="text-2xs text-muted-foreground">${(monthly * 12).toLocaleString()} a year</p>
            </div>
            <div className={cn("relative rounded-lg border p-3", color.border, color.bg)}>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">New · Annual</p>
              <p className={cn("mt-1 font-mono text-lg font-bold", color.text)}>
                ${annual.total.toLocaleString()}<span className="text-xs font-medium text-muted-foreground">/yr</span>
              </p>
              <p className="text-2xs text-muted-foreground">≈ ${Math.round(annual.total / 12).toLocaleString()}/mo</p>
              {saving > 0 && (
                <span className="absolute right-2 top-2 rounded-full bg-success/15 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-success">
                  Save ${saving.toLocaleString()}/yr
                </span>
              )}
            </div>
          </div>

          {/* What's charged today */}
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5">
              <Icon className={cn("size-4", color.text)} />
              <p className="text-sm font-semibold text-foreground">Charged today</p>
            </div>
            <div className="space-y-1.5 px-3.5 py-3">
              {annual.lines.map((li) => (
                <div key={li.label} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-foreground">{li.label}</p>
                    <p className="text-2xs text-muted-foreground">{li.note}</p>
                  </div>
                  <span className="shrink-0 font-mono text-foreground">${li.amount.toLocaleString()}</span>
                </div>
              ))}
              {credit > 0 && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-foreground">Unused monthly time</p>
                    <p className="text-2xs text-muted-foreground">{daysLeft} days left on this month, credited</p>
                  </div>
                  <span className="shrink-0 font-mono text-success">−${credit.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-between border-t border-border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-bold text-foreground">Due today</p>
                <p className="text-2xs text-muted-foreground">Tax added on the invoice</p>
              </div>
              <span className="font-mono text-xl font-bold text-foreground">${dueToday.toLocaleString()}</span>
            </div>
          </div>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <CalendarClock className="mt-px size-3.5 shrink-0" />
            <span>
              Renews on <strong className="text-foreground">{renewsOn}</strong> at ${annual.total.toLocaleString()}/yr.
              No more monthly charges after today.
            </span>
          </p>

          {/* Payment method */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment method</p>
            {cards.map((card) => (
              <button key={card.id} type="button" onClick={() => setSelected(card.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                  selected === card.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                )}>
                <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                  selected === card.id ? "border-primary" : "border-muted-foreground/40")}>
                  {selected === card.id && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <CreditCard className={cn("size-4 flex-shrink-0", brandColors[card.brand] ?? "text-secondary")} />
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-foreground">{card.brand} ···· {card.last4}</p>
                  <p className="text-2xs text-muted-foreground">Expires {card.expiryMonth}/{card.expiryYear}</p>
                </div>
                {card.isDefault && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-primary">Default</span>
                )}
              </button>
            ))}
            <button type="button" onClick={onAddCard}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              <Plus className="size-3.5" /> Add a new card
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Keep monthly</Button>
          <Button disabled={!selected} onClick={() => onConfirm(selected)} className="gap-1.5">
            <Check className="size-3.5" /> Switch & pay ${dueToday.toLocaleString()}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
