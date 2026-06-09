import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Clock,
  MapPin,
  Shapes,
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Rocket,
  Play,
  Pencil,
  Loader2,
  Crown,
  ShieldCheck,
  CircleUser,
  Lock as LockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";
import { PLANS, type PlanTier, SEAT_PRICING, MOCK_SEATS } from "@/mocks/licenses";
import { USER_ROLE_DESCRIPTIONS, USER_ROLE_LABELS } from "@/mocks/users";
import type { UserRole } from "@/types/users";
import { makeBlankSite } from "@/mocks/sites";
import { AuthBackground } from "@/components/shared/AuthBackground";
import { AuthStepBar, type AuthStepKey } from "@/components/shared/AuthStepBar";
import { PasswordStrengthBar, isStrongPassword } from "@/components/shared/PasswordStrengthBar";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ── Wizard steps ───────────────────────────────────────────────────── */
type WizardStep = "account" | "plan" | "site" | "team";
type PlanSubStep = "pick" | "payment" | "review";

const PLAN_ICONS: Record<PlanTier, React.ElementType> = {
  starter: Sparkles,
  professional: Zap,
  enterprise: Rocket,
};

type InviteRole = "admin" | "user";

interface InviteRow {
  id: string;
  email: string;
  role: InviteRole;
}

/* Same role colour palette used in User Management. */
const ROLE_STYLES: Record<UserRole, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner: { bg: "bg-success/15 border-success/30", text: "text-success", icon: Crown },
  admin: { bg: "bg-info/15 border-info/30", text: "text-info", icon: ShieldCheck },
  user: { bg: "bg-warning/15 border-warning/30", text: "text-warning", icon: CircleUser },
};

function RoleBadge({
  role,
  withIcon = true,
}: {
  role: UserRole;
  withIcon?: boolean;
}) {
  const s = ROLE_STYLES[role];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      {withIcon && <Icon className="size-3" />}
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

/* Email parser — same regex + token rules as User Management. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function parseEmails(raw: string): {
  all: string[];
  valid: string[];
  invalid: string[];
  duplicates: string[];
} {
  const tokens = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (seen.has(lower)) {
      duplicates.push(t);
      continue;
    }
    seen.add(lower);
    if (EMAIL_RE.test(t)) valid.push(t);
    else invalid.push(t);
  }
  return { all: tokens, valid, invalid, duplicates };
}

/* ── Wizard shell ───────────────────────────────────────────────────── */
function WizardShell({
  children,
  wide,
  onCancel,
  currentStep,
}: {
  children: React.ReactNode;
  wide?: boolean;
  onCancel: () => void;
  currentStep: AuthStepKey;
}) {
  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      <AuthBackground />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link to="/signin" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-secondary">
            <Play className="size-3 fill-white text-white" />
          </div>
          <p className="text-md font-bold tracking-tight">Accel</p>
        </Link>
        <div className="flex-1 px-4">
          <AuthStepBar current={currentStep} />
        </div>
        <button
          onClick={onCancel}
          className="rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </header>

      {/* Body — content sits near the top, not vertically centred */}
      <main className="relative z-10 flex flex-1 justify-center px-4 pt-6 pb-8 sm:px-6 sm:pt-10">
        <div className={cn("w-full", wide ? "max-w-[1024px]" : "max-w-[440px]")}>
          {children}
        </div>
      </main>
    </div>
  );
}

const TIMEZONES = [
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

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

  /* Account info */
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [agreedTos, setAgreedTos] = React.useState(false);

  /* OTP */
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [otpSending, setOtpSending] = React.useState(false);

  /* Plan + payment */
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

  /* Site info */
  const [siteName, setSiteName] = React.useState("");
  const [siteAddress, setSiteAddress] = React.useState("");
  const [timezone, setTimezone] = React.useState("Asia/Singapore");
  const [opFrom, setOpFrom] = React.useState("08:00");
  const [opTo, setOpTo] = React.useState("18:00");
  const [siteDescription, setSiteDescription] = React.useState("");
  const [primaryArea, setPrimaryArea] = React.useState("");

  /* Team */
  const [invites, setInvites] = React.useState<InviteRow[]>([]);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const plan = PLANS[picked];
  const monthlyPerSeat = SEAT_PRICING.user.pricePerMonth;
  const includedFullSeats = 2;
  const additionalSeats = invites.filter((i) => i.role === "user").length;
  const adminInvites = invites.filter((i) => i.role === "admin").length;

  function fmtCard(v: string) {
    return v
      .replace(/\D/g, "")
      .slice(0, 19)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  }
  function fmtExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (fullName.trim().length < 2) return setError("Enter your full name.");
    if (!email.includes("@")) return setError("Enter a valid email address.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (!isStrongPassword(password))
      return setError("Choose a stronger password (mix upper/lowercase, numbers, or symbols).");
    if (password !== confirmPw) return setError("Passwords don't match.");
    if (!agreedTos)
      return setError("You must accept the Terms to continue.");
    setOtpSending(true);
    setTimeout(() => {
      setOtpSending(false);
      toast.message("Verification code sent", {
        description: `A 6-digit code was sent to ${email}. (Demo code: 123456)`,
      });
      setAccountSubStep("otp");
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }, 400);
  }

  function setOtpAt(idx: number, val: string) {
    const clean = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp];
    next[idx] = clean;
    setOtp(next);
    if (clean && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function otpKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function otpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
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
    if (otp.join("").length < 6)
      return setError("Enter the full 6-digit code.");
    const initials = fullName
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");
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

  function selectPlan() {
    setPlanSubStep("payment");
  }

  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (cardName.trim().length < 2)
      return setError("Enter the card holder name.");
    if (cardNumber.replace(/\s/g, "").length < 13)
      return setError("Enter a valid card number.");
    if (!/^\d{2}\/\d{2}$/.test(expiry))
      return setError("Expiry must be in MM/YY format.");
    if (cvc.length < 3) return setError("Enter the security code.");
    if (billingAddress.trim().length < 3)
      return setError("Enter a billing address.");
    setPlanSubStep("review");
  }

  function confirmCheckout() {
    setError(null);
    if (!agreedCheckoutTos)
      return setError("Please accept the Terms to confirm checkout.");
    toast.success("Subscription activated", {
      description: `${plan.name} plan · ${cycle === "annual" ? "billed annually" : "billed monthly"}`,
    });
    setStep("site");
  }

  function submitSite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (siteName.trim().length < 2) return setError("Enter a site name.");
    if (siteAddress.trim().length < 3)
      return setError("Enter a site address.");
    if (primaryArea.trim().length < 2)
      return setError("Enter at least one area to start with.");

    const site = makeBlankSite(siteName.trim(), "#DD7224");
    site.address = siteAddress.trim();
    site.timezone = timezone;
    site.operatingHours = { from: opFrom, to: opTo };
    site.description = siteDescription.trim() || undefined;
    site.areas = [
      {
        id: `area-${Math.random().toString(36).slice(2, 6)}`,
        name: primaryArea.trim(),
        color: "#DD7224",
        points: [],
      },
    ];
    site.status = "setup";
    addSite(site);

    {
      const now = new Date();
      const renewsAt = new Date(now);
      renewsAt.setFullYear(
        now.getFullYear() + (cycle === "annual" ? 1 : 0)
      );
      if (cycle === "monthly") renewsAt.setMonth(now.getMonth() + 1);
      const seats = {
        owner: 1,
        admin: adminInvites,
        user: additionalSeats + includedFullSeats,
      };
      const monthlyCost =
        (cycle === "annual"
          ? Math.round(plan.pricePerYear / 12)
          : plan.pricePerMonth) +
        seats.owner * SEAT_PRICING.owner.pricePerMonth +
        seats.admin * SEAT_PRICING.admin.pricePerMonth +
        seats.user * SEAT_PRICING.user.pricePerMonth;
      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-GB", { month: "short" })} ${d.getFullYear()}`;
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
    setStep("team");
  }

  function sendInvites(emails: string[], role: InviteRole) {
    const rows: InviteRow[] = emails.map((email) => ({
      id: `inv-${Math.random().toString(36).slice(2, 6)}`,
      email,
      role,
    }));
    setInvites((curr) => [...curr, ...rows]);
    setInviteOpen(false);
    toast.success(
      `Invited ${rows.length} ${rows.length === 1 ? "person" : "people"} as ${USER_ROLE_LABELS[role]}`
    );
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

  /* ── Back handler — context-aware ───────────────────────────────── */
  function goBack() {
    setError(null);
    if (step === "account" && accountSubStep === "otp") {
      setAccountSubStep("form");
      return;
    }
    if (step === "plan" && planSubStep === "review") {
      setPlanSubStep("payment");
      return;
    }
    if (step === "plan" && planSubStep === "payment") {
      setPlanSubStep("pick");
      return;
    }
    if (step === "plan" && planSubStep === "pick") {
      setStep("account");
      setAccountSubStep("otp");
      return;
    }
    if (step === "site") {
      setStep("plan");
      setPlanSubStep("review");
      return;
    }
    if (step === "team") {
      setStep("site");
      return;
    }
    // step === account && form
    navigate("/signin");
  }

  /* ── Step 1: Account form ───────────────────────────────────────── */
  if (step === "account" && accountSubStep === "form") {
    return (
      <WizardShell onCancel={() => navigate("/signin")} currentStep="account">
        <BackLink onClick={goBack} label="Back to sign in" />
        <Heading
          title="Create your account"
          subtitle="Start a free 30-day trial. No credit card needed yet."
        />
        <form onSubmit={submitAccount} className="mt-7 space-y-4">
          <Field label="Full name" icon={User}>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Delbin Arkar"
              className="h-10 pl-9 text-base"
              autoComplete="name"
            />
          </Field>
          <Field label="Work email" icon={Mail}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-10 pl-9 text-base"
              autoComplete="email"
            />
          </Field>
          <div>
            <Field label="Password" icon={Lock}>
              <Input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="h-10 px-9 text-base"
                autoComplete="new-password"
              />
              <EyeToggle on={showPw} onClick={() => setShowPw((v) => !v)} />
            </Field>
            <PasswordStrengthBar className="mt-1.5" password={password} />
          </div>
          <Field label="Confirm password" icon={Lock}>
            <Input
              type={showConfirmPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-type your password"
              className="h-10 px-9 text-base"
              autoComplete="new-password"
            />
            <EyeToggle
              on={showConfirmPw}
              onClick={() => setShowConfirmPw((v) => !v)}
            />
          </Field>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={agreedTos}
              onChange={(e) => setAgreedTos(e.target.checked)}
              className="mt-0.5 size-3.5 accent-primary"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="font-semibold text-primary underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-semibold text-primary underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {error && <ErrorBox message={error} />}
          <Button
            type="submit"
            disabled={
              otpSending ||
              fullName.trim().length < 2 ||
              !email.includes("@") ||
              !isStrongPassword(password) ||
              password !== confirmPw ||
              !agreedTos
            }
            className="h-10 w-full gap-2 text-base"
          >
            {otpSending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Sending code…
              </>
            ) : (
              <>
                Continue <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </WizardShell>
    );
  }

  /* ── Step 1.5: OTP ──────────────────────────────────────────────── */
  if (step === "account" && accountSubStep === "otp") {
    return (
      <WizardShell onCancel={() => navigate("/signin")} currentStep="account">
        <BackLink onClick={goBack} />
        <Heading
          title="Verify your email"
          subtitle={
            <>
              We sent a 6-digit code to{" "}
              <strong className="text-foreground">{email}</strong>.
            </>
          }
        />
        <form onSubmit={submitOtp} className="mt-7 space-y-5">
          <div
            onPaste={otpPaste}
            className="flex items-center justify-center gap-2"
          >
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  otpRefs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setOtpAt(i, e.target.value)}
                onKeyDown={(e) => otpKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                className={cn(
                  "h-12 w-11 rounded-md border border-input bg-background text-center font-mono text-2xl font-bold text-foreground outline-none transition-colors",
                  "focus:border-primary focus:ring-2 focus:ring-primary/30"
                )}
              />
            ))}
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Verify & Continue <ArrowRight className="size-3.5" />
          </Button>
          <button
            type="button"
            onClick={() =>
              toast.message("Code re-sent", {
                description: `A new code was sent to ${email}.`,
              })
            }
            className="block w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            Didn't get it?{" "}
            <span className="font-semibold underline">Resend code</span>
          </button>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 2a: Plan picker ───────────────────────────────────────── */
  if (step === "plan" && planSubStep === "pick") {
    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="plan">
        <BackLink onClick={goBack} />
        <Heading
          title="Select a Plan"
          subtitle="Pick the plan that fits your needs. Upgrade or add seats any time."
        />
        <div className="mt-5 flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-semibold",
              cycle === "monthly" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setCycle((c) => (c === "monthly" ? "annual" : "monthly"))
            }
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              cycle === "annual" ? "bg-primary" : "bg-muted"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform",
                cycle === "annual" && "translate-x-4"
              )}
            />
          </button>
          <span
            className={cn(
              "text-sm font-semibold",
              cycle === "annual" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Annually
          </span>
          {cycle === "annual" && (
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-2xs font-bold text-success">
              Save up to 17%
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {(["starter", "professional", "enterprise"] as PlanTier[]).map(
            (tier) => {
              const p = PLANS[tier];
              const Icon = PLAN_ICONS[tier];
              const monthly =
                cycle === "annual"
                  ? Math.round(p.pricePerYear / 12)
                  : p.pricePerMonth;
              const selected = picked === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setPicked(tier)}
                  className={cn(
                    "relative flex flex-col gap-2.5 rounded-lg border-2 bg-card/40 p-4 text-left backdrop-blur-sm transition-all",
                    selected
                      ? "border-primary"
                      : "border-border/60 hover:border-primary/30"
                  )}
                >
                  {p.highlight && (
                    <span className="absolute right-3 top-3 rounded-full bg-secondary px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-secondary-foreground">
                      Most Popular
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-secondary/30 bg-secondary/10">
                      <Icon className="size-3.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">
                        {p.name}
                      </p>
                      <p className="text-2xs text-muted-foreground">
                        {p.tagline}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono">
                    <span className="text-2xl font-bold text-foreground">
                      ${monthly}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / month
                    </span>
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Check
                          className="mt-0.5 size-3 flex-shrink-0 text-success"
                          strokeWidth={3}
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            }
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={selectPlan} className="h-10 gap-2 px-8 text-base">
            Select this Plan <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </WizardShell>
    );
  }

  /* ── Step 2b: Payment ───────────────────────────────────────────── */
  if (step === "plan" && planSubStep === "payment") {
    const monthlyPerSite =
      cycle === "annual"
        ? Math.round(plan.pricePerYear / 12)
        : plan.pricePerMonth;
    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="plan">
        <BackLink onClick={goBack} />
        <Heading
          title="Enter your payment details"
          subtitle="We'll securely save these for future renewals."
        />
        <form
          onSubmit={submitPayment}
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]"
        >
          <div className="rounded-lg border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Card Information
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CompactField label="Card Holder Name *">
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Enter card holder name"
                  className="h-9 text-base"
                />
              </CompactField>
              <CompactField label="Card Number *">
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                  placeholder="4111 1111 1111 1111"
                  className="h-9 text-base"
                  inputMode="numeric"
                />
              </CompactField>
              <CompactField label="Expiry Date *">
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="h-9 text-base"
                  inputMode="numeric"
                />
              </CompactField>
              <CompactField label="Security Code (CVV) *">
                <Input
                  value={cvc}
                  onChange={(e) =>
                    setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="123"
                  className="h-9 text-base"
                  inputMode="numeric"
                />
              </CompactField>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Save for future purchases
            </label>
            <hr className="my-3 border-border/60" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billing Information
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CompactField label="Billing Address *">
                <Input
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="Enter address"
                  className="h-9 text-base"
                />
              </CompactField>
              <CompactField label="Apt, Unit, Suite, etc">
                <Input
                  value={billingApt}
                  onChange={(e) => setBillingApt(e.target.value)}
                  placeholder="Enter"
                  className="h-9 text-base"
                />
              </CompactField>
              <CompactField label="Country *">
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-base"
                >
                  {[
                    "Singapore",
                    "Malaysia",
                    "Thailand",
                    "United States",
                    "United Kingdom",
                    "Australia",
                  ].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </CompactField>
              <CompactField label="City *">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Select city"
                  className="h-9 text-base"
                />
              </CompactField>
              <CompactField label="Postal Code *">
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Enter postal code"
                  className="h-9 text-base"
                />
              </CompactField>
            </div>
          </div>

          <div className="self-start rounded-lg border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
            <p className="mb-3 text-base font-bold text-foreground">
              Your {plan.name} Plan
            </p>
            <div className="mb-3 space-y-1.5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cycle"
                  checked={cycle === "annual"}
                  onChange={() => setCycle("annual")}
                  className="accent-primary"
                />
                Annual
                <span className="ml-auto rounded-full bg-success/15 px-1.5 py-0.5 text-3xs font-bold text-success">
                  Save 17%
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="cycle"
                  checked={cycle === "monthly"}
                  onChange={() => setCycle("monthly")}
                  className="accent-primary"
                />
                Monthly
              </label>
            </div>
            <div className="space-y-1.5 border-t border-border/60 pt-2.5 text-sm">
              <Line label="1 Owner seat (included)" value="Free" success />
              <Line label={`Plan (${plan.name})`} value={`$${monthlyPerSite}/mo`} />
              {additionalSeats > 0 && (
                <Line
                  label={`${additionalSeats} additional seat${additionalSeats === 1 ? "" : "s"}`}
                  value={`$${additionalSeats * monthlyPerSeat}/mo`}
                />
              )}
            </div>
            <div className="mt-2.5 flex justify-between border-t border-border/60 pt-2.5 text-base font-semibold">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono text-foreground">
                $
                {(
                  monthlyPerSite + additionalSeats * monthlyPerSeat
                ).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-2xs text-muted-foreground">
              Total (incl. taxes) in next step.
            </p>
          </div>

          {error && (
            <div className="lg:col-span-2">
              <ErrorBox message={error} />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 lg:col-span-2">
            <Button type="submit" className="h-10 gap-1.5 text-base">
              Next: Review & Pay <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 2c: Review ────────────────────────────────────────────── */
  if (step === "plan" && planSubStep === "review") {
    const monthlyPerSite =
      cycle === "annual"
        ? Math.round(plan.pricePerYear / 12)
        : plan.pricePerMonth;
    const totalDue = monthlyPerSite + additionalSeats * monthlyPerSeat;
    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="plan">
        <BackLink onClick={goBack} />
        <Heading
          title="Let's make sure everything looks right"
          subtitle="Review your subscription before we activate it."
        />
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <div className="rounded-lg border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-base font-bold text-foreground">Details</p>
              <button
                onClick={() => setPlanSubStep("payment")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <Pencil className="size-3" /> Edit Details
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-base">
              <ReviewRow
                label="Organization"
                value={fullName ? `${fullName}'s Workspace` : "My Workspace"}
              />
              <ReviewRow
                label="Card Number"
                value={
                  cardNumber.length > 0
                    ? `XXXX XXXX XXXX ${cardNumber.slice(-4)}`
                    : "—"
                }
              />
              <ReviewRow label="Card Holder Name" value={cardName || "—"} />
              <ReviewRow
                label="Billing Address"
                value={billingAddress || "—"}
              />
              <ReviewRow
                label="Apt, Unit, Suite"
                value={billingApt || "N/A"}
              />
              <ReviewRow label="Country" value={country} />
            </dl>
          </div>

          <div className="self-start rounded-lg border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
            <p className="mb-3 text-base font-bold text-foreground">
              Overview
            </p>
            <div className="space-y-1.5 text-sm">
              <Line label="1 Owner seat (included)" value="Free" success />
              <Line label={`${plan.name} plan`} value={`$${monthlyPerSite}`} />
              {additionalSeats > 0 && (
                <Line
                  label={`${additionalSeats} additional seat${additionalSeats === 1 ? "" : "s"}`}
                  value={`$${additionalSeats * monthlyPerSeat}`}
                />
              )}
              <div className="flex justify-between border-t border-border/60 pt-1.5">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">
                  ${totalDue.toLocaleString()}
                </span>
              </div>
              <Line label="Tax (0%)" value="$0.00" />
              <div className="flex justify-between border-t border-border/60 pt-1.5 text-base font-bold">
                <span className="text-foreground">Total due today</span>
                <span className="font-mono text-foreground">
                  ${totalDue.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="mt-0.5 size-3.5 accent-primary"
                />
                <span>
                  Auto-renewal of subscription. Your subscription will renew
                  based on your selected billing cycle.
                </span>
              </label>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={agreedCheckoutTos}
                  onChange={(e) => setAgreedCheckoutTos(e.target.checked)}
                  className="mt-0.5 size-3.5 accent-primary"
                />
                <span>
                  I agree to{" "}
                  <a href="#" className="text-primary underline">
                    Terms of Service
                  </a>
                  .
                </span>
              </label>
            </div>
            {error && (
              <div className="mt-2">
                <ErrorBox message={error} />
              </div>
            )}
            <Button
              onClick={confirmCheckout}
              className="mt-4 h-10 w-full gap-1.5 text-base"
            >
              <CreditCard className="size-3.5" />
              Confirm Checkout
            </Button>
          </div>
        </div>
      </WizardShell>
    );
  }

  /* ── Step 3: Site info ──────────────────────────────────────────── */
  if (step === "site") {
    return (
      <WizardShell onCancel={() => navigate("/signin")} currentStep="site">
        <BackLink onClick={goBack} />
        <Heading
          title="Create your first site"
          subtitle="A site is a physical location with cameras. You can add more later."
        />
        <form onSubmit={submitSite} className="mt-7 space-y-4">
          <Field label="Site name" icon={Building2}>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Astra HQ"
              className="h-10 pl-9 text-base"
            />
          </Field>
          <Field label="Site address" icon={MapPin}>
            <Input
              value={siteAddress}
              onChange={(e) => setSiteAddress(e.target.value)}
              placeholder="8 Marina Boulevard, Singapore 018984"
              className="h-10 pl-9 text-base"
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3" /> Operating Hours
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="time"
                  value={opFrom}
                  onChange={(e) => setOpFrom(e.target.value)}
                  className="h-10 flex-1 text-base"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={opTo}
                  onChange={(e) => setOpTo(e.target.value)}
                  className="h-10 flex-1 text-base"
                />
              </div>
            </div>
          </div>
          <Field label="Primary area" icon={Shapes}>
            <Input
              value={primaryArea}
              onChange={(e) => setPrimaryArea(e.target.value)}
              placeholder="e.g. Lobby, Armoury, Loading Bay…"
              className="h-10 pl-9 text-base"
            />
          </Field>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={2}
              placeholder="A short description of this site…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            />
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-1.5 text-base">
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 4: Invite team ────────────────────────────────────────── */
  if (step === "team") {
    const adminCount = invites.filter((i) => i.role === "admin").length;
    const userCount = invites.filter((i) => i.role === "user").length;
    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="team">
        <BackLink onClick={goBack} />
        <Heading
          title="Invite your team to collaborate"
          subtitle="Choose the type of access each team member will need. You can adjust later."
        />

        <div className="mt-6 flex items-center justify-between">
          <p className="text-base font-bold text-foreground">Members</p>
          <div className="flex items-center gap-2">
            <SeatChip role="owner" count={1} />
            <SeatChip role="admin" count={adminCount} />
            <SeatChip role="user" count={userCount + 1} />
            <Button onClick={() => setInviteOpen(true)} className="h-9 gap-1.5">
              <Plus className="size-3.5" />
              Invite Users
            </Button>
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm">
          <table className="w-full">
            <thead className="bg-muted/20 text-left">
              <tr className="border-b border-border/60">
                <th className="px-4 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
                  Name
                </th>
                <th className="px-4 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
                  Seat
                </th>
                <th className="px-4 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
                  Includes
                </th>
                <th className="px-4 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/15 font-mono text-2xs font-bold text-primary">
                      {fullName
                        .split(" ")
                        .map((p) => p[0]?.toUpperCase())
                        .slice(0, 2)
                        .join("") || "U"}
                    </div>
                    <div>
                      <p className="inline-flex items-center gap-1.5 text-base font-semibold text-foreground">
                        {fullName || "You"}
                        <span className="rounded bg-muted px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-muted-foreground">
                          Owner
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <RoleBadge role="owner" />
                </td>
                <td className="px-4 py-2.5 text-sm text-muted-foreground">
                  {USER_ROLE_DESCRIPTIONS.owner}
                </td>
                <td className="px-4 py-2.5" />
              </tr>

              {invites.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                        <Mail className="size-3 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-warning">
                          Pending
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {inv.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <RoleBadge role={inv.role} />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">
                    {USER_ROLE_DESCRIPTIONS[inv.role]}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() =>
                        setInvites((curr) =>
                          curr.filter((r) => r.id !== inv.id)
                        )
                      }
                      className="flex size-7 items-center justify-center rounded-md border border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border/60 bg-muted/10 px-4 py-2 text-right text-sm text-muted-foreground">
            Current Total:{" "}
            <strong className="text-foreground">{1 + invites.length}</strong>{" "}
            assigned seat{invites.length === 0 ? "" : "s"}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={finish}>
            Skip for now
          </Button>
          <Button onClick={finish} className="h-10 gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Finish & Enter Dashboard
          </Button>
        </div>

        <InviteUsersModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvite={sendInvites}
          siteName={siteName}
          currentInvites={invites}
        />
      </WizardShell>
    );
  }

  return null;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/**
 * Top-of-step "Back" link. Sits above the heading, lets the user
 * walk the wizard backwards one screen at a time.
 */
function BackLink({
  onClick,
  label = "Back",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </button>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}

function CompactField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-2xs text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function EyeToggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      aria-label={on ? "Hide password" : "Show password"}
    >
      {on ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </button>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical">
      <AlertCircle className="size-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-base text-foreground">{value}</dd>
    </div>
  );
}

function Line({
  label,
  value,
  success,
}: {
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono",
          success ? "text-success" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function SeatChip({ role, count }: { role: UserRole; count: number }) {
  const s = ROLE_STYLES[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
        s.bg,
        s.text
      )}
    >
      {USER_ROLE_LABELS[role]} ·{" "}
      <span className="font-mono font-bold">{count}</span>
    </span>
  );
}

/* ── Invite Users modal — mirrors the one in User Management ──────────
 * Differences from User Management:
 *   • Site Access input is disabled and locked to the just-created site
 *     (the user hasn't reached the dashboard yet, there's only one site).
 *   • Seat counts are computed against the freshly-purchased plan's totals
 *     (MOCK_SEATS) minus whatever the user already added in this wizard.
 */
function InviteUsersModal({
  open,
  onClose,
  onInvite,
  siteName,
  currentInvites,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string[], role: InviteRole) => void;
  siteName: string;
  currentInvites: InviteRow[];
}) {
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<InviteRole>("user");

  React.useEffect(() => {
    if (open) {
      setEmails("");
      setRole("user");
    }
  }, [open]);

  const parsed = React.useMemo(() => parseEmails(emails), [emails]);

  /* Seat usage — owner is always 1 (self), admin/user counts come from
   * pending invites in the wizard. */
  const usage: Record<UserRole, { assigned: number; total: number; available: number }> =
    React.useMemo(() => {
      const make = (r: UserRole, assigned: number) => {
        const total = MOCK_SEATS[r].total;
        return { assigned, total, available: Math.max(0, total - assigned) };
      };
      return {
        owner: make("owner", 1),
        admin: make("admin", currentInvites.filter((i) => i.role === "admin").length),
        user: make("user", currentInvites.filter((i) => i.role === "user").length),
      };
    }, [currentInvites]);

  const seatsLeft = usage[role].available;
  const overSeat = parsed.valid.length > seatsLeft;
  const noSeats = seatsLeft === 0;

  const canSubmit =
    parsed.valid.length > 0 && parsed.invalid.length === 0 && !overSeat;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[520px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Invite Users</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Invitees receive a one-time email link valid for 7 days.
          </p>
        </DialogHeader>

        <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
          {/* Seat usage strip */}
          <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background p-2">
            {(["owner", "admin", "user"] as UserRole[]).map((r) => {
              const s = usage[r];
              const isLow = s.available === 0;
              const isSelected = role === r;
              return (
                <div
                  key={r}
                  className={cn(
                    "rounded-md border px-2 py-1.5 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card"
                  )}
                >
                  <div className="mb-0.5 flex items-center justify-between gap-1">
                    <RoleBadge role={r} withIcon={false} />
                    <span
                      className={cn(
                        "font-mono text-3xs font-bold",
                        isLow ? "text-sev-critical" : "text-success"
                      )}
                    >
                      {s.available} left
                    </span>
                  </div>
                  <p className="font-mono text-2xs text-muted-foreground">
                    {s.assigned} / {s.total} used
                  </p>
                </div>
              );
            })}
          </div>

          {/* Site Access — locked to the newly-created site */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Access
            </label>
            <div
              className="flex h-9 w-full cursor-not-allowed items-center gap-2 rounded-md border border-input bg-muted/30 px-3 text-base"
              aria-disabled="true"
            >
              <MapPin className="size-3.5 flex-shrink-0 text-muted-foreground" />
              <TruncatedText text={siteName || "Your new site"} className="min-w-0 flex-1 text-foreground" />
              <span className="ml-auto inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground/70">
                <LockIcon className="size-3" /> Locked to current site
              </span>
            </div>
            <p className="mt-0.5 text-2xs text-muted-foreground/70">
              Additional sites can be added later from the Sites page.
            </p>
          </div>

          {/* Emails */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Addresses
              </label>
              {parsed.valid.length > 0 && (
                <span className="text-2xs text-muted-foreground">
                  <strong
                    className={cn(
                      overSeat ? "text-sev-critical" : "text-success"
                    )}
                  >
                    {parsed.valid.length}
                  </strong>{" "}
                  valid
                  {parsed.invalid.length > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <strong className="text-sev-critical">
                        {parsed.invalid.length}
                      </strong>{" "}
                      invalid
                    </>
                  )}
                  {parsed.duplicates.length > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <strong className="text-warning">
                        {parsed.duplicates.length}
                      </strong>{" "}
                      duplicate
                    </>
                  )}
                </span>
              )}
            </div>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="alice@acme.com, bob@acme.com…"
              rows={2}
              className={cn(
                "w-full rounded-md border bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none",
                parsed.invalid.length > 0
                  ? "border-sev-critical/40 focus:border-sev-critical"
                  : "border-input focus:border-primary"
              )}
            />
            <p className="mt-0.5 text-2xs text-muted-foreground/70">
              Separate multiple emails with commas, spaces, or new lines.
            </p>
            {parsed.invalid.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.05] px-2.5 py-1.5 text-xs text-sev-critical">
                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    {parsed.invalid.length} invalid email
                    {parsed.invalid.length === 1 ? "" : "s"}:
                  </p>
                  <p className="font-mono text-2xs opacity-80">
                    {parsed.invalid.slice(0, 5).join(", ")}
                    {parsed.invalid.length > 5
                      ? ` +${parsed.invalid.length - 5} more`
                      : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Role
            </label>
            <div className="space-y-1.5">
              {(["admin", "user"] as InviteRole[]).map((r) => {
                const s = usage[r];
                const willExceed =
                  role === r && parsed.valid.length > s.available;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-md border bg-background px-2.5 py-2 text-left transition-colors",
                      role === r
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                        role === r ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {role === r && (
                        <span className="size-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <RoleBadge role={r} />
                        <span
                          className={cn(
                            "font-mono text-2xs font-bold",
                            s.available === 0
                              ? "text-sev-critical"
                              : willExceed
                                ? "text-sev-critical"
                                : s.available <= 2
                                  ? "text-warning"
                                  : "text-success"
                          )}
                        >
                          {s.available}/{s.total} seats
                        </span>
                      </div>
                      <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">
                        {USER_ROLE_DESCRIPTIONS[r]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-2xs text-muted-foreground/70">
              Owner role can only be assigned via ownership transfer.
            </p>
          </div>

          {(noSeats || overSeat) && (
            <div className="flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.06] px-2.5 py-1.5 text-xs text-sev-critical">
              <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
              <div>
                {noSeats ? (
                  <p>
                    <strong>
                      No {USER_ROLE_LABELS[role]} seats remaining.
                    </strong>{" "}
                    Upgrade your plan or remove pending invites.
                  </p>
                ) : (
                  <p>
                    <strong>Not enough seats.</strong> Inviting{" "}
                    {parsed.valid.length} but only {seatsLeft} available.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onInvite(parsed.valid, role)}
            className="gap-1.5"
          >
            <Mail className="size-3.5" />
            Send Invite
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
