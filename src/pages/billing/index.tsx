import * as React from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Crown,
  ShieldCheck,
  CircleUser,
  Plus,
  ArrowUpRight,
  ChevronDown,
  X,
  FileText,
  Building2,
  Sparkles,
  Zap,
  Rocket,
  Check,
  ArrowUp,
  ArrowDown,
  MapPin,
  Hash,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { MOCK_USERS } from "@/mocks/users";
import {
  PLANS,
  MOCK_INVOICES,
  ORG_LICENSE_INFO,
  SEAT_PRICING,
  type Invoice,
  type PlanTier,
  type SiteSubscription,
} from "@/mocks/licenses";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { UserRole } from "@/types/users";

/* ── Helpers ──────────────────────────────────────────────────────────── */

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
  starter: {
    bg: "bg-info/10",
    border: "border-info/40",
    text: "text-info",
    chip: "bg-info/15 text-info",
  },
  professional: {
    bg: "bg-secondary/10",
    border: "border-secondary/40",
    text: "text-secondary",
    chip: "bg-secondary/15 text-secondary",
  },
  enterprise: {
    bg: "bg-success/10",
    border: "border-success/40",
    text: "text-success",
    chip: "bg-success/15 text-success",
  },
};

const STATUS_STYLES = {
  active:    { bg: "bg-success/15",      text: "text-success",      icon: CheckCircle2, label: "Active"   },
  trial:     { bg: "bg-info/15",         text: "text-info",         icon: Sparkles,     label: "Trial"    },
  "past-due":{ bg: "bg-warning/15",      text: "text-warning",      icon: Clock,        label: "Past Due" },
  cancelled: { bg: "bg-muted",           text: "text-muted-foreground", icon: X,        label: "Cancelled" },
};

const INVOICE_STATUS = {
  paid:    { bg: "bg-success/15 border-success/30",            text: "text-success",      icon: CheckCircle2, label: "Paid"    },
  pending: { bg: "bg-warning/15 border-warning/30",            text: "text-warning",      icon: Clock,        label: "Pending" },
  failed:  { bg: "bg-sev-critical/15 border-sev-critical/30",  text: "text-sev-critical", icon: AlertCircle,  label: "Failed"  },
};

const TIER_ORDER: PlanTier[] = ["starter", "professional", "enterprise"];

function tierRank(t: PlanTier): number {
  return TIER_ORDER.indexOf(t);
}

/* ── Section card ─────────────────────────────────────────────────────── */

function SectionCard({ title, description, action, children }: {
  title: string; description?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

/* ── KPI summary tile ─────────────────────────────────────────────────── */

function KpiTile({ label, value, sub, txt }: { label: string; value: React.ReactNode; sub: string; txt: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-[22px] font-bold leading-none", txt)}>{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

/* ── Site Subscription Card ───────────────────────────────────────────── */

function SubscriptionCard({
  sub, onChangePlan, onCancel, onManageSeats,
}: {
  sub: SiteSubscription;
  onChangePlan: () => void;
  onCancel: () => void;
  onManageSeats: () => void;
}) {
  const plan = PLANS[sub.planTier];
  const color = PLAN_COLORS[sub.planTier];
  const status = STATUS_STYLES[sub.status];
  const PlanIcon = PLAN_ICONS[sub.planTier];
  const totalSeats = sub.seats.owner + sub.seats.admin + sub.seats.user;
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", sub.status === "cancelled" ? "opacity-60" : "")}>
      <div className={cn("border-b px-4 py-3", color.bg, color.border)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-lg border", color.border, "bg-background")}>
              <PlanIcon className={cn("size-4", color.text)} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[14px] font-bold text-foreground">{sub.siteName}</p>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", status.bg, status.text)}>
                  <status.icon className="size-2.5" />
                  {status.label}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                <span className={cn("font-semibold", color.text)}>{plan.name}</span> · {sub.billingCycle === "annual" ? "Annual billing" : "Monthly billing"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("font-mono text-[16px] font-bold leading-none", color.text)}>${sub.monthlyCost.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">/month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-border bg-background/40 px-4 py-2.5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Cameras</p>
          <p className="text-[13px] font-bold text-foreground">
            {typeof plan.cameraLimit === "number" ? `Up to ${plan.cameraLimit}` : "Unlimited"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Users</p>
          <p className="text-[13px] font-bold text-foreground">
            {totalSeats}
            {typeof plan.userLimit === "number" ? <span className="text-muted-foreground"> / {plan.userLimit}</span> : null}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Renews</p>
          <p className="text-[13px] font-bold text-foreground">{sub.renewsDisplay.split(" (")[0]}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-wrap gap-1 text-[10px]">
          {sub.seats.owner > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-success">
              <Crown className="size-2.5" /> {sub.seats.owner}
            </span>
          )}
          {sub.seats.admin > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info/15 px-1.5 py-0.5 text-info">
              <ShieldCheck className="size-2.5" /> {sub.seats.admin}
            </span>
          )}
          {sub.seats.user > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-1.5 py-0.5 text-secondary">
              <CircleUser className="size-2.5" /> {sub.seats.user}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="text-[11px]" onClick={onManageSeats}>
            Seats
          </Button>
          {sub.status === "cancelled" ? (
            <Button size="sm" className="text-[11px]" onClick={onChangePlan}>
              Reactivate
            </Button>
          ) : (
            <Button size="sm" className="gap-1 text-[11px]" onClick={onChangePlan}>
              <ArrowUp className="size-3" />
              Change Plan
            </Button>
          )}
          {sub.status !== "cancelled" && (
            <button onClick={onCancel}
              className="ml-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-sev-critical"
              title="Cancel subscription">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Change Plan modal ────────────────────────────────────────────────── */

function ChangePlanModal({ open, current, onClose, onConfirm }: {
  open: boolean;
  current: SiteSubscription | null;
  onClose: () => void;
  onConfirm: (planTier: PlanTier, cycle: "monthly" | "annual") => void;
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
  const oldCost = oldPlan.pricePerMonth;
  const newCost = newPlan.pricePerMonth;
  const delta = newCost - oldCost;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {step === "pick" ? "Change Plan" : "Confirm Plan Change"}
          </DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {step === "pick"
              ? <>Choose a new plan for <strong className="text-foreground">{current.siteName}</strong>. The change applies on your next invoice.</>
              : <>Review the changes before applying them to <strong className="text-foreground">{current.siteName}</strong>.</>
            }
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {step === "pick" ? (
            <>
              {/* Billing cycle toggle */}
              <div className="mb-4 flex items-center justify-center gap-2 rounded-full border border-border bg-background p-1 text-[12px]">
                <button onClick={() => setCycle("monthly")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                    cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                  Monthly
                </button>
                <button onClick={() => setCycle("annual")}
                  className={cn(
                    "flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                    cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>
                  Annual <span className="text-[10px] opacity-80">(save ~17%)</span>
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
                        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
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
                          <p className="text-[14px] font-bold text-foreground">{p.name}</p>
                          {isCurrent && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Current</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{p.tagline}</p>
                        <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {typeof p.cameraLimit === "number" ? `${p.cameraLimit} cameras` : "Unlimited cameras"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {typeof p.userLimit === "number" ? `${p.userLimit} users` : "Unlimited users"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {p.retentionDays}d retention
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-mono text-[16px] font-bold leading-none", color.text)}>${monthly}</p>
                        <p className="mt-0.5 text-[9px] text-muted-foreground">/mo /site</p>
                        {cycle === "annual" && (
                          <p className="mt-0.5 text-[9px] text-success">${p.pricePerYear.toLocaleString()}/yr</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Confirm step */
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan change</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-md border border-border bg-card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Current</p>
                    <p className="mt-1 text-[16px] font-bold text-foreground">{oldPlan.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">${oldCost}/mo</p>
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
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">New</p>
                    <p className={cn("mt-1 text-[16px] font-bold", PLAN_COLORS[picked].text)}>{newPlan.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">${newCost}/mo</p>
                  </div>
                </div>
                {delta !== 0 && (
                  <p className="mt-3 text-[12px] text-foreground">
                    <strong>{delta > 0 ? `+$${delta}` : `-$${Math.abs(delta)}`}/mo</strong>{" "}
                    {direction === "upgrade"
                      ? "added to your next invoice. Pro-rated for the current period."
                      : "credited against your next invoice."
                    }
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-background p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What changes</p>
                <ul className="space-y-1.5 text-[12px]">
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

        <div className="flex flex-shrink-0 items-center gap-2 border-t border-border px-5 py-3.5">
          {step === "pick" ? (
            <>
              <Button
                disabled={picked === current.planTier && cycle === current.billingCycle}
                onClick={() => setStep("confirm")}
                className="gap-1.5"
              >
                Review change
                <ArrowUpRight className="size-3.5" />
              </Button>
              <Button variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
            </>
          ) : (
            <>
              <Button onClick={() => onConfirm(picked, cycle)} className="gap-1.5">
                <Check className="size-3.5" />
                Confirm Change
              </Button>
              <Button variant="ghost" onClick={() => setStep("pick")}>Back</Button>
              <Button variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add Subscription modal (for sites without one) ───────────────────── */

function AddSubscriptionModal({ open, sites, onClose, onConfirm }: {
  open: boolean;
  sites: { id: string; name: string }[];
  onClose: () => void;
  onConfirm: (siteId: string, planTier: PlanTier, cycle: "monthly" | "annual") => void;
}) {
  const [siteId, setSiteId] = React.useState<string>(sites[0]?.id ?? "");
  const [planTier, setPlanTier] = React.useState<PlanTier>("professional");
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("annual");

  React.useEffect(() => {
    if (open) {
      setSiteId(sites[0]?.id ?? "");
      setPlanTier("professional");
      setCycle("annual");
    }
  }, [open, sites]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Add Subscription</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Each site requires its own subscription. Pick a site and choose a plan.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Site</label>
            {sites.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-[12px] text-muted-foreground">
                All sites already have a subscription.
              </div>
            ) : (
              <div className="space-y-1.5">
                {sites.map((s) => (
                  <button key={s.id} onClick={() => setSiteId(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-[13px] transition-colors",
                      siteId === s.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}>
                    <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                      siteId === s.id ? "border-primary" : "border-muted-foreground/40")}>
                      {siteId === s.id && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <Building2 className="size-3.5 text-muted-foreground" />
                    <span className="text-foreground">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 rounded-full border border-border bg-background p-1 text-[12px]">
            <button onClick={() => setCycle("monthly")}
              className={cn("flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                cycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              Monthly
            </button>
            <button onClick={() => setCycle("annual")}
              className={cn("flex-1 rounded-full px-3 py-1 font-semibold transition-colors",
                cycle === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              Annual <span className="text-[10px] opacity-80">(save ~17%)</span>
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
                    <p className="text-[13px] font-bold text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-mono text-[14px] font-bold leading-none", color.text)}>${monthly}</p>
                    <p className="text-[9px] text-muted-foreground">/mo</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 border-t border-border px-5 py-3.5">
          <Button
            disabled={!siteId}
            onClick={() => onConfirm(siteId, planTier, cycle)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" />
            Activate Subscription
          </Button>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Cancel confirmation modal ────────────────────────────────────────── */

function CancelSubscriptionModal({ open, sub, onClose, onConfirm }: {
  open: boolean;
  sub: SiteSubscription | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!sub) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-sev-critical">Cancel Subscription</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            The subscription for <strong className="text-foreground">{sub.siteName}</strong> will be cancelled at the end of the billing period ({sub.renewsDisplay}).
          </p>
        </DialogHeader>
        <div className="space-y-3 p-5">
          <div className="rounded-md border border-sev-critical/30 bg-sev-critical/[0.05] p-3 text-[12px] text-foreground">
            <p className="font-semibold">What happens when this is cancelled:</p>
            <ul className="mt-1.5 space-y-1 text-muted-foreground">
              <li>• Site dashboard becomes read-only after {sub.renewsDisplay}</li>
              <li>• Recordings retained per current retention until expiry</li>
              <li>• All users assigned to this site lose access</li>
              <li>• You can reactivate within 90 days without losing data</li>
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Keep Subscription</Button>
          <Button onClick={onConfirm}
            className="ml-auto gap-1.5 bg-sev-critical text-white hover:bg-sev-critical/90">
            <X className="size-3.5" />
            Cancel Subscription
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Manage Seats modal (per subscription) ─────────────────────────────── */

function ManageSeatsModal({ open, sub, onClose, onSave }: {
  open: boolean;
  sub: SiteSubscription | null;
  onClose: () => void;
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
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Manage Seats</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
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
                  <p className="text-[13px] font-bold text-foreground">{tier.label}</p>
                  <p className="text-[11px] text-muted-foreground">${tier.pricePerMonth}/seat · /month</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSeats((s) => ({ ...s, [role]: Math.max(0, s[role] - 1) }))}
                    className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted">
                    −
                  </button>
                  <p className="w-8 text-center font-mono text-[16px] font-bold text-foreground">{seats[role]}</p>
                  <button onClick={() => setSeats((s) => ({ ...s, [role]: s[role] + 1 }))}
                    className="flex size-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted">
                    +
                  </button>
                </div>
              </div>
            );
          })}
          <div className="rounded-md border border-border bg-muted/40 p-3 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly change</span>
              <span className={cn("font-mono font-bold", delta > 0 ? "text-success" : delta < 0 ? "text-warning" : "text-foreground")}>
                {delta > 0 ? `+$${delta}/mo` : delta < 0 ? `-$${Math.abs(delta)}/mo` : "$0/mo"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 border-t border-border px-5 py-3.5">
          <Button onClick={() => onSave(seats)} className="gap-1.5">
            <Check className="size-3.5" />
            Apply Changes
          </Button>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Update payment method modal ──────────────────────────────────────── */

function UpdatePaymentModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (last4: string, expiry: string) => void }) {
  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");

  React.useEffect(() => {
    if (open) { setCardName(""); setCardNumber(""); setExpiry(""); setCvc(""); }
  }, [open]);

  const cleaned = cardNumber.replace(/\s/g, "");
  const last4 = cleaned.slice(-4);
  const canSubmit = cleaned.length >= 13 && /^\d{2}\/\d{2}$/.test(expiry) && cvc.length >= 3 && cardName.trim().length > 0;

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Update Payment Method</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Card details are encrypted and processed by our payment provider — never stored here.
          </p>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name on Card</label>
            <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Delbin Arkar" className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Card Number</label>
            <Input value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="1234 5678 9012 3456" className="h-9 font-mono text-[13px]" inputMode="numeric" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expiry</label>
              <Input value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" className="h-9 font-mono text-[13px]" inputMode="numeric" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CVC</label>
              <Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" className="h-9 font-mono text-[13px]" inputMode="numeric" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
          <Button disabled={!canSubmit} onClick={() => onSave(last4, expiry)} className="gap-1.5">
            <CreditCard className="size-3.5" />
            Save Payment Method
          </Button>
          <Button variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Invoice detail drawer ────────────────────────────────────────────── */

function InvoiceDetailDrawer({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
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
                <h3 className="text-[15px] font-bold text-foreground">{invoice.periodDisplay} invoice</h3>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
                  <Icon className="size-3" />
                  {s.label}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Issued {invoice.issuedDisplay}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Invoice number</p>
              <p className="mt-0.5 font-mono text-[12px] text-primary">{invoice.id}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Issued</p>
              <p className="mt-0.5 text-[12px] text-foreground">{invoice.issuedDisplay}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Status</p>
              <p className={cn("mt-0.5 text-[12px] font-semibold", s.text)}>{s.label}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Payment method</p>
              <p className="mt-0.5 text-[12px] text-foreground">{ORG_LICENSE_INFO.paymentMethod}</p>
            </div>
          </div>

          {invoice.siteNames && invoice.siteNames.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Sites billed</p>
              <div className="flex flex-wrap gap-1.5">
                {invoice.siteNames.map((n) => (
                  <span key={n} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-foreground">
                    <Building2 className="size-2.5 text-muted-foreground" />
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Totals</p>
            <div className="space-y-1.5 rounded-lg border border-border bg-background px-3.5 py-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Taxes (7%)</span>
                <span className="font-mono text-foreground">${taxes.toLocaleString()}</span>
              </div>
              <div className="mt-1 border-t border-border/60 pt-2">
                <div className="flex items-center justify-between text-[14px] font-bold text-foreground">
                  <span>Total</span>
                  <span className="font-mono">${total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3.5">
          <Button className="w-full gap-1.5">
            <Download className="size-3.5" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Tabs ─────────────────────────────────────────────────────────────── */

type TabKey = "overview" | "invoices";

function TabSwitcher({ value, onChange, counts }: { value: TabKey; onChange: (k: TabKey) => void; counts: { invoices: number } }) {
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "invoices", label: "Invoices", count: counts.invoices },
  ];
  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative inline-flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={cn("inline-flex items-center justify-center rounded-full px-1.5 py-px text-[10px] font-bold",
                active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function BillingPage() {
  const navigate = useNavigate();
  const subs = useSubscriptionsStore((s) => s.subscriptions);
  const changePlanStore = useSubscriptionsStore((s) => s.changePlan);
  const changeCycleStore = useSubscriptionsStore((s) => s.changeBillingCycle);
  const cancelStore = useSubscriptionsStore((s) => s.cancel);
  const reactivateStore = useSubscriptionsStore((s) => s.reactivate);
  const updateSeatsStore = useSubscriptionsStore((s) => s.updateSeats);
  const addStore = useSubscriptionsStore((s) => s.add);
  const sites = useSitesStore((s) => s.sites);

  const [tab, setTab] = React.useState<TabKey>("overview");
  const [paymentMethod, setPaymentMethod] = React.useState(ORG_LICENSE_INFO.paymentMethod);
  const [paymentExpiry, setPaymentExpiry] = React.useState("12/2028");
  const [paymentOpen, setPaymentOpen] = React.useState(false);

  const [changePlanSub, setChangePlanSub] = React.useState<SiteSubscription | null>(null);
  const [cancelSub, setCancelSub] = React.useState<SiteSubscription | null>(null);
  const [seatsSub, setSeatsSub] = React.useState<SiteSubscription | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [activeInvoice, setActiveInvoice] = React.useState<Invoice | null>(null);

  /* ── Aggregates ─────────────────────────────────────────────────── */
  const activeSubs = subs.filter((s) => s.status !== "cancelled");
  const totalMonthly = activeSubs.reduce((s, x) => s + x.monthlyCost, 0);
  const totalSeats = activeSubs.reduce((s, x) => s + x.seats.owner + x.seats.admin + x.seats.user, 0);
  const totalUsers = MOCK_USERS.length;
  const sitesWithoutSub = sites.filter((s) => !subs.some((x) => x.siteId === s.id && x.status !== "cancelled"));

  /* ── Handlers ───────────────────────────────────────────────────── */
  function confirmChangePlan(planTier: PlanTier, cycle: "monthly" | "annual") {
    if (!changePlanSub) return;
    const direction =
      tierRank(planTier) > tierRank(changePlanSub.planTier) ? "upgrade" :
      tierRank(planTier) < tierRank(changePlanSub.planTier) ? "downgrade" : "kept";
    changePlanStore(changePlanSub.id, planTier);
    if (cycle !== changePlanSub.billingCycle) {
      changeCycleStore(changePlanSub.id, cycle);
    }
    const newPlan = PLANS[planTier];
    setChangePlanSub(null);
    toast.success(
      direction === "upgrade" ? `Upgraded to ${newPlan.name}` :
      direction === "downgrade" ? `Downgraded to ${newPlan.name}` :
      `Updated to ${newPlan.name}`,
      { description: `${changePlanSub.siteName} → ${newPlan.name} (${cycle === "annual" ? "annual" : "monthly"}). Pro-rated on next invoice.` }
    );
  }

  function confirmCancel() {
    if (!cancelSub) return;
    cancelStore(cancelSub.id);
    toast.message("Subscription cancelled", {
      description: `${cancelSub.siteName} will become read-only after ${cancelSub.renewsDisplay}.`,
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
      id,
      siteId,
      siteName: site.name,
      planTier,
      status: "active",
      billingCycle: cycle,
      seats: { owner: 0, admin: 1, user: 2 },
      startedAt: "2026-06-01",
      startedDisplay,
      renewsAt: renew.toISOString().slice(0, 10),
      renewsDisplay,
      monthlyCost: plan.pricePerMonth + (0 * 50 + 1 * 25 + 2 * 10),
    });
    setAddOpen(false);
    toast.success(`Subscribed ${site.name} to ${plan.name}`, {
      description: `Effective immediately. Renews ${renewsDisplay}.`,
    });
  }

  function saveSeats(seats: { owner: number; admin: number; user: number }) {
    if (!seatsSub) return;
    updateSeatsStore(seatsSub.id, seats);
    setSeatsSub(null);
    toast.success(`Seats updated for ${seatsSub.siteName}`, {
      description: `Now ${seats.owner + seats.admin + seats.user} total seats — applied on next invoice.`,
    });
  }

  function savePaymentMethod(last4: string, expiry: string) {
    setPaymentMethod(`Visa ending ${last4}`);
    setPaymentExpiry(`${expiry.split("/")[0]}/20${expiry.split("/")[1]}`);
    setPaymentOpen(false);
    toast.success("Payment method updated", { description: `Future invoices will be charged to Visa ending ${last4}.` });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Billing & License</PageHeader.Title>
          <PageHeader.Description>
            One subscription per site. Manage plans, seats, payment method, and invoices.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <TabSwitcher value={tab} onChange={setTab} counts={{ invoices: MOCK_INVOICES.length }} />

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-4">
            {/* Workspace summary */}
            <SectionCard title="Workspace summary" description="Aggregated across all active site subscriptions.">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiTile label="Active Subs" value={activeSubs.length} sub={`${subs.length - activeSubs.length} cancelled`} txt="text-foreground" />
                <KpiTile label="Sites Covered" value={`${activeSubs.length}`} sub={`of ${sites.length} sites`} txt="text-foreground" />
                <KpiTile label="Monthly Spend" value={`$${totalMonthly.toLocaleString()}`} sub="Recurring" txt="text-success" />
                <KpiTile label="Total Seats" value={totalSeats} sub={`${totalUsers} users`} txt="text-info" />
              </div>
            </SectionCard>

            {/* Subscriptions per site */}
            <SectionCard
              title="Site Subscriptions"
              description="Each site has its own plan and renewal."
              action={
                <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                  <Plus className="size-3.5" />
                  Add Subscription
                </Button>
              }
            >
              {subs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
                  <Building2 className="size-8 opacity-30" />
                  <p className="text-[13px]">No active subscriptions.</p>
                  <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Subscribe a site
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {subs.map((s) => (
                    <SubscriptionCard
                      key={s.id}
                      sub={s}
                      onChangePlan={() => (s.status === "cancelled" ? reactivateStore(s.id) : setChangePlanSub(s))}
                      onCancel={() => setCancelSub(s)}
                      onManageSeats={() => setSeatsSub(s)}
                    />
                  ))}

                  {sitesWithoutSub.map((s) => (
                    <button key={s.id} onClick={() => setAddOpen(true)}
                      className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-4 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Plus className="size-4" />
                      </div>
                      <p className="text-[13px] font-semibold">{s.name}</p>
                      <p className="text-[11px]">No subscription · click to add</p>
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Compare plans */}
            <SectionCard
              title="Compare Plans"
              description="Choose the right tier for each site."
              action={
                <a href="https://accel.ai/pricing" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground underline hover:text-primary">
                  Full pricing <ArrowUpRight className="size-3" />
                </a>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {TIER_ORDER.map((tier) => {
                  const p = PLANS[tier];
                  const color = PLAN_COLORS[tier];
                  const Icon = PLAN_ICONS[tier];
                  return (
                    <div key={tier} className={cn("relative overflow-hidden rounded-xl border bg-background p-4", color.border, p.highlight && "ring-1 ring-secondary")}>
                      {p.highlight && (
                        <span className="absolute -top-2 right-3 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          <Sparkles className="size-2.5" /> Most popular
                        </span>
                      )}
                      <div className={cn("mb-2 flex size-9 items-center justify-center rounded-lg border", color.bg, color.border)}>
                        <Icon className={cn("size-4", color.text)} />
                      </div>
                      <p className="text-[14px] font-bold text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.tagline}</p>
                      <div className="my-3 flex items-baseline gap-1">
                        <span className={cn("font-mono text-[22px] font-bold leading-none", color.text)}>${p.pricePerMonth}</span>
                        <span className="text-[10px] text-muted-foreground">/site /mo</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px]">
                        {p.features.slice(0, 5).map((f) => (
                          <li key={f} className="flex items-start gap-1.5">
                            <Check className={cn("mt-0.5 size-3 flex-shrink-0", color.text)} />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <SectionCard title="Payment Method" description="Used for all charges on this account.">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
                  <CreditCard className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-foreground">{paymentMethod}</p>
                  <p className="text-[11px] text-muted-foreground">Expires {paymentExpiry} · Default for invoicing</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setPaymentOpen(true)}>
                  Update
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Next Invoice" description="Combined across all active sites.">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estimated total</span>
                  <span className="font-mono text-[22px] font-bold text-success">${totalMonthly.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Charges {ORG_LICENSE_INFO.nextInvoiceDate}</p>
              </div>
              <div className="mt-3 space-y-1.5">
                {activeSubs.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded border border-border/60 bg-background/50 px-2.5 py-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", PLAN_COLORS[s.planTier].text.replace("text-", "bg-"))} />
                      {s.siteName}
                    </span>
                    <span className="font-mono font-semibold text-foreground">${s.monthlyCost.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Quick Actions">
              <div className="space-y-1.5">
                <button onClick={() => setAddOpen(true)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-[12px] transition-colors hover:border-primary/40">
                  <Plus className="size-4 text-secondary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Add subscription</p>
                    <p className="text-[10px] text-muted-foreground">Subscribe a new site</p>
                  </div>
                </button>
                <button onClick={() => navigate("/site/overview")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-[12px] transition-colors hover:border-primary/40">
                  <MapPin className="size-4 text-info" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Manage sites</p>
                    <p className="text-[10px] text-muted-foreground">{sites.length} site{sites.length === 1 ? "" : "s"} total</p>
                  </div>
                </button>
                <button onClick={() => setTab("invoices")}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-[12px] transition-colors hover:border-primary/40">
                  <Hash className="size-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">View invoices</p>
                    <p className="text-[10px] text-muted-foreground">{MOCK_INVOICES.length} total</p>
                  </div>
                </button>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {tab === "invoices" && (
        <SectionCard title="Invoices" description="Past invoices across all sites and subscriptions.">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <div className="grid grid-cols-[140px_120px_1fr_120px_auto] gap-3 border-b border-border bg-muted/30 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <p>Issued</p>
              <p>Invoice</p>
              <p>Sites</p>
              <p>Status</p>
              <p className="text-right">Amount</p>
            </div>
            {MOCK_INVOICES.map((inv) => {
              const s = INVOICE_STATUS[inv.status];
              return (
                <button key={inv.id} onClick={() => setActiveInvoice(inv)}
                  className="grid w-full grid-cols-[140px_120px_1fr_120px_auto] items-center gap-3 border-b border-border/60 px-4 py-3 text-left text-[12px] last:border-b-0 hover:bg-muted/20">
                  <p className="text-foreground">{inv.issuedDisplay}</p>
                  <p className="font-mono text-primary">{inv.id}</p>
                  <p className="truncate text-muted-foreground">{inv.siteNames?.join(" · ") ?? "—"}</p>
                  <span className={cn("inline-flex w-fit items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
                    <s.icon className="size-2.5" />
                    {s.label}
                  </span>
                  <p className="text-right font-mono font-bold text-foreground">${inv.amount.toLocaleString()}</p>
                </button>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Modals */}
      <ChangePlanModal
        open={changePlanSub !== null}
        current={changePlanSub}
        onClose={() => setChangePlanSub(null)}
        onConfirm={confirmChangePlan}
      />
      <CancelSubscriptionModal
        open={cancelSub !== null}
        sub={cancelSub}
        onClose={() => setCancelSub(null)}
        onConfirm={confirmCancel}
      />
      <ManageSeatsModal
        open={seatsSub !== null}
        sub={seatsSub}
        onClose={() => setSeatsSub(null)}
        onSave={saveSeats}
      />
      <AddSubscriptionModal
        open={addOpen}
        sites={sitesWithoutSub.map((s) => ({ id: s.id, name: s.name }))}
        onClose={() => setAddOpen(false)}
        onConfirm={confirmAddSubscription}
      />
      <UpdatePaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSave={savePaymentMethod} />
      <InvoiceDetailDrawer invoice={activeInvoice} onClose={() => setActiveInvoice(null)} />

      {/* unused silencer */}
      <span className="hidden"><ChevronDown /><CalendarClock /></span>
    </div>
  );
}
