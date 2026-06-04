import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User, Mail, Lock, Eye, EyeOff, Building2, Clock, MapPin, Shapes,
  AlertCircle, Check, CheckCircle2, ArrowRight, ArrowLeft, CreditCard, Plus, Trash2,
  Sparkles, Zap, Rocket, Play, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";
import { PLANS, type PlanTier, SEAT_PRICING } from "@/mocks/licenses";
import { makeBlankSite } from "@/mocks/sites";

/* ── Wizard steps (visible) ─────────────────────────────────────────── */
type WizardStep = "account" | "plan" | "site" | "team";

/* Sub-steps within "plan" (Figma 3-stage flow) */
type PlanSubStep = "pick" | "payment" | "review";

const TOP_STEPS: { key: WizardStep; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "plan",    label: "Plan" },
  { key: "site",    label: "Site" },
  { key: "team",    label: "Team" },
];

const PLAN_ICONS: Record<PlanTier, React.ElementType> = {
  starter: Sparkles,
  professional: Zap,
  enterprise: Rocket,
};

type InviteRole = "admin" | "user";

interface InviteRow {
  id: string;
  email: string;
  role: InviteRole | null;
}

/* ── Auth shell — supports a wide variant for plan / team steps ─────── */
function WizardShell({
  children, wide, onCancel,
}: {
  children: React.ReactNode;
  wide?: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-secondary">
            <Play className="size-3 fill-white text-white" />
          </div>
          <p className="text-[14px] font-bold tracking-tight text-foreground">Accel</p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
      <div className="px-4 py-6 sm:px-6">
        <div className={cn("mx-auto", wide ? "max-w-[1024px]" : "max-w-[480px]")}>{children}</div>
      </div>
    </div>
  );
}

function TopStepper({ current }: { current: WizardStep }) {
  const idx = TOP_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="mb-8 flex items-center gap-2">
      {TOP_STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                  done   ? "border-success bg-success text-success-foreground" :
                  active ? "border-primary bg-primary/15 text-primary" :
                           "border-border text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={cn(
                "text-[12px] font-semibold transition-colors",
                done || active ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
            </div>
            {i < TOP_STEPS.length - 1 && (
              <span className={cn("h-px flex-1",
                done ? "bg-success/60" : active ? "bg-primary/40" : "bg-border"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function PlanSubStepper({ current }: { current: PlanSubStep }) {
  const steps: { key: PlanSubStep; label: string }[] = [
    { key: "pick",    label: "Choose Plan" },
    { key: "payment", label: "Payment Information" },
    { key: "review",  label: "Review" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {steps.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex size-5 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                done   ? "border-sev-critical bg-sev-critical text-white" :
                active ? "border-sev-critical bg-sev-critical/15 text-sev-critical" :
                         "border-muted-foreground/40 text-muted-foreground/60"
              )}>
                {done && <Check className="size-2.5" strokeWidth={3} />}
                {active && <span className="size-1.5 rounded-full bg-sev-critical" />}
              </span>
              <span className={cn(
                "text-[12px] font-medium",
                done || active ? "text-foreground" : "text-muted-foreground/60"
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className={cn("h-px w-12", done ? "bg-sev-critical/60" : "bg-muted-foreground/30")} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const TIMEZONES = ["Asia/Singapore", "Asia/Bangkok", "Asia/Tokyo", "Asia/Dubai", "Europe/London", "America/New_York", "America/Los_Angeles", "Australia/Sydney"];

export default function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setHasCreatedSite = useAuthStore((s) => s.setHasCreatedSite);
  const setHasActiveSubscription = useAuthStore((s) => s.setHasActiveSubscription);
  const addSite = useSitesStore((s) => s.addSite);
  const addSubscription = useSubscriptionsStore((s) => s.add);

  const [step, setStep] = React.useState<WizardStep>("account");
  const [accountSubStep, setAccountSubStep] = React.useState<"form" | "otp">("form");
  const [planSubStep, setPlanSubStep] = React.useState<PlanSubStep>("pick");

  /* ── Step 1: Account info ───────────────────────────────────────── */
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [agreedTos, setAgreedTos] = React.useState(false);

  /* ── Step 1.5: OTP ──────────────────────────────────────────────── */
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  /* ── Step 2: Plan + payment ─────────────────────────────────────── */
  const [picked, setPicked] = React.useState<PlanTier>("professional");
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("annual");
  const [cardName, setCardName] = React.useState("");
  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvc, setCvc] = React.useState("");
  const [billingAddress, setBillingAddress] = React.useState("");
  const [billingApt, setBillingApt] = React.useState("");
  const [country, setCountry] = React.useState("Singapore");
  const [city, setCity] = React.useState("Singapore");
  const [postalCode, setPostalCode] = React.useState("");
  const [saveCard, setSaveCard] = React.useState(false);
  const [autoRenew, setAutoRenew] = React.useState(true);
  const [agreedCheckoutTos, setAgreedCheckoutTos] = React.useState(false);

  /* ── Step 3: Site info ──────────────────────────────────────────── */
  const [siteName, setSiteName] = React.useState("");
  const [siteAddress, setSiteAddress] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Singapore");
  const [opFrom, setOpFrom] = React.useState("08:00");
  const [opTo, setOpTo] = React.useState("18:00");
  const [siteDescription, setSiteDescription] = React.useState("");
  const [primaryArea, setPrimaryArea] = React.useState("");

  /* ── Step 4: Invite team ────────────────────────────────────────── */
  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [inviteDraft, setInviteDraft] = React.useState<InviteRow[]>([
    { id: `inv-${Math.random().toString(36).slice(2, 6)}`, email: "", role: null },
  ]);

  const [error, setError] = React.useState<string | null>(null);

  const plan = PLANS[picked];
  const monthlyPerSeat = SEAT_PRICING.user.pricePerMonth;
  const includedFullSeats = 2;
  const additionalSeats = invites.filter((i) => i.role === "user").length;
  const adminInvites = invites.filter((i) => i.role === "admin").length;

  function fmtCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  /* ── Step handlers ──────────────────────────────────────────────── */
  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2)       return setError("Enter your full name.");
    if (!email.includes("@"))             return setError("Enter a valid email address.");
    if (password.length < 8)              return setError("Password must be at least 8 characters.");
    if (password !== confirmPw)           return setError("Passwords don't match.");
    if (!agreedTos)                       return setError("You must accept the Terms to continue.");
    toast.message("Verification code sent", {
      description: `A 6-digit code was sent to ${email}. (Demo code: 123456)`,
    });
    setAccountSubStep("otp");
    setTimeout(() => otpRefs.current[0]?.focus(), 80);
  }

  function setOtpAt(idx: number, val: string) {
    const clean = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp]; next[idx] = clean; setOtp(next);
    if (clean && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function otpKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function otpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setOtp(next);
    otpRefs.current[Math.min(5, pasted.length)]?.focus();
  }

  function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.join("").length < 6) return setError("Enter the full 6-digit code.");
    const initials = fullName.split(/\s+/).map((p) => p[0]?.toUpperCase() ?? "").slice(0, 2).join("");
    signUp({
      id: "usr-" + Math.random().toString(36).slice(2, 6),
      name: fullName,
      initials: initials || "U",
      role: "admin",
      email,
      notificationCount: 0,
      orgName: "My Workspace",
    });
    setStep("plan");
    setPlanSubStep("pick");
  }

  function selectPlan() { setPlanSubStep("payment"); }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cardName.trim().length < 2) return setError("Enter the card holder name.");
    if (cardNumber.replace(/\s/g, "").length < 13) return setError("Enter a valid card number.");
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return setError("Expiry must be in MM/YY format.");
    if (cvc.length < 3) return setError("Enter the security code.");
    if (billingAddress.trim().length < 3) return setError("Enter a billing address.");
    setPlanSubStep("review");
  }

  function confirmCheckout() {
    setError(null);
    if (!agreedCheckoutTos) return setError("Please accept the Terms to confirm checkout.");
    // Defer setHasActiveSubscription until finish() so RedirectIfAuthed doesn't kick the user
    // out of the wizard once both flags flip true mid-flow.
    toast.success("Subscription activated", {
      description: `${plan.name} plan · ${cycle === "annual" ? "billed annually" : "billed monthly"}`,
    });
    setStep("site");
  }

  function submitSite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (siteName.trim().length < 2)    return setError("Enter a site name.");
    if (siteAddress.trim().length < 3) return setError("Enter a site address.");
    if (primaryArea.trim().length < 2) return setError("Enter at least one area to start with.");

    const site = makeBlankSite(siteName.trim(), "#DD7224");
    site.address = siteAddress.trim();
    site.timezone = timezone;
    site.operatingHours = { from: opFrom, to: opTo };
    site.description = siteDescription.trim() || undefined;
    site.areas = [{
      id: `area-${Math.random().toString(36).slice(2, 6)}`,
      name: primaryArea.trim(),
      color: "#DD7224",
      points: [],
    }];
    site.status = "setup";
    addSite(site);

    {
      const now = new Date();
      const renewsAt = new Date(now); renewsAt.setFullYear(now.getFullYear() + (cycle === "annual" ? 1 : 0));
      if (cycle === "monthly") renewsAt.setMonth(now.getMonth() + 1);
      const seats = { owner: 1, admin: adminInvites, user: additionalSeats + includedFullSeats };
      const monthlyCost =
        (cycle === "annual" ? Math.round(plan.pricePerYear / 12) : plan.pricePerMonth)
        + seats.owner * SEAT_PRICING.owner.pricePerMonth
        + seats.admin * SEAT_PRICING.admin.pricePerMonth
        + seats.user * SEAT_PRICING.user.pricePerMonth;
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-GB", { month: "short" })} ${d.getFullYear()}`;
      addSubscription({
        id: `SUB-${now.getFullYear()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        siteId: site.id,
        siteName: site.name,
        planTier: picked,
        status: "active",
        billingCycle: cycle,
        seats,
        startedAt: now.toISOString().slice(0, 10),
        startedDisplay: fmt(now),
        renewsAt: renewsAt.toISOString().slice(0, 10),
        renewsDisplay: fmt(renewsAt),
        monthlyCost,
      });
    }

    // Defer setHasCreatedSite to finish() so the redirect guard doesn't fire mid-wizard.
    setStep("team");
  }

  function openInviteModal() {
    setInviteDraft([{ id: `inv-${Math.random().toString(36).slice(2, 6)}`, email: "", role: null }]);
    setInviteModalOpen(true);
  }
  function confirmInvites() {
    const cleaned = inviteDraft.filter((r) => r.email.trim().length > 0 && r.email.includes("@") && r.role);
    setInvites((curr) => [...curr, ...cleaned]);
    setInviteModalOpen(false);
    if (cleaned.length > 0) {
      toast.success(`Invited ${cleaned.length} ${cleaned.length === 1 ? "person" : "people"}`);
    }
  }
  function finish() {
    setHasCreatedSite(true);
    setHasActiveSubscription(true);
    completeOnboarding();
    toast.success(`Welcome to Accel, ${fullName.split(" ")[0] || "there"}! 🎉`, {
      description: "Your workspace is ready.",
    });
    navigate("/", { replace: true });
  }

  /* ── Step 1: Account form ───────────────────────────────────────── */
  if (step === "account" && accountSubStep === "form") {
    return (
      <WizardShell onCancel={() => navigate("/signin")}>
        <TopStepper current="account" />
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Start a free 30-day trial. No credit card needed yet.
        </p>
        <form onSubmit={submitAccount} className="mt-6 space-y-3">
          <Field label="Full name" icon={User}>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Delbin Arkar" className="h-10 pl-9 text-[13px]" />
          </Field>
          <Field label="Work email" icon={Mail}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com" className="h-10 pl-9 text-[13px]" />
          </Field>
          <Field label="Password" icon={Lock}>
            <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters" className="h-10 px-9 text-[13px]" />
            <button type="button" onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </Field>
          <Field label="Confirm password" icon={Lock}>
            <Input type={showConfirmPw ? "text" : "password"} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-type your password" className="h-10 px-9 text-[13px]" />
            <button type="button" onClick={() => setShowConfirmPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirmPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </Field>
          <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
            <input type="checkbox" checked={agreedTos} onChange={(e) => setAgreedTos(e.target.checked)}
              className="mt-0.5 size-3.5 accent-primary" />
            <span>
              I agree to the{" "}
              <a href="#" className="font-semibold text-primary underline">Terms of Service</a>{" "}and{" "}
              <a href="#" className="font-semibold text-primary underline">Privacy Policy</a>.
            </span>
          </label>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-[13px]">
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>
        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Already have an account? <Link to="/signin" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </WizardShell>
    );
  }

  /* ── Step 1.5: OTP ──────────────────────────────────────────────── */
  if (step === "account" && accountSubStep === "otp") {
    return (
      <WizardShell onCancel={() => navigate("/signin")}>
        <TopStepper current="account" />
        <button onClick={() => { setAccountSubStep("form"); setError(null); }}
          className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back
        </button>
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">Verify your email</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
        </p>
        <form onSubmit={submitOtp} className="mt-6 space-y-3">
          <div onPaste={otpPaste} className="flex items-center justify-between gap-2">
            {otp.map((d, i) => (
              <input key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                value={d}
                onChange={(e) => setOtpAt(i, e.target.value)}
                onKeyDown={(e) => otpKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="h-12 w-12 rounded-md border border-input bg-background text-center font-mono text-[20px] font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            ))}
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-[13px]">
            Verify & Continue <ArrowRight className="size-3.5" />
          </Button>
          <button type="button"
            onClick={() => toast.message("Code re-sent", { description: `A new code was sent to ${email}.` })}
            className="block w-full text-center text-[12px] text-muted-foreground hover:text-primary"
          >
            Didn't get it? <span className="font-semibold underline">Resend code</span>
          </button>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 2a: Plan picker ───────────────────────────────────────── */
  if (step === "plan" && planSubStep === "pick") {
    return (
      <WizardShell wide onCancel={() => navigate("/signin")}>
        <TopStepper current="plan" />
        <div className="rounded-xl border border-border bg-card p-6 md:p-8">
          <div className="text-center">
            <h2 className="text-[22px] font-bold tracking-tight text-foreground">Select a Plan</h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Pick the plan that fits your needs. You can upgrade, downgrade, or add seats any time.
            </p>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className={cn("text-[12px] font-semibold", cycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
            <button onClick={() => setCycle((c) => c === "monthly" ? "annual" : "monthly")}
              className={cn("relative h-5 w-9 rounded-full transition-colors", cycle === "annual" ? "bg-primary" : "bg-muted")}>
              <span className={cn(
                "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                cycle === "annual" && "translate-x-4"
              )} />
            </button>
            <span className={cn("text-[12px] font-semibold", cycle === "annual" ? "text-foreground" : "text-muted-foreground")}>
              Annually
            </span>
            {cycle === "annual" && (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">Save up to 17%</span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {(["starter", "professional", "enterprise"] as PlanTier[]).map((tier) => {
              const p = PLANS[tier];
              const Icon = PLAN_ICONS[tier];
              const monthly = cycle === "annual" ? Math.round(p.pricePerYear / 12) : p.pricePerMonth;
              const selected = picked === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setPicked(tier)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-lg border-2 bg-background p-4 text-left transition-all",
                    selected ? "border-primary" : "border-border hover:border-primary/30"
                  )}
                >
                  {p.highlight && (
                    <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10">
                      <Icon className="size-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.tagline}</p>
                    </div>
                  </div>
                  <p className="font-mono">
                    <span className="text-[24px] font-bold text-foreground">${monthly}</span>
                    <span className="text-[11px] text-muted-foreground">/ month</span>
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                    {p.features.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check className="mt-0.5 size-3 flex-shrink-0 text-success" strokeWidth={3} />
                        <span>{f}</span>
                      </li>
                    ))}
                    {p.features.length > 5 && (
                      <li className="ml-4 text-[10px] italic text-muted-foreground/70">
                        +{p.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-center">
            <Button onClick={selectPlan} className="h-10 gap-2 px-8 text-[13px]">
              Select this Plan <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </WizardShell>
    );
  }

  /* ── Step 2b: Payment ───────────────────────────────────────────── */
  if (step === "plan" && planSubStep === "payment") {
    const monthlyPerSite = cycle === "annual" ? Math.round(plan.pricePerYear / 12) : plan.pricePerMonth;
    return (
      <WizardShell wide onCancel={() => navigate("/signin")}>
        <TopStepper current="plan" />
        <PlanSubStepper current="payment" />
        <h2 className="mb-4 text-[18px] font-bold text-foreground">Enter your payment details</h2>
        <form onSubmit={submitPayment} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-4 text-[14px] font-bold text-foreground">Payment Details</p>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Card Information</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Card Holder Name *</label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)}
                  placeholder="Enter card holder name" className="h-9 text-[13px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Card Number *</label>
                <Input value={cardNumber} onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                  placeholder="4111 1111 1111 1111" className="h-9 text-[13px]" inputMode="numeric" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Expiry Date *</label>
                <Input value={expiry} onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                  placeholder="MM/YY" className="h-9 text-[13px]" inputMode="numeric" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Security Code (CVV) *</label>
                <Input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123" className="h-9 text-[13px]" inputMode="numeric" />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-[12px] text-muted-foreground">
              <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)}
                className="size-3.5 accent-primary" />
              Save for future purchases
            </label>
            <hr className="my-5 border-border" />
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Billing Information</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Billing Address *</label>
                <Input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Enter address" className="h-9 text-[13px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Apt, Unit, Suite, etc</label>
                <Input value={billingApt} onChange={(e) => setBillingApt(e.target.value)}
                  placeholder="Enter" className="h-9 text-[13px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Country *</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
                  {["Singapore", "Malaysia", "Thailand", "United States", "United Kingdom", "Australia"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">City *</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Select city" className="h-9 text-[13px]" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">Postal Code *</label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Enter postal code" className="h-9 text-[13px]" />
              </div>
            </div>
          </div>

          <div className="self-start rounded-lg border border-border bg-card p-5">
            <p className="mb-4 text-[14px] font-bold text-foreground">Your {plan.name} Plan</p>
            <div className="mb-4 space-y-2">
              <label className="flex items-center gap-2 text-[12px]">
                <input type="radio" name="cycle" checked={cycle === "annual"} onChange={() => setCycle("annual")} className="accent-primary" />
                Annual
                <span className="ml-auto rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold text-success">Save up to 17%</span>
              </label>
              <label className="flex items-center gap-2 text-[12px]">
                <input type="radio" name="cycle" checked={cycle === "monthly"} onChange={() => setCycle("monthly")} className="accent-primary" />
                Monthly
              </label>
            </div>
            <div className="space-y-2 border-t border-border pt-3 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">1 Owner seat <span className="text-muted-foreground/70">(included)</span></span>
                <span className="text-success">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan ({plan.name})</span>
                <span className="font-mono text-foreground">${monthlyPerSite}/ mo</span>
              </div>
              {additionalSeats > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{additionalSeats} additional user seat{additionalSeats === 1 ? "" : "s"}</span>
                  <span className="font-mono text-foreground">${additionalSeats * monthlyPerSeat}/ mo</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-[13px] font-semibold">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono text-foreground">${(monthlyPerSite + additionalSeats * monthlyPerSeat).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">See your total (incl. taxes) in Review.</p>
          </div>

          {error && <div className="lg:col-span-2"><ErrorBox message={error} /></div>}

          <div className="flex items-center justify-end gap-2 lg:col-span-2">
            <Button type="button" variant="outline" onClick={() => setPlanSubStep("pick")} className="gap-1.5">
              <ArrowLeft className="size-3.5" /> Go Back
            </Button>
            <Button type="submit" className="gap-1.5">
              Next: Review & Pay <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 2c: Review ────────────────────────────────────────────── */
  if (step === "plan" && planSubStep === "review") {
    const monthlyPerSite = cycle === "annual" ? Math.round(plan.pricePerYear / 12) : plan.pricePerMonth;
    const totalDue = monthlyPerSite + additionalSeats * monthlyPerSeat;
    return (
      <WizardShell wide onCancel={() => navigate("/signin")}>
        <TopStepper current="plan" />
        <PlanSubStepper current="review" />
        <h2 className="mb-4 text-[18px] font-bold text-foreground">Let's make sure everything looks right</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[14px] font-bold text-foreground">Details</p>
              <button onClick={() => setPlanSubStep("payment")}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline">
                <Pencil className="size-3" /> Edit Details
              </button>
            </div>
            <dl className="space-y-3 text-[13px]">
              <ReviewRow label="Organization Name" value={fullName ? `${fullName}'s Workspace` : "My Workspace"} />
              <ReviewRow label="Card Number" value={cardNumber.length > 0 ? `XXXX XXXX XXXX ${cardNumber.slice(-4)}` : "—"} />
              <ReviewRow label="Card Holder Name" value={cardName || "—"} />
              <ReviewRow label="Billing Address" value={billingAddress || "—"} />
              <ReviewRow label="Apt, Unit, Suite, etc" value={billingApt || "N/A"} />
              <ReviewRow label="Country" value={country} />
            </dl>
          </div>

          <div className="self-start rounded-lg border border-border bg-card p-5">
            <p className="mb-4 text-[14px] font-bold text-foreground">Overview</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">1 Owner seat <span className="text-muted-foreground/70">(included)</span></span>
                <span className="text-success">Free</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{plan.name} plan</span>
                <span className="font-mono text-foreground">${monthlyPerSite}</span>
              </div>
              {additionalSeats > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{additionalSeats} additional seat{additionalSeats === 1 ? "" : "s"}</span>
                  <span className="font-mono text-foreground">${additionalSeats * monthlyPerSeat}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">${totalDue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax <span className="text-muted-foreground/70">(0%)</span></span>
                <span className="font-mono text-muted-foreground">$0.00</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-[13px] font-bold">
                <span className="text-foreground">Total due today</span>
                <span className="font-mono text-foreground">${totalDue.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)}
                  className="mt-0.5 size-3.5 accent-primary" />
                <span>Auto-renewal of subscription. Your subscription and any added seats will renew together based on your selected billing cycle.</span>
              </label>
              <label className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <input type="checkbox" checked={agreedCheckoutTos} onChange={(e) => setAgreedCheckoutTos(e.target.checked)}
                  className="mt-0.5 size-3.5 accent-primary" />
                <span>I agree to both <a href="#" className="text-primary underline">Terms of Service</a> and <a href="#" className="text-primary underline">Privacy Policy</a>.</span>
              </label>
            </div>
            {error && <div className="mt-3"><ErrorBox message={error} /></div>}
            <div className="mt-4 flex items-center justify-between gap-2">
              <Button variant="outline" onClick={() => setPlanSubStep("payment")} className="gap-1.5">
                <ArrowLeft className="size-3.5" /> Go Back
              </Button>
              <Button onClick={confirmCheckout} className="gap-1.5">
                <CreditCard className="size-3.5" />
                Confirm Checkout
              </Button>
            </div>
          </div>
        </div>
      </WizardShell>
    );
  }

  /* ── Step 3: Site info ──────────────────────────────────────────── */
  if (step === "site") {
    return (
      <WizardShell onCancel={() => navigate("/signin")}>
        <TopStepper current="site" />
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">Create your first site</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          A site is a physical location with cameras. You can add more later.
        </p>
        <form onSubmit={submitSite} className="mt-6 space-y-3">
          <Field label="Site name" icon={Building2}>
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Astra HQ" className="h-10 pl-9 text-[13px]" />
          </Field>
          <Field label="Site address" icon={MapPin}>
            <Input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="8 Marina Boulevard, Singapore 018984" className="h-10 pl-9 text-[13px]" />
          </Field>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Timezone</label>
            <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="size-3" /> Operating Hours
            </label>
            <div className="flex items-center gap-2">
              <Input type="time" value={opFrom} onChange={(e) => setOpFrom(e.target.value)} className="h-10 w-36 text-[13px]" />
              <span className="text-[12px] text-muted-foreground">to</span>
              <Input type="time" value={opTo} onChange={(e) => setOpTo(e.target.value)} className="h-10 w-36 text-[13px]" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description (optional)</label>
            <textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={2}
              placeholder="A short description of this site…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px]" />
          </div>
          <Field label="Primary area" icon={Shapes}>
            <Input value={primaryArea} onChange={(e) => setPrimaryArea(e.target.value)}
              placeholder="e.g. Lobby, Armoury, Loading Bay…" className="h-10 pl-9 text-[13px]" />
          </Field>
          <div className="rounded-md border border-info/30 bg-info/[0.06] px-3 py-2 text-[11px] text-muted-foreground">
            <Check className="mr-1 inline size-3 text-info" />
            You can add more areas anytime from the <strong className="text-foreground">Sites</strong> page once your dashboard opens.
          </div>
          {error && <ErrorBox message={error} />}
          <div className="flex items-center justify-end gap-2">
            <Button type="submit" className="gap-1.5">
              Continue <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 4: Invite team ────────────────────────────────────────── */
  if (step === "team") {
    const adminCount = invites.filter((i) => i.role === "admin").length;
    const userCount = invites.filter((i) => i.role === "user").length;
    return (
      <WizardShell wide onCancel={() => navigate("/signin")}>
        <TopStepper current="team" />
        <div>
          <h2 className="text-[18px] font-bold text-foreground">Choose a seat type for everyone in your organization</h2>
          <p className="mt-1 max-w-2xl text-[12px] text-muted-foreground">
            You're almost set. Choose the type of access each team member will need. You can upgrade or adjust seats later if your team grows or roles change.
          </p>

          <div className="mt-5 flex items-center justify-between">
            <p className="text-[14px] font-bold text-foreground">Members</p>
            <div className="flex items-center gap-2">
              <SeatChip color="info"      label="Owner" count={1} />
              <SeatChip color="secondary" label="Admin" count={adminCount} />
              <SeatChip color="success"   label="User"  count={userCount + 1} />
              <Button onClick={openInviteModal} className="gap-1.5">
                <Plus className="size-3.5" />
                Invite Users
              </Button>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead className="bg-muted/30 text-left">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Name</th>
                  <th className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Seat</th>
                  <th className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Includes</th>
                  <th className="px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
                        {fullName.split(" ").map((p) => p[0]?.toUpperCase()).slice(0, 2).join("") || "U"}
                      </div>
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                          {fullName || "You"}
                          <span className="rounded bg-muted px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Owner</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">{email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-info/10 px-2 py-1 text-[11px] font-semibold text-info">
                      <User className="size-3" /> Owner
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-muted-foreground">
                    Can create, manage, and validate projects, invite users, and access all admin settings.
                  </td>
                  <td className="px-4 py-3" />
                </tr>

                {invites.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                          <Mail className="size-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-warning">Pending</p>
                          <p className="text-[11px] text-muted-foreground">{inv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold",
                        inv.role === "admin" ? "bg-secondary/10 text-secondary" : "bg-success/10 text-success"
                      )}>
                        <User className="size-3" />
                        {inv.role === "admin" ? "Admin" : "Full Access"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                      {inv.role === "admin"
                        ? "Can edit, configure rules, and manage team across projects."
                        : "Can edit but cannot create new projects or manage team roles."}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setInvites((curr) => curr.filter((r) => r.id !== inv.id))}
                        className="flex size-7 items-center justify-center rounded-md border border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-border bg-muted/20 px-4 py-2 text-right text-[12px] text-muted-foreground">
              Current Total: <strong className="text-foreground">{1 + invites.length}</strong> assigned seat{invites.length === 0 ? "" : "s"}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={finish}>
              Skip for now
            </Button>
            <Button onClick={finish} className="gap-1.5">
              <CheckCircle2 className="size-3.5" />
              Finish & Enter Dashboard
            </Button>
          </div>
        </div>

        <InviteUsersModal
          open={inviteModalOpen}
          rows={inviteDraft}
          onChange={setInviteDraft}
          onClose={() => setInviteModalOpen(false)}
          onConfirm={confirmInvites}
        />
      </WizardShell>
    );
  }

  return null;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function Field({
  label, icon: Icon, children,
}: {
  label: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-[12px] text-sev-critical">
      <AlertCircle className="size-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

function SeatChip({ color, label, count }: { color: "info" | "secondary" | "success"; label: string; count: number }) {
  const colors =
    color === "info"      ? "bg-info/10 text-info border-info/30" :
    color === "secondary" ? "bg-secondary/15 text-secondary border-secondary/30" :
                            "bg-success/15 text-success border-success/30";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold", colors)}>
      {label} · <span className="font-mono font-bold">{count}</span>
    </span>
  );
}

/* ── Invite modal (Figma 2044-199711 / 199910 / 200120 / 200330) ─────── */

function InviteUsersModal({
  open, rows, onChange, onClose, onConfirm,
}: {
  open: boolean;
  rows: InviteRow[];
  onChange: (next: InviteRow[]) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  function setRow(id: string, patch: Partial<InviteRow>) {
    onChange(rows.map((r) => r.id === id ? { ...r, ...patch } : r));
  }
  function add() {
    onChange([...rows, { id: `inv-${Math.random().toString(36).slice(2, 6)}`, email: "", role: null }]);
  }
  function remove(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  const validCount = rows.filter((r) => r.email.includes("@") && r.role).length;
  const title = rows.length === 1 ? "Invite the rest of the team" : "Invite the rest of the Team Members";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            You can invite more people to your organization after finished registration.
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {rows.map((row, i) => (
            <div key={row.id}>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <div className="flex items-center gap-2">
                <Input
                  value={row.email}
                  onChange={(e) => setRow(row.id, { email: e.target.value })}
                  placeholder="name@email.com"
                  className="h-9 flex-1 text-[13px]"
                />
                <RoleSelect value={row.role} onChange={(role) => setRow(row.id, { role })} />
              </div>
              {i > 0 && (
                <button
                  onClick={() => remove(row.id)}
                  className="mt-1 text-[11px] font-semibold text-sev-critical hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button onClick={add}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Plus className="size-3" />
            Add Another
          </button>
        </div>
        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} disabled={validCount === 0}>
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleSelect({
  value, onChange,
}: {
  value: InviteRole | null;
  onChange: (role: InviteRole) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const label = value === "admin" ? "Admin" : value === "user" ? "Full Access" : "Select Role";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-9 inline-flex w-44 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-3 text-[12px] font-semibold",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {label}
          <span className="text-muted-foreground">▾</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-1.5">
        <button
          onClick={() => { onChange("user"); setOpen(false); }}
          className={cn(
            "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-[12px] hover:bg-muted/50",
            value === "user" && "bg-primary/10"
          )}
        >
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Full Access <span className="text-muted-foreground">(${SEAT_PRICING.user.pricePerMonth}/mo)</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Users can run model validations, edit existing projects, manage settings, invite or remove users, and perform all administrative actions.
            </p>
          </div>
          {value === "user" && <Check className="size-3 flex-shrink-0 text-primary" strokeWidth={3} />}
        </button>
        <button
          onClick={() => { onChange("admin"); setOpen(false); }}
          className={cn(
            "flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left text-[12px] hover:bg-muted/50",
            value === "admin" && "bg-primary/10"
          )}
        >
          <div className="flex-1">
            <p className="font-semibold text-foreground">
              Admin <span className="text-muted-foreground">(${SEAT_PRICING.admin.pricePerMonth}/mo)</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Users can edit project content and invite others, but cannot start new projects, delete projects, or manage organization members.
            </p>
          </div>
          {value === "admin" && <Check className="size-3 flex-shrink-0 text-primary" strokeWidth={3} />}
        </button>
      </PopoverContent>
    </Popover>
  );
}
