import * as React from "react";
import { toast } from "sonner";
import {
  CreditCard, Download, CheckCircle2, AlertCircle, Clock, Crown, ShieldCheck, CircleUser,
  Plus, ArrowUpRight, ChevronDown, ChevronRight, X, FileText, Building2, Sparkles, Zap, Rocket, Check,
  ArrowUp, ArrowDown, CalendarClock, AlertTriangle, Trash2, Star, RefreshCw,
  Mail, Globe, RotateCcw, Users, Video, HardDrive, SlidersHorizontal, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/mocks/users";
import {
  PLANS, MOCK_INVOICES, SEAT_PRICING, ACCOUNT_SUBSCRIPTION, accountMonthly,
  type Invoice, type PlanTier,
} from "@/mocks/licenses";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";

/* ── Mock camera usage per subscription (hardcoded for demo) ─────────────── */

const USAGE_DATA: Record<string, { usedCameras: number; usedSeats: number; usedNvrs: number }> = {
  "SUB-2026-001": { usedCameras: 18, usedSeats: 14, usedNvrs: 4 },
  "SUB-2026-002": { usedCameras: 22, usedSeats: 9,  usedNvrs: 2 },
  "SUB-2026-003": { usedCameras: 24, usedSeats: 7,  usedNvrs: 3 },
  "SUB-2026-004": { usedCameras: 5,  usedSeats: 3,  usedNvrs: 1 },
  "SUB-2026-005": { usedCameras: 20, usedSeats: 12, usedNvrs: 2 },
  "SUB-2026-006": { usedCameras: 4,  usedSeats: 5,  usedNvrs: 1 },
  "SUB-2026-007": { usedCameras: 30, usedSeats: 18, usedNvrs: 3 },
};

/* ── Saved card type ──────────────────────────────────────────────────────── */

interface SavedCard {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

const INITIAL_CARDS: SavedCard[] = [
  { id: "card-1", brand: "Visa", last4: "4242", expiryMonth: "12", expiryYear: "2028", isDefault: true },
  { id: "card-2", brand: "Mastercard", last4: "5555", expiryMonth: "08", expiryYear: "2027", isDefault: false },
];

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

const INVOICE_STATUS = {
  paid:    { bg: "bg-success/15 border-success/30",           text: "text-success",      icon: CheckCircle2, label: "Paid"    },
  pending: { bg: "bg-warning/15 border-warning/30",           text: "text-warning",      icon: Clock,        label: "Pending" },
  failed:  { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical", icon: AlertCircle,  label: "Failed"  },
};

/* ── Section card ─────────────────────────────────────────────────────────── */

function SectionCard({ title, description, action, children, className, bodyClassName }: {
  title: string; description?: string; action?: React.ReactNode; children: React.ReactNode;
  className?: string; bodyClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-md font-bold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn("flex-1 px-5 py-4", bodyClassName)}>{children}</div>
    </div>
  );
}

/* ── Payment card display ─────────────────────────────────────────────────── */

function PaymentCardRow({ card, onSetDefault, onRemove, canRemove }: {
  card: SavedCard;
  onSetDefault: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const brandColors: Record<string, string> = {
    Visa: "text-info",
    Mastercard: "text-sev-critical",
    Amex: "text-success",
  };
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border bg-background p-3 transition-colors",
      card.isDefault ? "border-primary/40 bg-primary/[0.02]" : "border-border"
    )}>
      <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/15">
        <CreditCard className={cn("size-4", brandColors[card.brand] ?? "text-secondary")} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-foreground">{card.brand} ···· {card.last4}</p>
          {card.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-primary">
              <Star className="size-2.5" /> Default
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Expires {card.expiryMonth}/{card.expiryYear}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {!card.isDefault && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onSetDefault}>
            Set default
          </Button>
        )}
        {canRemove && (
          <button onClick={onRemove}
            className="flex size-7 items-center justify-center rounded-md border border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10">
            <Trash2 className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Add Card modal (reused from payment flow) ────────────────────────────── */

function AddCardModal({ open, onClose, onSave }: {
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Add Payment Method</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Card details are encrypted — never stored here.
          </p>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
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
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} className="gap-1.5">
            <CreditCard className="size-3.5" /> Add Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Retry payment modal ──────────────────────────────────────────────────── */

function RetryPaymentModal({ open, invoice, cards, onClose, onAddCard, onConfirm }: {
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[480px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Retry Payment</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Choose a card to re-attempt the charge for <strong className="text-foreground">{invoice.id}</strong>.
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
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
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!selected} onClick={() => onConfirm(selected)} className="gap-1.5">
            <RefreshCw className="size-3.5" /> Retry ${total.toLocaleString()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Invoice detail drawer ────────────────────────────────────────────────── */

function InvoiceDetailDrawer({ invoice, onRetryPayment, onClose }: {
  invoice: Invoice | null; onRetryPayment: () => void; onClose: () => void;
}) {
  if (!invoice) return null;
  const s = INVOICE_STATUS[invoice.status];
  const Icon = s.icon;
  const PlanIcon = PLAN_ICONS[invoice.planTier];
  const planColor = PLAN_COLORS[invoice.planTier];
  const lineItems: { label: string; note: string; amount: number }[] = [
    { label: `${invoice.planName} plan`, note: `${invoice.billingCycle === "annual" ? "Annual" : "Monthly"} base · incl. owner seat`, amount: PLANS[invoice.planTier].pricePerMonth },
    ...([
      ["Admin seats (Add On)", invoice.seats.admin, SEAT_PRICING.admin.pricePerMonth],
      ["User seats (Add On)", invoice.seats.user, SEAT_PRICING.user.pricePerMonth],
    ] as [string, number, number][])
      .filter(([, n]) => n > 0)
      .map(([label, n, price]) => ({ label, note: `${n} × $${price}/mo`, amount: n * price })),
  ];
  const subtotal = invoice.amount;
  const taxes = Math.round(subtotal * 0.07);
  const total = subtotal + taxes;
  const dateLabel = invoice.status === "paid" ? "Paid" : invoice.status === "pending" ? "Due" : "Issued";
  const dateValue = invoice.status === "pending" ? invoice.dueDisplay : invoice.issuedDisplay;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[min(560px,90vw)] flex-col overflow-hidden bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-2.5">
            <div className={cn("flex size-9 items-center justify-center rounded-lg border", planColor.border, planColor.bg)}>
              <PlanIcon className={cn("size-4", planColor.text)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-md font-bold text-foreground">{invoice.periodDisplay} invoice</h3>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
                  <Icon className="size-3" /> {s.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{invoice.planName} · {invoice.sites.length} site{invoice.sites.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {invoice.status === "failed" && (
            <div className="flex items-start gap-3 rounded-lg border border-sev-critical/40 bg-sev-critical/[0.06] p-3">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-sev-critical" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-sev-critical">Payment failed</p>
                <p className="mt-0.5 text-muted-foreground">The charge for this invoice could not be processed. Please update your payment method and retry.</p>
              </div>
              <Button size="sm" variant="outline" onClick={onRetryPayment} className="flex-shrink-0 gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10">
                <RefreshCw className="size-3.5" /> Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Invoice number</p>
              <p className="mt-0.5 font-mono text-sm text-primary">{invoice.id}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{dateLabel}</p>
              <p className="mt-0.5 text-sm text-foreground">{dateValue}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
              <p className={cn("mt-0.5 text-sm font-semibold", s.text)}>{s.label}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Payment method</p>
              <p className="mt-0.5 text-sm text-foreground">{invoice.paymentMethod}</p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Charges</p>
            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <div className="divide-y divide-border/60">
                {lineItems.map((li) => (
                  <div key={li.label} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{li.label}</p>
                      <p className="text-2xs text-muted-foreground">{li.note}</p>
                    </div>
                    <span className="font-mono text-sm text-foreground">${li.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 border-t border-border px-3.5 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono text-foreground">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tax (7%)</span>
                  <span className="font-mono text-foreground">${taxes.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-md font-bold text-foreground">
                  <span>Total</span>
                  <span className="font-mono">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3.5">
          {invoice.status === "failed" ? (
            <Button onClick={onRetryPayment} className="w-full gap-1.5">
              <RefreshCw className="size-3.5" /> Retry Payment
            </Button>
          ) : invoice.status === "pending" ? (
            <Button className="w-full gap-1.5">
              <CreditCard className="size-3.5" /> Pay Now
            </Button>
          ) : (
            <Button className="w-full gap-1.5">
              <Download className="size-3.5" /> Download PDF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Billing Details section ──────────────────────────────────────────────── */

interface BillingDetails {
  email: string;
  company: string;
  taxId: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

function BillingDetailsSection({ className }: { className?: string }) {
  const [editing, setEditing] = React.useState(false);
  const [details, setDetails] = React.useState<BillingDetails>({
    email: "billing@acmecorp.com",
    company: "Acme Corp Pte Ltd",
    taxId: "",
    address: "",
    city: "Singapore",
    state: "",
    postcode: "",
    country: "Singapore",
  });
  const [draft, setDraft] = React.useState<BillingDetails>(details);
  const [errors, setErrors] = React.useState<Partial<Record<keyof BillingDetails, string>>>({});

  function patch(k: keyof BillingDetails, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function save() {
    const next: Partial<Record<keyof BillingDetails, string>> = {};
    if (draft.email.trim().length === 0) next.email = "Email is required.";
    if (draft.company.trim().length === 0) next.company = "Company is required.";
    if (draft.address.trim().length === 0) next.address = "Address is required.";
    if (draft.city.trim().length === 0) next.city = "City is required.";
    if (draft.postcode.trim().length === 0) next.postcode = "Postcode is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setDetails(draft);
    setEditing(false);
    toast.success("Billing details saved", { description: "Future invoices will use these details." });
  }

  return (
    <SectionCard
      title="Billing Details"
      description="Applied to all future invoice PDFs across this account."
      className={className}
      action={
        !editing ? (
          <Button size="sm" variant="outline" onClick={() => { setDraft(details); setEditing(true); }}>
            Edit
          </Button>
        ) : null
      }
    >
      {!editing ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {[
            ["Billing Email", details.email],
            ["Company / Organisation", details.company || "—"],
            ["Tax ID / VAT", details.taxId || "—"],
            ["Country", details.country],
            ["Address", details.address || "—"],
            ["City", details.city || "—"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 text-base text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Billing Email *
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={draft.email} onChange={(e) => patch("email", e.target.value)} className="h-9 pl-9 text-base" placeholder="billing@company.com" aria-invalid={!!errors.email} />
              </div>
              {errors.email && <p className="mt-1 text-xs text-sev-critical">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Company / Organisation</label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={draft.company} onChange={(e) => patch("company", e.target.value)} className="h-9 pl-9 text-base" placeholder="Acme Corp Pte Ltd" aria-invalid={!!errors.company} />
              </div>
              {errors.company && <p className="mt-1 text-xs text-sev-critical">{errors.company}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tax ID / VAT Number (Optional)</label>
              <Input value={draft.taxId} onChange={(e) => patch("taxId", e.target.value)} className="h-9 text-base" placeholder="e.g. GST-201234567A" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Street Address</label>
              <Input value={draft.address} onChange={(e) => patch("address", e.target.value)} className="h-9 text-base" placeholder="8 Marina Boulevard" aria-invalid={!!errors.address} />
              {errors.address && <p className="mt-1 text-xs text-sev-critical">{errors.address}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</label>
              <Input value={draft.city} onChange={(e) => patch("city", e.target.value)} className="h-9 text-base" placeholder="Singapore" aria-invalid={!!errors.city} />
              {errors.city && <p className="mt-1 text-xs text-sev-critical">{errors.city}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">State / Province (Optional)</label>
              <Input value={draft.state} onChange={(e) => patch("state", e.target.value)} className="h-9 text-base" placeholder="Optional" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Postcode</label>
              <Input value={draft.postcode} onChange={(e) => patch("postcode", e.target.value)} className="h-9 text-base" placeholder="018984" aria-invalid={!!errors.postcode} />
              {errors.postcode && <p className="mt-1 text-xs text-sev-critical">{errors.postcode}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Country</label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Select value={draft.country} onValueChange={(v) => patch("country", v)}>
                  <SelectTrigger className="h-9 w-full pl-9 text-base">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Singapore", "Malaysia", "Thailand", "United States", "United Kingdom", "Australia", "Japan"].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Button size="sm" onClick={save} className="gap-1.5">
              <Check className="size-3.5" /> Save Details
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

/* ── Invoices table ───────────────────────────────────────────────────────── */

const INVOICE_TONE: Record<Invoice["status"], "success" | "warning" | "critical"> = {
  paid: "success",
  pending: "warning",
  failed: "critical",
};

function InvoicesTable({ invoices, onOpen, onRetry }: {
  invoices: Invoice[];
  onOpen: (inv: Invoice) => void;
  onRetry: (inv: Invoice) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="border-b border-border text-left">
              {["ISSUED", "INVOICE", "PERIOD", "SITES", "STATUS", "AMOUNT", ""].map((h, i) => (
                <th
                  key={h || `col-${i}`}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60",
                    h === "AMOUNT" && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm italic text-muted-foreground">
                  No invoices match the current filters.
                </td>
              </tr>
            ) : invoices.map((inv) => {
              const color = PLAN_COLORS[inv.planTier];
              const PlanIcon = PLAN_ICONS[inv.planTier];
              return (
              <tr
                key={inv.id}
                onClick={() => onOpen(inv)}
                className="group cursor-pointer text-base transition-colors hover:bg-muted/20"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">{inv.issuedDisplay}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">{inv.id}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground transition-colors group-hover:text-primary">{inv.periodDisplay}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("flex size-6 flex-shrink-0 items-center justify-center rounded border", color.border, color.bg)}>
                      <PlanIcon className={cn("size-3", color.text)} />
                    </div>
                    <span className="text-sm text-muted-foreground">{inv.sites.length} site{inv.sites.length !== 1 ? "s" : ""}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge tone={INVOICE_TONE[inv.status]}>{INVOICE_STATUS[inv.status].label}</StatusBadge>
                    {inv.status === "failed" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRetry(inv); }}
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-semibold text-sev-critical hover:bg-sev-critical/10"
                      >
                        <RefreshCw className="size-2.5" /> Retry
                      </button>
                    )}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm font-bold text-foreground">${inv.amount.toLocaleString()}</td>
                <td className="px-3 py-3 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Invoice filter panel ─────────────────────────────────────────────────── */

const ALL_SITES = Array.from(
  new Set(MOCK_INVOICES.flatMap((inv) => inv.sites))
).sort();

const INVOICE_STATUS_FILTER_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
] as const;

const INVOICE_SITE_FILTER_OPTIONS = ALL_SITES.map((s) => ({ value: s, label: s }));

type InvoiceSort = "newest" | "amount-high" | "amount-low";

function InvoiceFilterPanel({ statusFilter, siteFilter, onStatusChange, onSiteChange }: {
  statusFilter: string[];
  siteFilter: string[];
  onStatusChange: (v: string[]) => void;
  onSiteChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const activeCount = statusFilter.length + siteFilter.length;
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-muted/30">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">{activeCount} active</span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All statuses", "All sites"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </button>
        <div className="flex items-center gap-3">
          <button type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
              <FilterDropdown label="All statuses" options={INVOICE_STATUS_FILTER_OPTIONS} selected={statusFilter} onChange={onStatusChange} />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</div>
              <FilterDropdown label="All sites" options={INVOICE_SITE_FILTER_OPTIONS} selected={siteFilter} onChange={onSiteChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

type TabKey = "overview" | "invoices";

function TabSwitcher({ value, onChange }: {
  value: TabKey;
  onChange: (k: TabKey) => void;
}) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "invoices", label: "Invoices" },
  ];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function BillingPage() {
  const subs = useSubscriptionsStore((s) => s.subscriptions);

  const [tab, setTab] = React.useState<TabKey>("overview");

  /* ── Multi-card wallet state ──────────────────────────────────────────── */
  const [cards, setCards] = React.useState<SavedCard[]>(INITIAL_CARDS);
  const [addCardOpen, setAddCardOpen] = React.useState(false);

  /* ── Invoice drawer + retry ───────────────────────────────────────────── */
  const [activeInvoice, setActiveInvoice] = React.useState<Invoice | null>(null);
  const [retryInvoice, setRetryInvoice] = React.useState<Invoice | null>(null);

  /* ── Invoice filters + sort ───────────────────────────────────────────── */
  const [invoiceStatusFilter, setInvoiceStatusFilter] = React.useState<string[]>([]);
  const [invoiceSiteFilter, setInvoiceSiteFilter] = React.useState<string[]>([]);
  const [invoiceSortBy, setInvoiceSortBy] = React.useState<InvoiceSort>("newest");

  /* ── Aggregates (account-wide, across all sites) ──────────────────────── */
  const activeSubs = subs.filter((s) => s.status !== "cancelled");
  const totalSeats = activeSubs.reduce((s, x) => s + x.seats.owner + x.seats.admin + x.seats.user, 0);
  const totalUsers = MOCK_USERS.length;
  const totalCameras = Object.values(USAGE_DATA).reduce((s, d) => s + d.usedCameras, 0);
  const totalNvrs = activeSubs.reduce((s, x) => s + (USAGE_DATA[x.id]?.usedNvrs ?? 0), 0);

  /* ── Account subscription + upcoming invoice ──────────────────────────── */
  const acct = ACCOUNT_SUBSCRIPTION;
  const acctMonthly = accountMonthly(acct.seats);
  const acctLines: { label: string; note: string; amount: number }[] = [
    { label: `${acct.planName} plan`, note: `${acct.billingCycle === "annual" ? "Annual" : "Monthly"} base · incl. owner seat`, amount: PLANS[acct.planTier].pricePerMonth },
    { label: "Admin seats (Add On)", note: `${acct.seats.admin} × $${SEAT_PRICING.admin.pricePerMonth}/mo`, amount: acct.seats.admin * SEAT_PRICING.admin.pricePerMonth },
    { label: "User seats (Add On)", note: `${acct.seats.user} × $${SEAT_PRICING.user.pricePerMonth}/mo`, amount: acct.seats.user * SEAT_PRICING.user.pricePerMonth },
  ];
  const nextInvoice: Invoice = {
    id: "INV-2026-007",
    issuedDisplay: acct.nextInvoiceDate,
    periodDisplay: "Jul 2026",
    dueDisplay: acct.nextInvoiceDate,
    status: "pending",
    paymentMethod: acct.paymentMethod,
    planName: acct.planName,
    planTier: acct.planTier,
    billingCycle: acct.billingCycle,
    seats: acct.seats,
    sites: acct.sites,
    amount: acctMonthly,
  };
  const AcctIcon = PLAN_ICONS[acct.planTier];
  const acctColor = PLAN_COLORS[acct.planTier];

  /* ── Filtered invoices ────────────────────────────────────────────────── */
  const filteredInvoices = React.useMemo(() => {
    const list = MOCK_INVOICES.filter(
      (inv) =>
        (invoiceStatusFilter.length === 0 || invoiceStatusFilter.includes(inv.status)) &&
        (invoiceSiteFilter.length === 0 || inv.sites.some((site) => invoiceSiteFilter.includes(site)))
    );
    list.sort((a, b) => {
      if (invoiceSortBy === "amount-high") return b.amount - a.amount;
      if (invoiceSortBy === "amount-low") return a.amount - b.amount;
      return new Date(b.issuedDisplay).getTime() - new Date(a.issuedDisplay).getTime();
    });
    return list;
  }, [invoiceStatusFilter, invoiceSiteFilter, invoiceSortBy]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  function addCard(last4: string, expiry: string, brand: "Visa" | "Mastercard" | "Amex") {
    const [month, year] = expiry.split("/");
    setCards((c) => [...c, { id: `card-${Date.now()}`, brand, last4, expiryMonth: month, expiryYear: `20${year}`, isDefault: false }]);
    setAddCardOpen(false);
    toast.success(`${brand} ending ${last4} added to wallet`);
  }

  function setDefaultCard(id: string) {
    setCards((c) => c.map((card) => ({ ...card, isDefault: card.id === id })));
    toast.success("Default payment method updated");
  }

  function removeCard(id: string) {
    if (cards.length <= 1) return;
    setCards((c) => c.filter((card) => card.id !== id));
    toast.message("Card removed");
  }

  function handleRetryPayment() {
    setRetryInvoice(activeInvoice);
    setActiveInvoice(null);
  }

  function confirmRetryPayment(cardId: string) {
    const card = cards.find((c) => c.id === cardId);
    setRetryInvoice(null);
    toast.success("Payment retried", {
      description: card
        ? `Re-attempting the charge on ${card.brand} ···· ${card.last4}. We'll email a receipt once it clears.`
        : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Billing & License</PageHeader.Title>
          <PageHeader.Description>
            One subscription per account. Manage your plan, seats, sites, payment methods, and invoices.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <div>
        <TabSwitcher value={tab} onChange={setTab} />
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-4">
          {/* Current plan banner */}
          <div className={cn("flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4", acctColor.border, acctColor.bg)}>
            <div className="flex items-center gap-3">
              <div className={cn("flex size-11 flex-shrink-0 items-center justify-center rounded-lg border bg-background/40", acctColor.border)}>
                <AcctIcon className={cn("size-5", acctColor.text)} />
              </div>
              <div className="min-w-0">
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Current Plan</p>
                <p className="text-lg font-bold text-foreground">
                  {acct.planName}
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground">· {acct.billingCycle === "annual" ? "Annual" : "Monthly"}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Monthly</p>
                <p className={cn("font-mono text-lg font-bold", acctColor.text)}>${acctMonthly.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Renews</p>
                <p className="text-sm font-semibold text-foreground">{acct.renewsDisplay}</p>
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <KpiGrid cols={4}>
            <KpiCard label="Active Sites" value={activeSubs.length} sub={`On ${acct.planName} plan`} accent="primary" />
            <KpiCard label="Total Seats" value={totalSeats} sub={`${totalUsers} users assigned`} accent="info" />
            <KpiCard label="Total Cameras" value={totalCameras} sub={`Across ${activeSubs.length} sites`} accent="warning" />
            <KpiCard label="Total NVRs" value={totalNvrs} sub={`Across ${activeSubs.length} sites`} accent="purple" />
          </KpiGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px] lg:items-stretch">
            {/* Payment Information — methods + billing details */}
            <div className="flex flex-col gap-4">
              <SectionCard
                title="Payment Methods"
                description="Cards used for all charges on this account."
                action={
                  <Button size="sm" variant="outline" onClick={() => setAddCardOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" /> Add card
                  </Button>
                }
              >
                <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {cards.map((card) => (
                    <PaymentCardRow
                      key={card.id}
                      card={card}
                      onSetDefault={() => setDefaultCard(card.id)}
                      onRemove={() => removeCard(card.id)}
                      canRemove={cards.length > 1}
                    />
                  ))}
                </div>
              </SectionCard>

              <BillingDetailsSection className="flex-1" />
            </div>

            {/* Next Invoice — single account-level monthly charge */}
            <SectionCard
              title="Next Invoice"
              description={`Charges ${acct.nextInvoiceDate}.`}
              className="lg:h-full"
              bodyClassName="flex flex-col"
            >
              <button
                onClick={() => setActiveInvoice(nextInvoice)}
                className="group flex w-full items-center gap-2.5 rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div className={cn("flex size-8 flex-shrink-0 items-center justify-center rounded-lg border", acctColor.border, acctColor.bg)}>
                  <AcctIcon className={cn("size-4", acctColor.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground transition-colors group-hover:text-primary">{acct.planName} plan</p>
                  <p className="text-2xs text-muted-foreground">{acct.billingCycle === "annual" ? "Annual" : "Monthly"} · {acct.sites.length} sites</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
              </button>

              <div className="mt-3 space-y-1.5 rounded-lg border border-border bg-background px-3.5 py-3">
                {acctLines.map((li) => (
                  <div key={li.label} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-foreground">{li.label}</p>
                      <p className="text-2xs text-muted-foreground">{li.note}</p>
                    </div>
                    <span className="shrink-0 font-mono text-foreground">${li.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-baseline justify-between border-t border-border pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly total</span>
                <span className="font-mono text-2xl font-bold text-success">${acctMonthly.toLocaleString()}</span>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <h2 className="text-md font-bold text-foreground">Invoices</h2>
          </div>
          <InvoiceFilterPanel
            statusFilter={invoiceStatusFilter}
            siteFilter={invoiceSiteFilter}
            onStatusChange={setInvoiceStatusFilter}
            onSiteChange={setInvoiceSiteFilter}
          />

          <div className="flex items-center justify-between px-1">
            <p className="text-base text-muted-foreground">
              <strong className="text-foreground">{filteredInvoices.length}</strong> invoice{filteredInvoices.length !== 1 ? "s" : ""} match current filters
              {(invoiceStatusFilter.length > 0 || invoiceSiteFilter.length > 0) && (
                <button
                  onClick={() => { setInvoiceStatusFilter([]); setInvoiceSiteFilter([]); }}
                  className="ml-2 text-muted-foreground underline hover:text-primary"
                >
                  Clear all
                </button>
              )}
            </p>
            <Select value={invoiceSortBy} onValueChange={(v) => setInvoiceSortBy(v as InvoiceSort)}>
              <SelectTrigger className="w-auto text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="amount-high">Amount (high → low)</SelectItem>
                <SelectItem value="amount-low">Amount (low → high)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <InvoicesTable invoices={filteredInvoices} onOpen={setActiveInvoice} onRetry={setRetryInvoice} />
        </div>
      )}

      {/* Modals */}
      <AddCardModal open={addCardOpen} onClose={() => setAddCardOpen(false)} onSave={addCard} />
      <InvoiceDetailDrawer invoice={activeInvoice} onRetryPayment={handleRetryPayment} onClose={() => setActiveInvoice(null)} />
      <RetryPaymentModal
        open={retryInvoice !== null}
        invoice={retryInvoice}
        cards={cards}
        onClose={() => setRetryInvoice(null)}
        onAddCard={() => setAddCardOpen(true)}
        onConfirm={confirmRetryPayment}
      />
    </div>
  );
}
