import * as React from "react";
import { toast } from "sonner";
import {
  CreditCard, Download, CheckCircle2, AlertCircle, Clock, Crown, ShieldCheck, CircleUser,
  Plus, ArrowUpRight, ChevronDown, ChevronRight, X, FileText, Building2, Sparkles, Zap, Rocket, Check,
  ArrowUp, ArrowDown, CalendarClock, AlertTriangle, Trash2, Star, Filter, RefreshCw,
  Mail, Globe, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/mocks/users";
import {
  PLANS, MOCK_INVOICES, ORG_LICENSE_INFO, SEAT_PRICING,
  type Invoice, type PlanTier, type SiteSubscription,
} from "@/mocks/licenses";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { UserRole } from "@/types/users";

/* ── Date helpers ─────────────────────────────────────────────────────────── */

const BILLING_TODAY = "2026-06-08";

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

/* ── Mock camera usage per subscription (hardcoded for demo) ─────────────── */

const USAGE_DATA: Record<string, { usedCameras: number; usedSeats: number; usedNvrs: number }> = {
  "SUB-2026-001": { usedCameras: 18, usedSeats: 14, usedNvrs: 4 },
  "SUB-2026-002": { usedCameras: 22, usedSeats: 9,  usedNvrs: 2 },
  "SUB-2026-003": { usedCameras: 24, usedSeats: 7,  usedNvrs: 3 },
  "SUB-2026-004": { usedCameras: 5,  usedSeats: 3,  usedNvrs: 1 },
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

const ROLE_ICONS: Record<UserRole, { icon: React.ElementType; bg: string; text: string }> = {
  owner: { icon: Crown,       bg: "bg-success/15 border-success/30",      text: "text-success"   },
  admin: { icon: ShieldCheck, bg: "bg-info/15 border-info/30",            text: "text-info"      },
  user:  { icon: CircleUser,  bg: "bg-secondary/15 border-secondary/30",  text: "text-secondary" },
};

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

const TIER_ORDER: PlanTier[] = ["starter", "professional", "enterprise"];

function tierRank(t: PlanTier): number { return TIER_ORDER.indexOf(t); }

/* ── Derived subscription status → StatusBadge tone + renewal urgency ────── */

const RENEWAL_SOON_DAYS = 14;

type SubTone = "success" | "warning" | "info" | "critical" | "neutral";

function renewalDays(sub: SiteSubscription): number {
  return daysBetween(BILLING_TODAY, sub.cancellingAt ?? sub.renewsAt);
}

function subStatusBadge(sub: SiteSubscription): { tone: SubTone; label: string } {
  switch (sub.status) {
    case "payment_failed": return { tone: "critical", label: "Payment Failed" };
    case "cancelling":     return { tone: "warning",  label: "Cancelling" };
    case "cancelled":      return { tone: "neutral",  label: "Cancelled" };
    case "trial":          return { tone: "info",     label: "Trial" };
    case "past-due":       return { tone: "warning",  label: "Past Due" };
    default:               return { tone: "success",  label: "Active" };
  }
}

function isDueSoon(sub: SiteSubscription): boolean {
  if (sub.status !== "active" && sub.status !== "trial") return false;
  const d = renewalDays(sub);
  return d >= 0 && d <= RENEWAL_SOON_DAYS;
}

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

/* ── Usage progress bar ───────────────────────────────────────────────────── */

function UsageBar({ used, total, label }: { used: number; total: number | "unlimited"; label: string }) {
  if (total === "unlimited") {
    return (
      <div>
        <div className="mb-1 flex items-center justify-between text-2xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono text-muted-foreground">{used} / ∞</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/4 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    );
  }
  const pct = total > 0 ? (used / total) * 100 : 0;
  const isOverage = used > total;
  const isFull = used === total && total > 0;
  const isWarning = pct >= 80 && !isOverage && !isFull;
  const barClass = isOverage ? "bg-sev-critical" : isFull || isWarning ? "bg-warning" : "bg-success";
  const textClass = isOverage ? "text-sev-critical" : isFull || isWarning ? "text-warning" : "text-foreground";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-2xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-bold", textClass)}>
          {used} / {total}
          {isOverage && <span className="ml-1 text-3xs text-sev-critical">(+{used - total} over)</span>}
          {isFull && <span className="ml-1 text-3xs text-warning">(at limit)</span>}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

/* ── Site Subscriptions table ─────────────────────────────────────────────── */

function DueSoonChip({ days }: { days: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-warning">
      <CalendarClock className="size-2.5" /> Due in {days}d
    </span>
  );
}

function SiteSubscriptionsTable({ subs, onOpen }: {
  subs: SiteSubscription[];
  onOpen: (sub: SiteSubscription) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="border-b border-border text-left">
              {["SITE", "PLAN", "STATUS", "SEATS", "CAMERAS", "RENEWAL", "COST", ""].map((h, i) => (
                <th
                  key={h || `col-${i}`}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60",
                    h === "COST" && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {subs.map((s) => {
              const plan = PLANS[s.planTier];
              const color = PLAN_COLORS[s.planTier];
              const Icon = PLAN_ICONS[s.planTier];
              const badge = subStatusBadge(s);
              const usage = USAGE_DATA[s.id];
              const totalSeats = s.seats.owner + s.seats.admin + s.seats.user;
              const dueSoon = isDueSoon(s);
              const days = renewalDays(s);
              const isCancelled = s.status === "cancelled";
              return (
                <tr
                  key={s.id}
                  onClick={() => onOpen(s)}
                  className={cn(
                    "group cursor-pointer text-base transition-colors hover:bg-muted/20",
                    isCancelled && "opacity-60"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex size-8 flex-shrink-0 items-center justify-center rounded-md border", color.border, color.bg)}>
                        <Icon className={cn("size-3.5", color.text)} />
                      </div>
                      <TruncatedText text={s.siteName} className="font-semibold text-foreground transition-colors group-hover:text-primary" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className={cn("text-sm font-semibold", color.text)}>{plan.name}</p>
                    <p className="text-2xs text-muted-foreground">{s.billingCycle === "annual" ? "Annual" : "Monthly"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                      {dueSoon && <DueSoonChip days={days} />}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                    <span className="text-foreground">{usage ? usage.usedSeats : totalSeats}</span>
                    <span className="text-muted-foreground"> / {totalSeats}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                    <span className="text-foreground">{usage ? usage.usedCameras : 0}</span>
                    <span className="text-muted-foreground"> / {typeof plan.cameraLimit === "number" ? plan.cameraLimit : "∞"}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <p className={cn("text-sm", dueSoon ? "font-semibold text-warning" : "text-muted-foreground")}>
                      {s.renewsDisplay.split(" (")[0]}
                    </p>
                    {dueSoon && <p className="text-2xs text-warning">in {days} day{days !== 1 ? "s" : ""}</p>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className={cn("font-mono text-sm font-bold", color.text)}>${s.monthlyCost.toLocaleString()}</span>
                    <span className="text-2xs text-muted-foreground">/mo</span>
                  </td>
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

/* ── Site Subscription detail drawer ──────────────────────────────────────── */

function SubscriptionDrawer({ sub, open, onClose, onChangePlan, onManageSeats, onCancel, onReactivate }: {
  sub: SiteSubscription | null;
  open: boolean;
  onClose: () => void;
  onChangePlan: () => void;
  onManageSeats: () => void;
  onCancel: () => void;
  onReactivate: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(560px,92vw)] max-w-[95vw] flex-col gap-0 p-0">
        {sub ? (
          (() => {
            const plan = PLANS[sub.planTier];
            const color = PLAN_COLORS[sub.planTier];
            const Icon = PLAN_ICONS[sub.planTier];
            const badge = subStatusBadge(sub);
            const usage = USAGE_DATA[sub.id];
            const totalSeats = sub.seats.owner + sub.seats.admin + sub.seats.user;
            const isCancelled = sub.status === "cancelled";
            const dueSoon = isDueSoon(sub);
            const days = renewalDays(sub);
            const planAccent: KpiAccent = sub.planTier === "starter" ? "info" : sub.planTier === "professional" ? "purple" : "success";
            const roles = [
              { key: "owner" as const, count: sub.seats.owner },
              { key: "admin" as const, count: sub.seats.admin },
              { key: "user" as const, count: sub.seats.user },
            ];
            return (
              <>
                <SheetHeader className="border-b border-border bg-card px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className={cn("flex size-11 flex-shrink-0 items-center justify-center rounded-lg border", color.border, color.bg)}>
                        <Icon className={cn("size-5", color.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                          <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                          {dueSoon && <DueSoonChip days={days} />}
                        </div>
                        <SheetTitle className="min-w-0 text-lg font-bold">
                          <TruncatedText text={sub.siteName} />
                        </SheetTitle>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          <span className={cn("font-semibold", color.text)}>{plan.name}</span>
                          {" · "}{sub.billingCycle === "annual" ? "Annual" : "Monthly"}
                          {" · "}Renews {sub.renewsDisplay.split(" (")[0]}
                        </p>
                      </div>
                    </div>
                    <button onClick={onClose} className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  </div>
                </SheetHeader>

                <div className="flex-1 space-y-6 overflow-y-auto p-5">
                  {/* Overview */}
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overview</p>
                    <div className="grid grid-cols-3 gap-3">
                      <KpiCard compact label="Monthly Cost" value={`$${sub.monthlyCost.toLocaleString()}`} sub="Billed per month" accent={planAccent} />
                      <KpiCard compact label="Billing" value={sub.billingCycle === "annual" ? "Annual" : "Monthly"} sub={`Started ${sub.startedDisplay}`} accent="info" />
                      <KpiCard compact label="Renews" value={sub.renewsDisplay.split(" (")[0]} sub={dueSoon ? `In ${days} day${days !== 1 ? "s" : ""}` : "On schedule"} accent={dueSoon ? "warning" : "muted"} />
                    </div>
                  </div>

                  {/* Usage */}
                  {usage && !isCancelled && (
                    <div>
                      <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Usage</p>
                      <div className="grid grid-cols-1 gap-3.5 rounded-lg border border-border bg-card p-4">
                        <UsageBar used={usage.usedSeats} total={totalSeats} label="Seats" />
                        <UsageBar used={usage.usedCameras} total={plan.cameraLimit} label="Cameras" />
                        <UsageBar used={usage.usedNvrs} total={plan.nvrLimit} label="NVRs" />
                      </div>
                    </div>
                  )}

                  {/* Seats by role */}
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Seats by Role</p>
                    <div className="grid grid-cols-3 gap-3">
                      {roles.map(({ key, count }) => (
                        <KpiCard
                          key={key}
                          compact
                          label={`${key.charAt(0).toUpperCase()}${key.slice(1)}${count === 1 ? "" : "s"}`}
                          value={count}
                          accent={key === "owner" ? "success" : key === "admin" ? "info" : "warning"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Plan limits */}
                  <div>
                    <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Plan Limits</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-card p-4">
                      {([
                        ["Cameras", typeof plan.cameraLimit === "number" ? `${plan.cameraLimit} per site` : "Unlimited"],
                        ["NVRs", typeof plan.nvrLimit === "number" ? `${plan.nvrLimit}` : "Unlimited"],
                        ["Users", typeof plan.userLimit === "number" ? `${plan.userLimit}` : "Unlimited"],
                        ["Retention", `${plan.retentionDays} days`],
                      ] as [string, string][]).map(([label, value]) => (
                        <div key={label} className="flex flex-col gap-0.5">
                          <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                          <span className="text-base font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 border-t border-border px-5 py-3.5">
                  {isCancelled ? (
                    <Button onClick={onReactivate} className="gap-1.5">
                      <RotateCcw className="size-3.5" /> Reactivate
                    </Button>
                  ) : (
                    <>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="gap-1.5">
                            Update <ChevronDown className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" side="top" className="w-44">
                          <DropdownMenuItem onClick={onChangePlan} className="gap-2">
                            <ArrowUp className="size-3.5 text-muted-foreground" /> Change Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={onManageSeats} className="gap-2">
                            <Plus className="size-3.5 text-muted-foreground" /> Add Seats
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" onClick={onCancel} className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <X className="size-3.5" /> Cancel Plan
                      </Button>
                    </>
                  )}
                </div>
              </>
            );
          })()
        ) : (
          <div className="p-6 text-base text-muted-foreground">No subscription selected.</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Change Plan modal ────────────────────────────────────────────────────── */

function ChangePlanModal({ open, current, onClose, onConfirm, onCancelPlan }: {
  open: boolean;
  current: SiteSubscription | null;
  onClose: () => void;
  onConfirm: (planTier: PlanTier, cycle: "monthly" | "annual") => void;
  onCancelPlan: () => void;
}) {
  const [picked, setPicked] = React.useState<PlanTier>("professional");
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("annual");
  const [step, setStep] = React.useState<"pick" | "confirm">("pick");

  React.useEffect(() => {
    if (open && current) {
      setPicked(current.planTier);
      setCycle(current.billingCycle);
      setStep("pick");
    }
  }, [open, current]);

  if (!current) return null;

  const direction =
    tierRank(picked) > tierRank(current.planTier) ? "upgrade" :
    tierRank(picked) < tierRank(current.planTier) ? "downgrade" : "same";

  const oldPlan = PLANS[current.planTier];
  const newPlan = PLANS[picked];
  const oldCost = cycle === "annual" ? Math.round(oldPlan.pricePerYear / 12) : oldPlan.pricePerMonth;
  const newCost = cycle === "annual" ? Math.round(newPlan.pricePerYear / 12) : newPlan.pricePerMonth;
  const remainingDays = 14; // mock proration period
  const credit = direction === "upgrade" ? Math.round((oldCost / 30) * remainingDays) : 0;
  const charge = direction === "upgrade" ? Math.round((newCost / 30) * remainingDays) : 0;
  const netDue = charge - credit;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {step === "pick" ? "Change Plan" : "Confirm Plan Change"}
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {step === "pick"
              ? <>{`Choose a new plan for `}<strong className="text-foreground">{current.siteName}</strong>.</>
              : <>{`Review the changes before applying them to `}<strong className="text-foreground">{current.siteName}</strong>.</>
            }
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {step === "pick" ? (
            <>
              <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-border bg-background p-1 text-sm">
                <button onClick={() => setCycle("monthly")}
                  className={cn("flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                    cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  Monthly
                </button>
                <button onClick={() => setCycle("annual")}
                  className={cn("flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                    cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  Annual <span className="text-2xs opacity-80">(save ~17%)</span>
                </button>
              </div>
              <div className="space-y-2">
                {TIER_ORDER.map((tier) => {
                  const p = PLANS[tier];
                  const color = PLAN_COLORS[tier];
                  const Icon = PLAN_ICONS[tier];
                  const isCurrent = tier === current.planTier;
                  const isPicked = tier === picked;
                  const monthly = cycle === "annual" ? Math.round(p.pricePerYear / 12) : p.pricePerMonth;
                  return (
                    <button key={tier} onClick={() => setPicked(tier)}
                      className={cn(
                        "relative flex w-full items-start gap-3 rounded-lg border bg-background p-3.5 text-left transition-colors",
                        isPicked ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                      )}>
                      {p.highlight && (
                        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-white">
                          <Sparkles className="size-2.5" /> Most popular
                        </span>
                      )}
                      <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border", isPicked ? "border-primary" : "border-muted-foreground/40")}>
                        {isPicked && <span className="size-2 rounded-full bg-primary" />}
                      </div>
                      <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-lg border", color.border, color.bg)}>
                        <Icon className={cn("size-4", color.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-md font-bold text-foreground">{p.name}</p>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-primary">
                              <Check className="size-2.5" strokeWidth={3} /> Current plan
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.tagline}</p>
                        <ul className="mt-2 space-y-1">
                          {p.features.slice(0, 4).map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-2xs text-muted-foreground">
                              <Check className={cn("mt-0.5 size-2.5 flex-shrink-0", color.text)} strokeWidth={3} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-mono text-lg font-bold leading-none", color.text)}>${monthly}</p>
                        <p className="mt-0.5 text-3xs text-muted-foreground">/mo /site</p>
                        {cycle === "annual" && (
                          <p className="mt-0.5 text-3xs text-success">${p.pricePerYear.toLocaleString()}/yr</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Plan change direction */}
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan change</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-md border border-border bg-card p-3">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Current</p>
                    <p className="mt-1 text-lg font-bold text-foreground">{oldPlan.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">${oldCost}/mo</p>
                  </div>
                  <div className={cn(
                    "flex size-9 flex-shrink-0 items-center justify-center rounded-full",
                    direction === "upgrade" ? "bg-success/15 text-success" :
                    direction === "downgrade" ? "bg-warning/15 text-warning" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {direction === "upgrade" ? <ArrowUp className="size-4" /> :
                     direction === "downgrade" ? <ArrowDown className="size-4" /> :
                     <Check className="size-4" />}
                  </div>
                  <div className={cn("flex-1 rounded-md border-2 p-3", PLAN_COLORS[picked].border, PLAN_COLORS[picked].bg)}>
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">New</p>
                    <p className={cn("mt-1 text-lg font-bold", PLAN_COLORS[picked].text)}>{newPlan.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">${newCost}/mo</p>
                  </div>
                </div>
              </div>

              {/* Proration breakdown */}
              {direction === "upgrade" && (
                <div className="rounded-lg border border-success/30 bg-success/[0.04] p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proration — due today</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Credit for {remainingDays} remaining days on {oldPlan.name}</span>
                      <span className="font-mono text-success">−${credit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{newPlan.name} charge for {remainingDays} days</span>
                      <span className="font-mono text-foreground">+${charge}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2 text-base font-bold">
                      <span className="text-foreground">Total due now</span>
                      <span className={cn("font-mono", netDue > 0 ? "text-foreground" : "text-success")}>${Math.max(0, netDue)}</span>
                    </div>
                  </div>
                </div>
              )}
              {direction === "downgrade" && (
                <div className="rounded-lg border border-warning/30 bg-warning/[0.04] p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scheduled downgrade</p>
                  <p className="text-sm text-muted-foreground">
                    Your current <strong className="text-foreground">{oldPlan.name}</strong> plan stays active until{" "}
                    <strong className="text-foreground">{current.renewsDisplay.split(" (")[0]}</strong>. The downgrade to{" "}
                    <strong className="text-foreground">{newPlan.name}</strong> takes effect at the start of the next billing cycle — no refund is issued.
                  </p>
                </div>
              )}

              {/* Features */}
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What changes</p>
                <ul className="space-y-1.5 text-sm">
                  {newPlan.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={cn("mt-0.5 size-3 flex-shrink-0", PLAN_COLORS[picked].text)} />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          {step === "pick" ? (
            <>
              {current.status !== "cancelled" && current.status !== "cancelling" && (
                <Button
                  variant="ghost"
                  onClick={onCancelPlan}
                  className="mr-auto gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-3.5" /> Cancel Plan
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button
                disabled={picked === current.planTier && cycle === current.billingCycle}
                onClick={() => setStep("confirm")}
                className="gap-1.5"
              >
                Review change <ArrowUpRight className="size-3.5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setStep("pick")}>Back</Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={() => onConfirm(picked, cycle)} className="gap-1.5">
                <Check className="size-3.5" />
                Confirm Change
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Subscription modal ───────────────────────────────────────────────── */

function AddSubscriptionModal({ open, sites, onClose, onConfirm }: {
  open: boolean;
  sites: { id: string; name: string; currentPlan?: string }[];
  onClose: () => void;
  onConfirm: (siteId: string, planTier: PlanTier, cycle: "monthly" | "annual") => void;
}) {
  const firstAvailable = sites.find((s) => !s.currentPlan)?.id ?? "";
  const [siteId, setSiteId] = React.useState<string>(firstAvailable);
  const [planTier, setPlanTier] = React.useState<PlanTier>("professional");
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("annual");

  React.useEffect(() => {
    if (open) { setSiteId(sites.find((s) => !s.currentPlan)?.id ?? ""); setPlanTier("professional"); setCycle("annual"); }
  }, [open, sites]);

  const hasSelectable = sites.some((s) => !s.currentPlan);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Add Subscription</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">Each site requires its own subscription. Pick a site and choose a plan.</p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="h-10 w-full text-base">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id} disabled={!!s.currentPlan}>
                    <span className="flex w-full items-center gap-2">
                      <Building2 className="size-3.5 flex-shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">{s.name}</span>
                      <span className="font-mono text-2xs uppercase text-muted-foreground/70">{s.id}</span>
                      {s.currentPlan && (
                        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground">
                          {s.currentPlan}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!hasSelectable && (
              <p className="mt-1.5 text-2xs text-muted-foreground">Every site already has an active subscription.</p>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-background p-1 text-sm">
            <button onClick={() => setCycle("monthly")}
              className={cn("flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              Monthly
            </button>
            <button onClick={() => setCycle("annual")}
              className={cn("flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              Annual <span className="text-2xs opacity-80">(save ~17%)</span>
            </button>
          </div>
          <div className="space-y-2">
            {TIER_ORDER.map((tier) => {
              const p = PLANS[tier];
              const color = PLAN_COLORS[tier];
              const Icon = PLAN_ICONS[tier];
              const isPicked = tier === planTier;
              const monthly = cycle === "annual" ? Math.round(p.pricePerYear / 12) : p.pricePerMonth;
              return (
                <button key={tier} onClick={() => setPlanTier(tier)}
                  className={cn(
                    "relative flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    isPicked ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40"
                  )}>
                  <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-lg border", color.border, color.bg)}>
                    <Icon className={cn("size-4", color.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-mono text-md font-bold leading-none", color.text)}>${monthly}</p>
                    <p className="text-3xs text-muted-foreground">/mo</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!siteId} onClick={() => onConfirm(siteId, planTier, cycle)} className="gap-1.5">
            <Plus className="size-3.5" /> Activate Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Cancel confirmation modal ────────────────────────────────────────────── */

function CancelSubscriptionModal({ open, sub, onClose, onConfirm }: {
  open: boolean; sub: SiteSubscription | null; onClose: () => void; onConfirm: () => void;
}) {
  if (!sub) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-destructive">Cancel Subscription</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            The subscription for <strong className="text-foreground">{sub.siteName}</strong> will remain active until the end of the billing period ({sub.renewsDisplay.split(" (")[0]}), then become read-only.
          </p>
        </DialogHeader>
        <div className="space-y-3 p-5">
          <div className="rounded-md border border-sev-critical/30 bg-sev-critical/[0.05] p-3 text-sm text-foreground">
            <p className="font-semibold">What happens when cancelled:</p>
            <ul className="mt-1.5 space-y-1 text-muted-foreground">
              <li>• Site dashboard becomes read-only after {sub.renewsDisplay.split(" (")[0]}</li>
              <li>• Recordings retained per current retention until expiry</li>
              <li>• All users assigned to this site lose access</li>
              <li>• You can undo this cancellation at any time before the end date</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Keep Subscription</Button>
          <Button variant="destructive" onClick={onConfirm} className="gap-1.5">
            <X className="size-3.5" /> Schedule Cancellation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Manage Seats modal ───────────────────────────────────────────────────── */

function ManageSeatsModal({ open, sub, onClose, onSave }: {
  open: boolean; sub: SiteSubscription | null; onClose: () => void;
  onSave: (seats: { owner: number; admin: number; user: number }) => void;
}) {
  const [seats, setSeats] = React.useState({ owner: 0, admin: 0, user: 0 });

  React.useEffect(() => {
    if (open && sub) setSeats(sub.seats);
  }, [open, sub]);

  if (!sub) return null;

  const additional =
    Math.max(0, seats.owner - sub.seats.owner) * SEAT_PRICING.owner.pricePerMonth +
    Math.max(0, seats.admin - sub.seats.admin) * SEAT_PRICING.admin.pricePerMonth +
    Math.max(0, seats.user - sub.seats.user) * SEAT_PRICING.user.pricePerMonth;
  const removed =
    Math.max(0, sub.seats.owner - seats.owner) * SEAT_PRICING.owner.pricePerMonth +
    Math.max(0, sub.seats.admin - seats.admin) * SEAT_PRICING.admin.pricePerMonth +
    Math.max(0, sub.seats.user - seats.user) * SEAT_PRICING.user.pricePerMonth;
  const delta = additional - removed;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Manage Seats</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Adjust seat counts for <strong className="text-foreground">{sub.siteName}</strong>. Changes apply on your next invoice.
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {(["owner", "admin", "user"] as const).map((role) => {
            const cfg = ROLE_ICONS[role];
            const Icon = cfg.icon;
            const tier = SEAT_PRICING[role];
            return (
              <div key={role} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-lg border", cfg.bg)}>
                  <Icon className={cn("size-4", cfg.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-foreground">{tier.label}</p>
                  <p className="text-xs text-muted-foreground">${tier.pricePerMonth}/seat · /month</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSeats((s) => ({ ...s, [role]: Math.max(0, s[role] - 1) }))}
                    className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted">−</button>
                  <p className="w-8 text-center font-mono text-lg font-bold text-foreground">{seats[role]}</p>
                  <button onClick={() => setSeats((s) => ({ ...s, [role]: s[role] + 1 }))}
                    className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted">+</button>
                </div>
              </div>
            );
          })}
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly change</span>
              <span className={cn("font-mono font-bold", delta > 0 ? "text-success" : delta < 0 ? "text-warning" : "text-foreground")}>
                {delta > 0 ? `+$${delta}/mo` : delta < 0 ? `-$${Math.abs(delta)}/mo` : "$0/mo"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(seats)} className="gap-1.5">
            <Check className="size-3.5" /> Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
  const subtotal = invoice.amount;
  const taxes = Math.round(subtotal * 0.07);
  const total = subtotal + taxes;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[min(560px,90vw)] flex-col overflow-hidden bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-md font-bold text-foreground">{invoice.periodDisplay} invoice</h3>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
                  <Icon className="size-3" /> {s.label}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Issued {invoice.issuedDisplay}</p>
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
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Issued</p>
              <p className="mt-0.5 text-sm text-foreground">{invoice.issuedDisplay}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
              <p className={cn("mt-0.5 text-sm font-semibold", s.text)}>{s.label}</p>
            </div>
            <div>
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Payment method</p>
              <p className="mt-0.5 text-sm text-foreground">{ORG_LICENSE_INFO.paymentMethod}</p>
            </div>
          </div>

          {invoice.siteNames && invoice.siteNames.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sites billed</p>
              <div className="flex flex-wrap gap-1.5">
                {invoice.siteNames.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-foreground">
                    <Building2 className="size-2.5 text-muted-foreground" /> {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Totals</p>
            <div className="space-y-1.5 rounded-lg border border-border bg-background px-3.5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxes (7%)</span>
                <span className="font-mono text-foreground">${taxes.toLocaleString()}</span>
              </div>
              <div className="mt-1 border-t border-border/60 pt-2">
                <div className="flex items-center justify-between text-md font-bold text-foreground">
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
              {["ISSUED", "INVOICE", "SITES", "STATUS", "AMOUNT", ""].map((h, i) => (
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
                <td colSpan={6} className="px-4 py-10 text-center text-sm italic text-muted-foreground">
                  No invoices match the current filters.
                </td>
              </tr>
            ) : invoices.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => onOpen(inv)}
                className="group cursor-pointer text-base transition-colors hover:bg-muted/20"
              >
                <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">{inv.issuedDisplay}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">{inv.id}</span>
                </td>
                <td className="px-4 py-3">
                  <TruncatedText text={inv.siteNames?.join(" · ") ?? "—"} className="text-sm text-muted-foreground" />
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Invoice filter bar ───────────────────────────────────────────────────── */

type InvoiceStatusFilter = "all" | "paid" | "failed" | "pending";

const ALL_SITES = Array.from(
  new Set(MOCK_INVOICES.flatMap((inv) => inv.siteNames ?? []))
).sort();

function InvoiceFilterBar({ statusFilter, onStatusChange, siteFilter, onSiteChange }: {
  statusFilter: InvoiceStatusFilter;
  onStatusChange: (s: InvoiceStatusFilter) => void;
  siteFilter: string;
  onSiteChange: (s: string) => void;
}) {
  const [siteOpen, setSiteOpen] = React.useState(false);
  const hasFilters = statusFilter !== "all" || siteFilter !== "";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Filter className="size-3.5" /> Filter
      </span>

      {/* Status pills */}
      {(["all", "paid", "failed", "pending"] as InvoiceStatusFilter[]).map((s) => (
        <button key={s} onClick={() => onStatusChange(s)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold transition-colors capitalize",
            statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}>
          {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}

      {/* Site dropdown */}
      <Popover open={siteOpen} onOpenChange={setSiteOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
            siteFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
          )}>
            {siteFilter || "All sites"}
            <ChevronDown className="size-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-52 p-1.5">
          <button onClick={() => { onSiteChange(""); setSiteOpen(false); }}
            className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted/50", !siteFilter && "bg-primary/10 text-primary")}>
            All sites
          </button>
          {ALL_SITES.map((site) => (
            <button key={site} onClick={() => { onSiteChange(site); setSiteOpen(false); }}
              className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-foreground hover:bg-muted/50", siteFilter === site && "bg-primary/10 text-primary")}>
              {site}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Clear all */}
      {hasFilters && (
        <button onClick={() => { onStatusChange("all"); onSiteChange(""); }}
          className="ml-1 text-xs font-semibold text-muted-foreground underline hover:text-primary">
          Clear all
        </button>
      )}

      {/* Active chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
              {statusFilter}
              <button onClick={() => onStatusChange("all")}><X className="size-2.5" /></button>
            </span>
          )}
          {siteFilter && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
              {siteFilter}
              <button onClick={() => onSiteChange("")}><X className="size-2.5" /></button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

type TabKey = "overview" | "subscriptions" | "invoices";

function TabSwitcher({ value, onChange, counts }: {
  value: TabKey;
  onChange: (k: TabKey) => void;
  counts: { subscriptions: number; invoices: number };
}) {
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "subscriptions", label: "Site Subscriptions", count: counts.subscriptions },
    { key: "invoices", label: "Invoices", count: counts.invoices },
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
            {t.count !== undefined && (
              <span className={cn("inline-flex items-center justify-center rounded-full px-1.5 py-px text-2xs font-bold",
                active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function BillingPage() {
  const subs = useSubscriptionsStore((s) => s.subscriptions);
  const changePlanStore = useSubscriptionsStore((s) => s.changePlan);
  const changeCycleStore = useSubscriptionsStore((s) => s.changeBillingCycle);
  const cancelStore = useSubscriptionsStore((s) => s.cancel);
  const reactivateStore = useSubscriptionsStore((s) => s.reactivate);
  const updateSeatsStore = useSubscriptionsStore((s) => s.updateSeats);
  const addStore = useSubscriptionsStore((s) => s.add);
  const sites = useSitesStore((s) => s.sites);

  const [tab, setTab] = React.useState<TabKey>("overview");

  /* ── Multi-card wallet state ──────────────────────────────────────────── */
  const [cards, setCards] = React.useState<SavedCard[]>(INITIAL_CARDS);
  const [addCardOpen, setAddCardOpen] = React.useState(false);

  /* ── Subscription detail drawer ───────────────────────────────────────── */
  const [drawerSub, setDrawerSub] = React.useState<SiteSubscription | null>(null);

  /* ── Modal state ──────────────────────────────────────────────────────── */
  const [changePlanSub, setChangePlanSub] = React.useState<SiteSubscription | null>(null);
  const [cancelSub, setCancelSub] = React.useState<SiteSubscription | null>(null);
  const [seatsSub, setSeatsSub] = React.useState<SiteSubscription | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [activeInvoice, setActiveInvoice] = React.useState<Invoice | null>(null);
  const [retryInvoice, setRetryInvoice] = React.useState<Invoice | null>(null);

  /* ── Invoice filters ──────────────────────────────────────────────────── */
  const [invoiceStatusFilter, setInvoiceStatusFilter] = React.useState<InvoiceStatusFilter>("all");
  const [invoiceSiteFilter, setInvoiceSiteFilter] = React.useState("");

  /* ── Aggregates ───────────────────────────────────────────────────────── */
  const activeSubs = subs.filter((s) => s.status !== "cancelled");
  const totalMonthly = activeSubs.reduce((s, x) => s + x.monthlyCost, 0);
  const totalSeats = activeSubs.reduce((s, x) => s + x.seats.owner + x.seats.admin + x.seats.user, 0);
  const totalUsers = MOCK_USERS.length;
  const totalCameras = Object.values(USAGE_DATA).reduce((s, d) => s + d.usedCameras, 0);
  const totalNvrs = activeSubs.reduce((s, x) => s + (USAGE_DATA[x.id]?.usedNvrs ?? 0), 0);
  const sitesWithoutSub = sites.filter((s) => !subs.some((x) => x.status !== "cancelled" && (x.siteId === s.id || x.siteName === s.name)));

  /* ── Filtered invoices ────────────────────────────────────────────────── */
  const filteredInvoices = React.useMemo(() => {
    return MOCK_INVOICES.filter((inv) => {
      if (invoiceStatusFilter !== "all" && inv.status !== invoiceStatusFilter) return false;
      if (invoiceSiteFilter && !inv.siteNames?.includes(invoiceSiteFilter)) return false;
      return true;
    });
  }, [invoiceStatusFilter, invoiceSiteFilter]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  function confirmChangePlan(planTier: PlanTier, cycle: "monthly" | "annual") {
    if (!changePlanSub) return;
    const direction =
      tierRank(planTier) > tierRank(changePlanSub.planTier) ? "upgrade" :
      tierRank(planTier) < tierRank(changePlanSub.planTier) ? "downgrade" : "kept";
    changePlanStore(changePlanSub.id, planTier);
    if (cycle !== changePlanSub.billingCycle) changeCycleStore(changePlanSub.id, cycle);
    const newPlan = PLANS[planTier];
    setChangePlanSub(null);
    toast.success(
      direction === "upgrade" ? `Upgraded to ${newPlan.name}` :
      direction === "downgrade" ? `Downgraded to ${newPlan.name} (effective at cycle end)` :
      `Updated to ${newPlan.name}`,
      { description: `${changePlanSub.siteName} → ${newPlan.name} (${cycle === "annual" ? "annual" : "monthly"}).` }
    );
  }

  function confirmCancel() {
    if (!cancelSub) return;
    cancelStore(cancelSub.id);
    toast.message("Cancellation scheduled", {
      description: `${cancelSub.siteName} will become read-only after ${cancelSub.renewsDisplay.split(" (")[0]}.`,
    });
    setCancelSub(null);
  }

  function confirmAddSubscription(siteId: string, planTier: PlanTier, cycle: "monthly" | "annual") {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;
    const plan = PLANS[planTier];
    const id = `SUB-2026-${String(subs.length + 1).padStart(3, "0")}`;
    const today = new Date("2026-06-01");
    const renew = new Date(today);
    if (cycle === "annual") renew.setFullYear(renew.getFullYear() + 1);
    else renew.setMonth(renew.getMonth() + 1);
    const startedDisplay = "01 Jun 2026";
    const renewsDisplay = renew.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    addStore({
      id, siteId, siteName: site.name, planTier, status: "active", billingCycle: cycle,
      seats: { owner: 0, admin: 1, user: 2 },
      startedAt: "2026-06-01", startedDisplay,
      renewsAt: renew.toISOString().slice(0, 10), renewsDisplay,
      monthlyCost: plan.pricePerMonth + (0 * 50 + 1 * 25 + 2 * 10),
    });
    setAddOpen(false);
    toast.success(`Subscribed ${site.name} to ${plan.name}`, { description: `Effective immediately. Renews ${renewsDisplay}.` });
  }

  function saveSeats(seats: { owner: number; admin: number; user: number }) {
    if (!seatsSub) return;
    updateSeatsStore(seatsSub.id, seats);
    setSeatsSub(null);
    toast.success(`Seats updated for ${seatsSub.siteName}`, {
      description: `Now ${seats.owner + seats.admin + seats.user} total seats — applied on next invoice.`,
    });
  }

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
            One subscription per site. Manage plans, seats, payment methods, and invoices.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <TabSwitcher value={tab} onChange={setTab} counts={{ subscriptions: activeSubs.length, invoices: MOCK_INVOICES.length }} />
        </PageHeader.Actions>
      </PageHeader>

      {tab === "overview" && (
        <div className="flex flex-col gap-4">
          {/* KPI strip */}
          <KpiGrid cols={4}>
            <KpiCard label="Active Sites" value={activeSubs.length} sub={`${subs.length - activeSubs.length} cancelled`} accent="primary" />
            <KpiCard label="Total Seats" value={totalSeats} sub={`${totalUsers} users active`} accent="info" />
            <KpiCard label="Total Cameras" value={totalCameras} sub="Across all sites" accent="warning" />
            <KpiCard label="Total NVRs" value={totalNvrs} sub="Across all sites" accent="secondary" />
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

            {/* Next Invoice — matches the left column height */}
            <SectionCard
              title="Next Invoice"
              description={`Charges ${ORG_LICENSE_INFO.nextInvoiceDate}.`}
              className="lg:h-full"
              bodyClassName="flex flex-col"
            >
              <div className="space-y-2">
                {activeSubs.map((s) => {
                  const color = PLAN_COLORS[s.planTier];
                  const plan = PLANS[s.planTier];
                  const Icon = PLAN_ICONS[s.planTier];
                  return (
                    <div key={s.id} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("flex size-7 flex-shrink-0 items-center justify-center rounded border", color.border, color.bg)}>
                          <Icon className={cn("size-3.5", color.text)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <TruncatedText text={s.siteName} className="text-sm font-bold text-foreground" />
                          <p className="text-2xs text-muted-foreground">{plan.name} · {s.billingCycle === "annual" ? "Annual" : "Monthly"}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-mono text-base font-bold leading-none", color.text)}>${s.monthlyCost.toLocaleString()}</p>
                          <p className="mt-0.5 text-3xs text-muted-foreground">/month</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-auto flex items-baseline justify-between border-t border-border pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="font-mono text-2xl font-bold text-success">${totalMonthly.toLocaleString()}</span>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-md font-bold text-foreground">Site Subscriptions</h2>
            <Button onClick={() => setAddOpen(true)} className="gap-1.5">
              <Plus className="size-3.5" /> Add Subscription
            </Button>
          </div>

          {subs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
              <Building2 className="size-8 opacity-30" />
              <p className="text-base">No active subscriptions.</p>
              <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                <Plus className="size-3.5" /> Subscribe a site
              </Button>
            </div>
          ) : (
            <>
              <SiteSubscriptionsTable subs={subs} onOpen={setDrawerSub} />
              {sitesWithoutSub.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {sitesWithoutSub.length} site{sitesWithoutSub.length === 1 ? "" : "s"} not yet subscribed —{" "}
                  <button onClick={() => setAddOpen(true)} className="text-primary underline hover:text-primary/80">add a subscription</button>
                </p>
              )}
            </>
          )}
        </div>
      )}

      {tab === "invoices" && (
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <h2 className="text-md font-bold text-foreground">Invoices</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Past invoices across all sites and subscriptions. Select a row for full details.</p>
          </div>
          <InvoiceFilterBar
            statusFilter={invoiceStatusFilter}
            onStatusChange={setInvoiceStatusFilter}
            siteFilter={invoiceSiteFilter}
            onSiteChange={setInvoiceSiteFilter}
          />
          <InvoicesTable invoices={filteredInvoices} onOpen={setActiveInvoice} onRetry={setRetryInvoice} />
        </div>
      )}

      {/* Modals */}
      <ChangePlanModal
        open={changePlanSub !== null}
        current={changePlanSub}
        onClose={() => setChangePlanSub(null)}
        onConfirm={confirmChangePlan}
        onCancelPlan={() => { setCancelSub(changePlanSub); setChangePlanSub(null); }}
      />
      <CancelSubscriptionModal open={cancelSub !== null} sub={cancelSub} onClose={() => setCancelSub(null)} onConfirm={confirmCancel} />
      <ManageSeatsModal open={seatsSub !== null} sub={seatsSub} onClose={() => setSeatsSub(null)} onSave={saveSeats} />
      <AddSubscriptionModal
        open={addOpen}
        sites={sites.map((s) => {
          const active = subs.find((x) => x.status !== "cancelled" && (x.siteId === s.id || x.siteName === s.name));
          return { id: s.id, name: s.name, currentPlan: active ? PLANS[active.planTier].name : undefined };
        })}
        onClose={() => setAddOpen(false)}
        onConfirm={confirmAddSubscription}
      />
      <AddCardModal open={addCardOpen} onClose={() => setAddCardOpen(false)} onSave={addCard} />
      <SubscriptionDrawer
        sub={drawerSub}
        open={drawerSub !== null}
        onClose={() => setDrawerSub(null)}
        onChangePlan={() => { if (drawerSub) setChangePlanSub(drawerSub); setDrawerSub(null); }}
        onManageSeats={() => { if (drawerSub) setSeatsSub(drawerSub); setDrawerSub(null); }}
        onCancel={() => { if (drawerSub) setCancelSub(drawerSub); setDrawerSub(null); }}
        onReactivate={() => { if (drawerSub) reactivateStore(drawerSub.id); setDrawerSub(null); }}
      />
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
