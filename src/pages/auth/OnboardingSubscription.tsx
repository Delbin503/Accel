import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, Zap, Rocket, CreditCard, Lock,
  AlertCircle, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "./AuthLayout";
import { OnboardingProgress } from "./OnboardingProgress";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";
import { PLANS, type PlanTier } from "@/mocks/licenses";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<PlanTier, React.ElementType> = {
  starter: Sparkles,
  professional: Zap,
  enterprise: Rocket,
};

const PLAN_COLORS: Record<PlanTier, { bg: string; border: string; text: string }> = {
  starter:       { bg: "bg-info/10",      border: "border-info/40",      text: "text-info" },
  professional:  { bg: "bg-secondary/10", border: "border-secondary/40", text: "text-secondary" },
  enterprise:    { bg: "bg-success/10",   border: "border-success/40",   text: "text-success" },
};

const TIER_ORDER: PlanTier[] = ["starter", "professional", "enterprise"];

export default function OnboardingSubscriptionPage({
  initialStep = "pick",
}: {
  initialStep?: "pick" | "payment";
} = {}) {
  const navigate = useNavigate();
  const setHasActiveSubscription = useAuthStore((s) => s.setHasActiveSubscription);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const sites = useSitesStore((s) => s.sites);
  const subs = useSubscriptionsStore((s) => s.subscriptions);
  const addSub = useSubscriptionsStore((s) => s.add);

  // Find the most-recently created site that doesn't yet have a subscription
  const targetSite = React.useMemo(() => {
    const subSiteIds = new Set(subs.filter((s) => s.status !== "cancelled").map((s) => s.siteId));
    const candidate = [...sites].reverse().find((s) => !subSiteIds.has(s.id));
    return candidate ?? sites[sites.length - 1] ?? null;
  }, [sites, subs]);

  const [picked, setPicked] = React.useState<PlanTier>("professional");
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("annual");
  const [step, setStep] = React.useState<"pick" | "payment">(initialStep);
  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{
    cardName?: string;
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  if (!targetSite) {
    return (
      <AuthLayout>
        <div className="rounded-xl border border-warning/30 bg-warning/[0.05] p-6 text-center">
          <AlertCircle className="mx-auto mb-3 size-6 text-warning" />
          <h1 className="text-xl font-bold text-foreground">No site found</h1>
          <p className="mt-1 text-base text-muted-foreground">
            You need to create a site before choosing a subscription.
          </p>
          <Button className="mt-4 gap-1.5" onClick={() => navigate("/onboarding/site")}>
            <ArrowLeft className="size-3.5" />
            Back to site setup
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const plan = PLANS[picked];
  const monthlyDisplay = cycle === "annual" ? Math.round(plan.pricePerYear / 12) : plan.pricePerMonth;
  const billed = cycle === "annual" ? plan.pricePerYear : plan.pricePerMonth;

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function activate() {
    setError(null);
    const cleaned = cardNumber.replace(/\s/g, "");
    const nextErrors: typeof errors = {};
    if (cardName.trim().length === 0) nextErrors.cardName = "Name on card is required.";
    if (cleaned.length < 13) nextErrors.cardNumber = "Enter a valid card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) nextErrors.expiry = "Enter a valid expiry (MM/YY).";
    if (cvc.length < 3) nextErrors.cvc = "Enter a valid CVC.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      const id = `SUB-2026-${String(subs.length + 1).padStart(3, "0")}`;
      const today = new Date("2026-06-01");
      const renew = new Date(today);
      if (cycle === "annual") renew.setFullYear(renew.getFullYear() + 1);
      else renew.setMonth(renew.getMonth() + 1);
      const renewsDisplay = renew.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      addSub({
        id,
        siteId: targetSite.id,
        siteName: targetSite.name,
        planTier: picked,
        status: "active",
        billingCycle: cycle,
        seats: { owner: 1, admin: 0, user: 0 },
        startedAt: "2026-06-01",
        startedDisplay: "01 Jun 2026",
        renewsAt: renew.toISOString().slice(0, 10),
        renewsDisplay,
        monthlyCost: plan.pricePerMonth + (1 * 50),
      });
      setHasActiveSubscription(true);
      completeOnboarding();
      toast.success(`Welcome to ${plan.name}!`, {
        description: `Your ${targetSite.name} subscription is active. Renews ${renewsDisplay}.`,
      });
      navigate("/", { replace: true });
    }, 600);
  }

  return (
    <AuthLayout
      brandSlot={
        <>
          <h2 className="text-4xl font-bold leading-tight text-foreground">
            One subscription per site.
          </h2>
          <p className="text-base text-muted-foreground">
            Plans are billed per-site so you only pay for what you actually monitor.
            You can mix tiers across sites — for example, a flagship site on Enterprise
            and a satellite office on Starter.
          </p>
          <div className="rounded-xl border border-border bg-card/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subscribing
            </p>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-base font-bold text-foreground">{targetSite.name}</p>
                <p className="text-xs text-muted-foreground">{targetSite.address}</p>
              </div>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2"><Check className="mt-0.5 size-3 flex-shrink-0 text-success" /> 30-day money-back guarantee</li>
            <li className="flex items-start gap-2"><Check className="mt-0.5 size-3 flex-shrink-0 text-success" /> Cancel anytime — read-only access during grace period</li>
            <li className="flex items-start gap-2"><Check className="mt-0.5 size-3 flex-shrink-0 text-success" /> Add more sites whenever you're ready</li>
          </ul>
        </>
      }
    >
      <div>
        <OnboardingProgress current="subscription" />

        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {step === "pick" ? "Choose a plan" : "Confirm payment"}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {step === "pick"
            ? <>Subscribe <strong className="text-foreground">{targetSite.name}</strong> to unlock the dashboard.</>
            : <>Activate <strong className="text-foreground">{plan.name}</strong> ({cycle}) for {targetSite.name}.</>
          }
        </p>

        {step === "pick" ? (
          <>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-border bg-background p-1 text-sm">
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

            <div className="mt-4 space-y-2">
              {TIER_ORDER.map((tier) => {
                const p = PLANS[tier];
                const color = PLAN_COLORS[tier];
                const Icon = PLAN_ICONS[tier];
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
                    <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                      isPicked ? "border-primary" : "border-muted-foreground/40")}>
                      {isPicked && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-lg border", color.border, color.bg)}>
                      <Icon className={cn("size-4", color.text)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.tagline}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-2xs">
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {typeof p.cameraLimit === "number" ? `${p.cameraLimit} cams` : "Unlim cams"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {typeof p.userLimit === "number" ? `${p.userLimit} users` : "Unlim users"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {p.retentionDays}d retention
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-mono text-lg font-bold leading-none", color.text)}>${monthly}</p>
                      <p className="text-3xs text-muted-foreground">/mo</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button variant="ghost" className="gap-1.5" onClick={() => navigate("/onboarding/site")}>
                <ArrowLeft className="size-3.5" />
                Back
              </Button>
              <Button className="ml-auto h-10 gap-2 px-5" onClick={() => setStep("payment")}>
                Continue
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-border bg-background p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
                  <button onClick={() => setStep("pick")}
                    className="text-xs text-muted-foreground underline hover:text-primary">
                    Change plan
                  </button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{plan.name} · {cycle === "annual" ? "Annual" : "Monthly"}</span>
                  <span className="font-mono font-semibold text-foreground">
                    ${monthlyDisplay}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">For {targetSite.name}</span>
                  <span className="font-mono text-muted-foreground">{targetSite.address.slice(0, 24)}…</span>
                </div>
                <div className="my-2 border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Billed {cycle === "annual" ? "today (annual)" : "monthly"}</span>
                  <span className="font-mono text-xl font-bold text-success">${billed.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name on card</label>
                <Input value={cardName}
                  onChange={(e) => { setCardName(e.target.value); setErrors((p) => ({ ...p, cardName: undefined })); }}
                  aria-invalid={!!errors.cardName}
                  placeholder="Full name as shown on card" className="h-10 text-base" />
                {errors.cardName && <p className="mt-1 text-xs text-sev-critical">{errors.cardName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Card number</label>
                <div className="relative">
                  <CreditCard className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={cardNumber}
                    onChange={(e) => { setCardNumber(formatCard(e.target.value)); setErrors((p) => ({ ...p, cardNumber: undefined })); }}
                    aria-invalid={!!errors.cardNumber}
                    placeholder="1234 5678 9012 3456" className="h-10 pl-9 font-mono text-base" inputMode="numeric" />
                </div>
                {errors.cardNumber && <p className="mt-1 text-xs text-sev-critical">{errors.cardNumber}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expiry</label>
                  <Input value={expiry}
                    onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setErrors((p) => ({ ...p, expiry: undefined })); }}
                    aria-invalid={!!errors.expiry}
                    placeholder="MM/YY" className="h-10 font-mono text-base" inputMode="numeric" />
                  {errors.expiry && <p className="mt-1 text-xs text-sev-critical">{errors.expiry}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">CVC</label>
                  <Input value={cvc}
                    onChange={(e) => { setCvc(e.target.value.replace(/\D/g, "").slice(0, 4)); setErrors((p) => ({ ...p, cvc: undefined })); }}
                    aria-invalid={!!errors.cvc}
                    placeholder="123" className="h-10 font-mono text-base" inputMode="numeric" />
                  {errors.cvc && <p className="mt-1 text-xs text-sev-critical">{errors.cvc}</p>}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical">
                  <AlertCircle className="size-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2 rounded-md border border-info/30 bg-info/[0.05] px-3 py-2 text-xs text-info">
                <Lock className="size-3 flex-shrink-0" />
                Payment is encrypted end-to-end. You can cancel anytime within 30 days for a full refund.
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button variant="ghost" className="gap-1.5" onClick={() => setStep("pick")}>
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>
                <Button className="ml-auto h-10 gap-2 px-5" disabled={loading} onClick={activate}>
                  {loading ? "Activating…" : <>Pay ${billed.toLocaleString()} & activate <ArrowRight className="size-3.5" /></>}
                </Button>
              </div>
            </div>
          </>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Step 2 of 2 · The dashboard unlocks once payment is confirmed.
        </p>
      </div>
    </AuthLayout>
  );
}
