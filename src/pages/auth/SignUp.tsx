import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Clock,
  MapPin,
  Shapes,
  AlertTriangle,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Plus,
  Sparkles,
  Zap,
  Rocket,
  Play,
  Pencil,
  Loader2,
  Crown,
  ShieldCheck,
  CircleUser,
  Phone,
  ChevronDown,
  Users,
  TriangleAlert,
  Trash2,
  Lock as LockIcon,
} from "lucide-react";
import { Progress } from "@accel/ui/components/ui/progress";
import { Label } from "@accel/ui/components/ui/label";
import { StatusBadge } from "@accel/ui/components/shared/StatusBadge";
import { Banner } from "@accel/ui/components/shared/Banner";
import { Button } from "@accel/ui/components/ui/button";
import { Input } from "@accel/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@accel/ui/components/ui/popover";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@accel/ui/components/ui/select";
import { Textarea } from "@accel/ui/components/ui/textarea";
import { TimeSelect } from "@accel/ui/components/shared/TimeSelect";
import { cn } from "@accel/ui/lib/utils";
import { TIMEZONES, DEFAULT_TIMEZONE } from "@/lib/timezones";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useSubscriptionsStore } from "@/stores/useSubscriptionsStore";
import { SEAT_PRICING, MOCK_SEATS } from "@/mocks/licenses";
import {
  CLOUD_PLANS,
  getCloudPlan,
  CLOUD_PLAN_TO_TIER,
  type CloudPlanId,
} from "@/mocks/cloudPlans";
import { USER_ROLE_DESCRIPTIONS, USER_ROLE_LABELS } from "@/mocks/users";
import { SeatStrip, type SeatUsage } from "@/pages/user-management";
import type { PaymentReceipt } from "@/components/app/PaymentSuccessModal";
import type { SignUpWelcome } from "./SignUpWelcomeModal";
import { SectionCard } from "@accel/ui/components/shared/SectionCard";
import { DescriptionList, DescriptionItem } from "@accel/ui/components/shared/DescriptionList";
import type { UserRole } from "@/types/users";
import { makeBlankSite } from "@/mocks/sites";
import { AuthBackground } from "@/components/app/AuthBackground";
import { AuthStepBar, type AuthStepKey } from "@/components/app/AuthStepBar";
import { PasswordStrengthBar } from "@accel/ui/components/shared/PasswordStrengthBar";
import { isStrongPassword } from "@accel/ui/components/shared/password-strength";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { Checkbox } from "@accel/ui/components/ui/checkbox";
import { Switch } from "@accel/ui/components/ui/switch";
import { ItemButton } from "@accel/ui/components/ui/item";
import { RadioGroup, RadioGroupItem } from "@accel/ui/components/ui/radio-group";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";

/* ── Wizard steps ───────────────────────────────────────────────────── */
/* Account (+ verify email) → plan (pick, payment) → site → team → review & checkout.
   Nothing is charged or created until the review step's Confirm Checkout. */
type WizardStep = "account" | "plan" | "site" | "team" | "review";
type PlanSubStep = "pick" | "payment";

function cardBrand(digits: string) {
  return digits.startsWith("4") ? "Visa" : digits.startsWith("5") ? "Mastercard" : digits.startsWith("3") ? "Amex" : "Card";
}

/* Prototype-only: the Review deep link opens on a filled-in sign-up so every section has content. */
const DEMO_SIGNUP = {
  firstName: "Delbin",
  lastName: "Arkar",
  departments: ["Security Operations"],
  phoneNumber: "9123 4567",
  email: "delbin@astra.sg",
  cardName: "Delbin Arkar",
  cardNumber: "4242 4242 4242 4242",
  expiry: "08/29",
  cvc: "123",
  billingAddress: "8 Marina Boulevard",
  billingApt: "#12-01",
  postalCode: "018984",
  siteName: "Astra HQ",
  siteAddress: "8 Marina Boulevard, Singapore 018984",
  primaryArea: "Lobby",
  invites: [
    { id: "inv-demo1", email: "maya@astra.sg", role: "admin", departments: ["Security Operations"] },
    { id: "inv-demo2", email: "jun@astra.sg", role: "user", departments: ["Facilities"] },
  ] as InviteRow[],
};

const PLAN_ICONS: Record<CloudPlanId, React.ElementType> = {
  "starter-cloud": Sparkles,
  "standard-cloud": Zap,
  "professional-cloud": Rocket,
};

/* Distinct icon colours per cloud tier — the highlighted tier wears the brand accent. */
const PLAN_COLORS: Record<CloudPlanId, { bg: string; border: string; text: string }> = {
  "starter-cloud": { bg: "bg-info/10", border: "border-info/40", text: "text-info" },
  "standard-cloud": { bg: "bg-primary/10", border: "border-primary/40", text: "text-primary-ink" },
  "professional-cloud": { bg: "bg-secondary/10", border: "border-secondary/40", text: "text-secondary-foreground" },
};

const COUNTRY_CODES: { code: string; name: string }[] = [
  { code: "+65", name: "Singapore" },
  { code: "+60", name: "Malaysia" },
  { code: "+62", name: "Indonesia" },
  { code: "+66", name: "Thailand" },
  { code: "+63", name: "Philippines" },
  { code: "+84", name: "Vietnam" },
  { code: "+91", name: "India" },
  { code: "+86", name: "China" },
  { code: "+852", name: "Hong Kong" },
  { code: "+81", name: "Japan" },
  { code: "+82", name: "South Korea" },
  { code: "+61", name: "Australia" },
  { code: "+64", name: "New Zealand" },
  { code: "+44", name: "United Kingdom" },
  { code: "+1", name: "United States" },
  { code: "+971", name: "United Arab Emirates" },
  { code: "+966", name: "Saudi Arabia" },
  { code: "+49", name: "Germany" },
  { code: "+33", name: "France" },
];

type InviteRole = "admin" | "user";

interface InviteRow {
  id: string;
  email: string;
  role: InviteRole;
  departments: string[];
}

/** Members table row: the owner (the person signing up) first, then invites. */
type MemberTableRow = { kind: "owner"; id: string } | (InviteRow & { kind: "invite" });

/* Same role colour palette used in User Management. */
const ROLE_STYLES: Record<UserRole, { tone: "success" | "info" | "warning"; icon: React.ComponentType<{ className?: string }> }> = {
  owner: { tone: "success", icon: Crown },
  admin: { tone: "info", icon: ShieldCheck },
  user: { tone: "warning", icon: CircleUser },
};

/** A role pill — the design system's StatusBadge in the role's tone, with the role icon in place of the dot. */
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
    <StatusBadge tone={s.tone} dot={false} className="gap-1 px-2">
      {withIcon && <Icon className="size-3" />}
      {USER_ROLE_LABELS[role]}
    </StatusBadge>
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
    <div data-slot="sign-up-page" className="relative flex min-h-screen flex-col text-foreground">
      <AuthBackground />

      {/* Top bar */}
      <header data-slot="sign-up-page-header" className="relative z-10 flex items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link to="/signin" className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-secondary">
            <Play className="size-3 fill-media-foreground text-media-foreground" />
          </div>
          <p className="text-md font-bold tracking-tight">Accel</p>
        </Link>
        <div className="flex-1 px-4">
          <AuthStepBar current={currentStep} />
        </div>
        <Button
          variant="outline"
          onClick={onCancel}
          className="h-auto rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:bg-card/40 hover:text-foreground dark:border-border dark:bg-card/40 dark:hover:bg-card/40"
        >
          Cancel
        </Button>
      </header>

      {/* Body — content sits near the top, not vertically centred */}
      <main data-slot="sign-up-page-content" className="relative z-10 flex flex-1 justify-center px-4 pt-6 pb-8 sm:px-6 sm:pt-10">
        <div className={cn("w-full", wide ? "max-w-[1024px]" : "max-w-[440px]")}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function SignUpPage({
  initialStep = "account",
}: {
  /** Prototype-only deep-link entry: jump the wizard to a specific step. */
  initialStep?: "account" | "plan" | "payment" | "site" | "team" | "review";
} = {}) {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setHasCreatedSite = useAuthStore((s) => s.setHasCreatedSite);
  const setHasActiveSubscription = useAuthStore((s) => s.setHasActiveSubscription);
  const addSite = useSitesStore((s) => s.addSite);
  const addSubscription = useSubscriptionsStore((s) => s.add);

  const demo = initialStep === "review";
  const [step, setStep] = React.useState<WizardStep>(
    initialStep === "payment" ? "plan" : initialStep
  );
  const [accountSubStep, setAccountSubStep] = React.useState<"form" | "otp">("form");
  const [planSubStep, setPlanSubStep] = React.useState<PlanSubStep>(
    initialStep === "payment" ? "payment" : "pick"
  );
  /* Set when a step was opened from the review page's Edit button: saving it returns to review. */
  const [editing, setEditing] = React.useState(false);
  /* False when the plan step was skipped — review then has nothing to charge. */
  const [planChosen, setPlanChosen] = React.useState(demo || initialStep === "payment");
  const [checkingOut, setCheckingOut] = React.useState(false);
  /* The plan as it was when review's Plan → Edit was pressed; review compares against it
     to show what changed. Cleared when the notice is dismissed. */
  const [planBefore, setPlanBefore] = React.useState<{
    picked: CloudPlanId;
    cycle: "monthly" | "annual";
    planChosen: boolean;
    total: number;
  } | null>(null);

  /* Account info */
  const [firstName, setFirstName] = React.useState(demo ? DEMO_SIGNUP.firstName : "");
  const [lastName, setLastName] = React.useState(demo ? DEMO_SIGNUP.lastName : "");
  const [departments, setDepartments] = React.useState<string[]>(demo ? DEMO_SIGNUP.departments : []);
  const [dialCode, setDialCode] = React.useState("+65");
  const [phoneNumber, setPhoneNumber] = React.useState(demo ? DEMO_SIGNUP.phoneNumber : "");
  const fullName = `${firstName} ${lastName}`.trim();
  const [email, setEmail] = React.useState(demo ? DEMO_SIGNUP.email : "");
  /* The address the OTP was confirmed for — editing it from review asks for a new code. */
  const [verifiedEmail, setVerifiedEmail] = React.useState(demo ? DEMO_SIGNUP.email : "");
  const [password, setPassword] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showConfirmPw, setShowConfirmPw] = React.useState(false);
  const [agreedTos, setAgreedTos] = React.useState(demo);

  /* OTP */
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [otpSending, setOtpSending] = React.useState(false);

  /* Plan + payment */
  const [picked, setPicked] = React.useState<CloudPlanId>("professional-cloud");
  const [cycle, setCycle] = React.useState<"monthly" | "annual">("annual");
  const [cardName, setCardName] = React.useState(demo ? DEMO_SIGNUP.cardName : "");
  const [cardNumber, setCardNumber] = React.useState(demo ? DEMO_SIGNUP.cardNumber : "");
  const [expiry, setExpiry] = React.useState(demo ? DEMO_SIGNUP.expiry : "");
  const [cvc, setCvc] = React.useState(demo ? DEMO_SIGNUP.cvc : "");
  const [billingAddress, setBillingAddress] = React.useState(demo ? DEMO_SIGNUP.billingAddress : "");
  const [billingApt, setBillingApt] = React.useState(demo ? DEMO_SIGNUP.billingApt : "");
  const [country, setCountry] = React.useState("Singapore");
  const [city, setCity] = React.useState("Singapore");
  const [postalCode, setPostalCode] = React.useState(demo ? DEMO_SIGNUP.postalCode : "");
  const [saveCard, setSaveCard] = React.useState(false);
  const [autoRenew, setAutoRenew] = React.useState(true);
  const [agreedCheckoutTos, setAgreedCheckoutTos] = React.useState(false);

  /* Site info */
  const [siteName, setSiteName] = React.useState(demo ? DEMO_SIGNUP.siteName : "");
  const [siteAddress, setSiteAddress] = React.useState(demo ? DEMO_SIGNUP.siteAddress : "");
  const [timezone, setTimezone] = React.useState(DEFAULT_TIMEZONE);
  const [opFrom, setOpFrom] = React.useState("08:00");
  const [opTo, setOpTo] = React.useState("18:00");
  const [siteDescription, setSiteDescription] = React.useState("");
  const [primaryArea, setPrimaryArea] = React.useState(demo ? DEMO_SIGNUP.primaryArea : "");
  const siteSlug = siteName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);
  const siteId = siteSlug ? `SITE-${siteSlug}` : "SITE-XXXX";

  /* Team */
  const [invites, setInvites] = React.useState<InviteRow[]>(demo ? DEMO_SIGNUP.invites : []);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const plan = getCloudPlan(picked);
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

  /* Each step's checks, shared by its Continue button and — when editing from review — its Back link. */
  function accountError(): string | null {
    if (firstName.trim().length < 1) return "Enter your first name.";
    if (lastName.trim().length < 1) return "Enter your last name.";
    if (departments.length === 0) return "Enter at least one department.";
    if (!email.includes("@")) return "Enter a valid email address.";
    // Password is checked on the account form only; when editing from review a blank one keeps the one already set.
    if (step === "account" && !(editing && password === "")) {
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (!isStrongPassword(password))
        return "Choose a stronger password (mix upper/lowercase, numbers, or symbols).";
      if (password !== confirmPw) return "Passwords don't match.";
    }
    if (!agreedTos) return "You must accept the Terms to continue.";
    return null;
  }

  function paymentError(): string | null {
    if (cardName.trim().length < 2) return "Enter the card holder name.";
    if (cardNumber.replace(/\s/g, "").length < 13) return "Enter a valid card number.";
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Expiry must be in MM/YY format.";
    if (cvc.length < 3) return "Enter the security code.";
    if (billingAddress.trim().length < 3) return "Enter a billing address.";
    return null;
  }

  function siteError(): string | null {
    if (siteName.trim().length < 2) return "Enter a site name.";
    if (siteAddress.trim().length < 3) return "Enter a site address.";
    if (primaryArea.trim().length < 2) return "Enter at least one area to start with.";
    return null;
  }

  /* Move on to `next` — or, when the step was opened from review, back to review. */
  function advance(next: WizardStep) {
    setError(null);
    if (editing) {
      setEditing(false);
      setStep("review");
      return;
    }
    setStep(next);
  }

  /* Review → Edit: open a step in edit mode. */
  function editStep(to: WizardStep, sub?: PlanSubStep) {
    setError(null);
    setEditing(true);
    if (to === "account") setAccountSubStep("form");
    if (to === "plan") {
      setPlanSubStep(sub ?? "pick");
      setPlanBefore({ picked, cycle, planChosen, total: totalDue });
    }
    setStep(to);
  }

  function submitAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = accountError();
    if (err) return setError(err);
    // Same address as before — no new code needed.
    if (editing && email.trim() === verifiedEmail) return advance("plan");
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
    setVerifiedEmail(email.trim());
    setOtp(["", "", "", "", "", ""]);
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
    advance("plan");
    setPlanSubStep("pick");
  }

  function selectPlan() {
    setError(null);
    setPlanChosen(true);
    // Editing from review with card details already in — no need to re-enter them.
    if (editing && paymentError() === null) return advance("site");
    setPlanSubStep("payment");
  }

  function skipPlan() {
    setPlanChosen(false);
    advance("site");
  }

  /* Payment is only collected here; the card is charged on the review step. */
  function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = paymentError();
    if (err) return setError(err);
    advance("site");
  }

  function submitSite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = siteError();
    if (err) return setError(err);
    advance("team");
  }

  function submitTeam() {
    setError(null);
    setEditing(false);
    setStep("review");
  }

  const monthlyPerSite = cycle === "annual" ? Math.round(plan.pricePerYear / 12) : plan.pricePerMonth;
  const totalDue = planChosen ? monthlyPerSite + additionalSeats * monthlyPerSeat : 0;
  /* Seats: the owner plus everyone invited, against what the chosen plan includes. */
  const seatsUsed = 1 + invites.length;
  const seatLimit = planChosen ? plan.seats : null;
  const seatsOver = seatLimit === null ? 0 : Math.max(0, seatsUsed - seatLimit);

  /* Review → Confirm Checkout: charge the card, create the site and subscription,
     then land on the dashboard, which shows the welcome modal. */
  function confirmCheckout() {
    setError(null);
    if (planChosen && !agreedCheckoutTos)
      return setError("Please accept the Terms of Service and Privacy Policy to confirm checkout.");
    // Re-check every step: an edit could have left one incomplete.
    const broken = [accountError(), planChosen ? paymentError() : null, siteError()].find(Boolean);
    if (broken) return setError(`${broken} Use Edit to fix it.`);
    if (seatsOver > 0)
      return setError(
        `${plan.name} includes ${plan.seats} seat${plan.seats === 1 ? "" : "s"}. Remove ${seatsOver} member${seatsOver === 1 ? "" : "s"} or choose a bigger plan.`
      );

    setCheckingOut(true);
    setTimeout(() => finishCheckout(), 900);
  }

  function finishCheckout() {
    const now = new Date();
    const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const renewal = new Date(now);
    if (cycle === "annual") renewal.setFullYear(renewal.getFullYear() + 1);
    else renewal.setMonth(renewal.getMonth() + 1);

    const site = makeBlankSite(siteName.trim(), "#DD7224");
    site.address = siteAddress.trim();
    site.timezone = timezone;
    site.operatingHours = { from: opFrom, to: opTo };
    site.description = siteDescription.trim() || undefined;
    site.areas = [
      {
        id: `${site.id}-area-1`,
        name: primaryArea.trim(),
        color: "#DD7224",
        points: [],
      },
    ];
    site.status = "setup";
    addSite(site);

    let receipt: PaymentReceipt | undefined;
    if (planChosen) {
      const seats = {
        owner: 1,
        admin: adminInvites,
        user: additionalSeats + includedFullSeats,
      };
      const monthlyCost =
        monthlyPerSite +
        seats.owner * SEAT_PRICING.owner.pricePerMonth +
        seats.admin * SEAT_PRICING.admin.pricePerMonth +
        seats.user * SEAT_PRICING.user.pricePerMonth;
      const fmt = (d: Date) =>
        `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en-GB", { month: "short" })} ${d.getFullYear()}`;
      addSubscription({
        id: `SUB-${now.getFullYear()}-${site.id.replace(/-/g, "").slice(0, 4).toUpperCase()}`,
        siteId: site.id,
        siteName: site.name,
        planTier: CLOUD_PLAN_TO_TIER[picked],
        status: "active",
        billingCycle: cycle,
        seats,
        startedAt: now.toISOString().slice(0, 10),
        startedDisplay: fmt(now),
        renewsAt: renewal.toISOString().slice(0, 10),
        renewsDisplay: fmt(renewal),
        monthlyCost,
      });
      const digits = cardNumber.replace(/\s/g, "");
      receipt = {
        amount: `S$${totalDue.toLocaleString()}`,
        planName: plan.name,
        cycle,
        card: `${cardBrand(digits)} ···· ${digits.slice(-4)}`,
        reference: `INV-${now.getFullYear()}-${String(totalDue).padStart(4, "0").slice(-4)}${digits.slice(-2)}`,
        date: fmtDay(now),
        renews: fmtDay(renewal),
        email: email.trim() || undefined,
      };
    }

    setHasCreatedSite(true);
    setHasActiveSubscription(true);
    completeOnboarding();
    const welcome: SignUpWelcome = {
      firstName: firstName.trim(),
      siteName: site.name,
      invited: invites.length,
      receipt,
    };
    setCheckingOut(false);
    navigate("/", { replace: true, state: { signupWelcome: welcome } });
  }

  function sendInvites(emails: string[], role: InviteRole, departments: string[]) {
    const rows: InviteRow[] = emails.map((email) => ({
      id: `inv-${Math.random().toString(36).slice(2, 6)}`,
      email,
      role,
      departments,
    }));
    setInvites((curr) => [...curr, ...rows]);
    setInviteOpen(false);
    toast.success(
      `Invited ${rows.length} ${rows.length === 1 ? "person" : "people"} as ${USER_ROLE_LABELS[role]}`
    );
  }
  /* ── Back handler — context-aware ───────────────────────────────── */
  function goBack() {
    setError(null);
    if (step === "account" && accountSubStep === "otp") {
      setAccountSubStep("form");
      return;
    }
    // Opened from review: go back to it, but only while the step is still valid.
    if (editing) {
      let err: string | null = null;
      if (step === "account")
        err = email.trim() !== verifiedEmail
          ? "You changed your email. Continue to verify the new address, or change it back."
          : accountError();
      else if (step === "plan" && planSubStep === "payment") err = paymentError();
      else if (step === "site") err = siteError();
      if (err) return setError(err);
      setEditing(false);
      setStep("review");
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
      setPlanSubStep(planChosen ? "payment" : "pick");
      return;
    }
    if (step === "team") {
      setStep("site");
      return;
    }
    if (step === "review") {
      setStep("team");
      return;
    }
    // step === account && form
    navigate("/signin");
  }

  /* While a step is open from review, its Back link and primary button lead back there. */
  const backLabel = editing ? "Back to review" : undefined;
  const saveLabel = "Save & return to review";

  /* ── Step 1: Account form ───────────────────────────────────────── */
  if (step === "account" && accountSubStep === "form") {
    return (
      <WizardShell onCancel={() => navigate("/signin")} currentStep="account">
        <BackLink onClick={goBack} label={backLabel ?? "Back to sign in"} />
        <Heading
          title={editing ? "Edit your account" : "Create your account"}
          subtitle={
            editing
              ? "Changing your work email sends a new verification code."
              : "Start a free 30-day trial. No credit card needed yet."
          }
        />
        <form data-slot="sign-up-page-account-form" onSubmit={submitAccount} className="mt-7 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name" icon={CircleUser}>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Delbin"
                className="h-10 pl-9 text-base"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name" icon={CircleUser}>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Arkar"
                className="h-10 pl-9 text-base"
                autoComplete="family-name"
              />
            </Field>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </label>
            <Input
              value={departments.join(", ")}
              onChange={(e) => setDepartments(e.target.value.split(",").map((department) => department.trim()).filter(Boolean))}
              placeholder="e.g. Security Operations"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone Number
            </label>
            <PhoneField
              dialCode={dialCode}
              number={phoneNumber}
              onDialCode={setDialCode}
              onNumber={setPhoneNumber}
            />
          </div>
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
            <Checkbox
              checked={agreedTos}
              onCheckedChange={(c) => setAgreedTos(c === true)}
              className="mt-0.5 size-3.5"
            />
            <span>
              I agree to the{" "}
              <a href="#" className="font-semibold text-primary-ink underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="font-semibold text-primary-ink underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>
          {error && <ErrorBox message={error} />}
          <Button
            type="submit"
            disabled={otpSending || accountError() !== null}
            className="h-10 w-full gap-2 text-base"
          >
            {otpSending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Sending code…
              </>
            ) : (
              <>
                {editing ? (email.trim() === verifiedEmail ? saveLabel : "Save & verify email") : "Continue"}{" "}
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </form>
        {!editing && <p data-slot="sign-up-page-footer" className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="font-semibold text-primary-ink hover:underline"
          >
            Sign in
          </Link>
        </p>}
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
        <form data-slot="sign-up-page-otp-form" onSubmit={submitOtp} className="mt-6 space-y-5">
          <div
            onPaste={otpPaste}
            className="flex items-center justify-center gap-2"
          >
            {otp.map((d, i) => (
              <Input
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
                  "px-0 py-0 shadow-none focus:border-primary focus:ring-2 focus:ring-primary/30 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 md:text-2xl dark:bg-background"
                )}
              />
            ))}
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Verify & Continue <ArrowRight className="size-3.5" />
          </Button>
          <Button
            variant="link"
            type="button"
            onClick={() =>
              toast.message("Code re-sent", {
                description: `A new code was sent to ${email}.`,
              })
            }
            className="group h-auto w-full gap-1 border-0 p-0 text-sm font-normal text-muted-foreground hover:no-underline"
          >
            Didn't get it?{" "}
            <span className="font-semibold underline transition-colors group-hover:text-primary-ink">Resend code</span>
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 2a: Plan picker ───────────────────────────────────────── */
  if (step === "plan" && planSubStep === "pick") {
    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="plan">
        <BackLink onClick={goBack} label={backLabel} />
        <Heading
          title="Select a Plan"
          subtitle="Pick the plan that fits your needs. Upgrade or add seats any time."
        />
        <div data-slot="sign-up-page-billing-cycle" className="mt-5 flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-semibold",
              cycle === "monthly" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </span>
          <Switch
            checked={cycle === "annual"}
            onCheckedChange={(on) => setCycle(on ? "annual" : "monthly")}
            aria-label="Bill annually"
          />
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

        <div data-slot="sign-up-page-plans" className="mt-5 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
          {CLOUD_PLANS.map((p) => {
            const Icon = PLAN_ICONS[p.id];
            const color = PLAN_COLORS[p.id];
            const selected = picked === p.id;
            const monthly =
              cycle === "annual"
                ? Math.round(p.pricePerYear / 12)
                : p.pricePerMonth;
            return (
              <ItemButton
                variant="plain"
                selected={selected}
                key={p.id}
                onClick={() => setPicked(p.id)}
                className={cn(
                  "relative flex-col items-stretch gap-0 rounded-xl border-2 bg-card/40 p-5 backdrop-blur-sm transition-all",
                  selected
                    ? "border-primary ring-1 ring-primary"
                    : "border-border/60 hover:border-primary/40"
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-secondary-foreground shadow-raised">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 flex-shrink-0 items-center justify-center rounded-lg border",
                      color.border,
                      color.bg
                    )}
                  >
                    <Icon className={cn("size-4", color.text)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-md font-bold text-foreground">{p.name}</p>
                    <p className="truncate text-2xs text-muted-foreground">{p.tagline}</p>
                  </div>
                  {selected && (
                    <CheckCircle2 className="ml-auto size-4 flex-shrink-0 text-primary-ink" />
                  )}
                </div>

                <div className="mt-4 flex min-h-[3.25rem] flex-col justify-end">
                  {p.free ? (
                    <>
                      <p className="font-mono text-3xl font-bold leading-none text-foreground">Free</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {p.trialDays}-day trial
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="leading-none">
                        <span className="align-top text-sm font-semibold text-muted-foreground">S$</span>
                        <span className="font-mono text-3xl font-bold text-foreground">
                          {monthly.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground"> / mo</span>
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {cycle === "annual"
                          ? `S$${p.pricePerYear.toLocaleString()} billed yearly`
                          : "per site, billed monthly"}
                      </p>
                    </>
                  )}
                </div>

                <div className="my-4 border-t border-border/60" />

                <ul className="flex flex-1 flex-col gap-1.5 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className={cn("mt-0.5 size-3 flex-shrink-0", color.text)}
                        strokeWidth={3}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {p.footnote && (
                  <p className="mt-3 border-t border-border/60 pt-3 text-3xs leading-relaxed text-muted-foreground">
                    {p.footnote}
                  </p>
                )}
              </ItemButton>
            );
          })}
        </div>

        <div data-slot="sign-up-page-enterprise" className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/40 px-5 py-3.5 backdrop-blur-sm">
          <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
            <Building2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">Enterprise Cloud</p>
            <p className="text-2xs text-muted-foreground">
              Custom sites, retention and SLAs for regulated or 24/7 operations. For Enterprise plans, contact our support.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-9 flex-shrink-0 gap-1.5 text-sm"
            onClick={() =>
              toast.message("Enterprise enquiry", {
                description: "Our team will reach out within 1 business day.",
              })
            }
          >
            <Mail className="size-3.5" />
            Contact support
          </Button>
        </div>
        <div data-slot="sign-up-page-plan-actions" className="mt-6 flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={skipPlan} className="h-10 text-base">
            Skip
          </Button>
          <Button onClick={selectPlan} className="h-10 gap-2 px-8 text-base">
            {editing && paymentError() === null ? saveLabel : "Select this Plan"} <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </WizardShell>
    );
  }

  /* ── Step 2b: Payment ───────────────────────────────────────────── */
  if (step === "plan" && planSubStep === "payment") {
    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="plan">
        <BackLink onClick={goBack} label={backLabel} />
        <Heading
          title="Enter your payment details"
          subtitle="You won't be charged yet. You'll confirm payment on the review step at the end."
        />
        <form data-slot="sign-up-page-payment-form"
          onSubmit={submitPayment}
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]"
        >
          <div className="rounded-lg border border-border/60 bg-card/40 p-5 backdrop-blur-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Card Information
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CompactField label="Card Holder Name">
                <Input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Enter card holder name"
                  className="h-9 text-base"
                />
              </CompactField>
              <CompactField label="Card Number">
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(fmtCard(e.target.value))}
                  placeholder="4111 1111 1111 1111"
                  className="h-9 text-base"
                  inputMode="numeric"
                />
              </CompactField>
              <CompactField label="Expiry Date">
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(fmtExpiry(e.target.value))}
                  placeholder="MM/YY"
                  className="h-9 text-base"
                  inputMode="numeric"
                />
              </CompactField>
              <CompactField label="Security Code (CVV)">
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
              <Checkbox
                checked={saveCard}
                onCheckedChange={(c) => setSaveCard(c === true)}
                className="size-3.5"
              />
              Save for future purchases
            </label>
            <hr className="my-3 border-border/60" />
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Billing Information
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <CompactField label="Billing Address">
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
              <CompactField label="Country">
                <Select value={country} onValueChange={(v) => setCountry(v)}>
                  <SelectTrigger className="h-9 w-full text-base">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "Singapore",
                      "Malaysia",
                      "Thailand",
                      "United States",
                      "United Kingdom",
                      "Australia",
                    ].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CompactField>
              <CompactField label="City">
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Select city"
                  className="h-9 text-base"
                />
              </CompactField>
              <CompactField label="Postal Code">
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Enter postal code"
                  className="h-9 text-base"
                />
              </CompactField>
            </div>
          </div>

          <div className="self-start rounded-lg border border-border/60 bg-card/40 p-5 pr-6 backdrop-blur-sm">
            <p className="mb-3 text-base font-bold text-foreground">
              Your {plan.name} Plan
            </p>
            <RadioGroup
              name="cycle"
              value={cycle}
              onValueChange={(v) => setCycle(v as typeof cycle)}
              className="mb-3 gap-1.5"
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="annual" className="size-3.5" />
                Annual
                <span className="ml-auto rounded-full bg-success/15 px-1.5 py-0.5 text-3xs font-bold text-success">
                  Save 17%
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="monthly" className="size-3.5" />
                Monthly
              </label>
            </RadioGroup>
            <div className="space-y-1.5 border-t border-border/60 pt-2.5 text-sm">
              <Line label="1 Owner seat (included)" value="Free" success />
              <Line
                label={`Plan (${plan.name})`}
                value={plan.free ? "Free" : `S$${monthlyPerSite.toLocaleString()}/mo`}
                success={plan.free}
              />
              {additionalSeats > 0 && (
                <Line
                  label={`${additionalSeats} additional seat${additionalSeats === 1 ? "" : "s"}`}
                  value={`S$${(additionalSeats * monthlyPerSeat).toLocaleString()}/mo`}
                />
              )}
            </div>
            <div className="mt-2.5 flex justify-between border-t border-border/60 pt-2.5 text-base font-semibold">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono text-foreground">
                S$
                {(
                  monthlyPerSite + additionalSeats * monthlyPerSeat
                ).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-2xs text-muted-foreground">
              Total (incl. taxes) and checkout on the review step.
            </p>
          </div>

          {error && (
            <div className="lg:col-span-2">
              <ErrorBox message={error} />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 lg:col-span-2">
            <Button type="submit" className="h-10 gap-1.5 text-base">
              {editing ? saveLabel : "Continue"} <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 3: Site info ──────────────────────────────────────────── */
  if (step === "site") {
    return (
      <WizardShell onCancel={() => navigate("/signin")} currentStep="site">
        <BackLink onClick={goBack} label={backLabel} />
        <Heading
          title="Create your first site"
          subtitle="A site is a physical location with cameras. You can add more later."
        />
        <form data-slot="sign-up-page-site-form" onSubmit={submitSite} className="mt-7 space-y-4">
          <Field label="Site name" icon={Building2}>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Astra HQ"
              className="h-10 pl-9 text-base"
            />
          </Field>
          <Field label="Site ID (auto-generated)" icon={LockIcon}>
            <Input
              value={siteId}
              readOnly
              disabled
              placeholder="SITE-XXXX"
              className="h-10 cursor-not-allowed bg-muted/30 pl-9 font-mono text-base text-muted-foreground"
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
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Timezone
              </label>
              <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
                <SelectTrigger className="h-10 w-full text-base">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3" /> Operating Hours
              </label>
              <div className="flex items-center gap-2">
                <TimeSelect
                  value={opFrom}
                  onChange={setOpFrom}
                  aria-label="Opening time"
                  className="h-10 flex-1"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <TimeSelect
                  value={opTo}
                  onChange={setOpTo}
                  aria-label="Closing time"
                  className="h-10 flex-1"
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
              Description (Optional)
            </label>
            <Textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={2}
              placeholder="A short description of this site…"
              className="w-full text-base"
            />
          </div>
          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-1.5 text-base">
            {editing ? saveLabel : "Continue"} <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Step 4: Invite team ────────────────────────────────────────── */
  if (step === "team") {
    const adminCount = invites.filter((i) => i.role === "admin").length;
    const userCount = invites.filter((i) => i.role === "user").length;
    const mkSeat = (r: UserRole, assigned: number): SeatUsage => ({
      role: r,
      total: MOCK_SEATS[r].total,
      assigned,
      available: Math.max(0, MOCK_SEATS[r].total - assigned),
      // Nobody has accepted yet at sign-up, so every invited seat is pending.
      // The owner seat is the person filling this in — already active.
      pending: r === "owner" ? 0 : assigned,
      price: MOCK_SEATS[r].pricePerMonth,
      label: MOCK_SEATS[r].label,
    });
    const seatUsage: Record<UserRole, SeatUsage> = {
      owner: mkSeat("owner", 1),
      admin: mkSeat("admin", adminCount),
      user: mkSeat("user", userCount),
    };
    // The person signing up is the owner and heads the list.
    const memberRows: MemberTableRow[] = [
      { kind: "owner", id: "__owner" },
      ...invites.map((inv): MemberTableRow => ({ ...inv, kind: "invite" })),
    ];
    const memberColumns: DataTableColumn<MemberTableRow>[] = [
      {
        key: "user",
        header: "USER",
        cell: (row) =>
          row.kind === "owner" ? (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-sm font-semibold text-primary-ink">
                {fullName
                  .split(" ")
                  .map((p) => p[0]?.toUpperCase())
                  .slice(0, 2)
                  .join("") || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {fullName || "You"}
                  <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                    (You)
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                <Mail className="size-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {row.email.split("@")[0]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {row.email}
                </p>
              </div>
            </div>
          ),
      },
      {
        key: "userId",
        header: "USER ID",
        className: "font-mono text-xs text-muted-foreground",
        headClassName: "",
        cell: (row) =>
          row.kind === "owner" ? "USR-001" : <span className="text-muted-foreground">—</span>,
      },
      {
        key: "role",
        header: "ROLE",
        cell: (row) => <RoleBadge role={row.kind === "owner" ? "owner" : row.role} />,
      },
      {
        key: "status",
        header: "STATUS",
        cell: (row) =>
          row.kind === "owner" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-warning">
              Pending
            </span>
          ),
      },
      {
        key: "includes",
        header: "INCLUDES",
        className: "text-sm text-muted-foreground",
        headClassName: "",
        cell: (row) => USER_ROLE_DESCRIPTIONS[row.kind === "owner" ? "owner" : row.role],
      },
      {
        key: "actions",
        header: <span className="sr-only">Actions</span>,
        headClassName: "w-10",
        cell: (row) =>
          row.kind === "owner" ? null : (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setInvites((curr) => curr.filter((i) => i.id !== row.id))}
              aria-label={`Remove ${row.email}`}
              className="text-muted-foreground hover:text-severity-critical"
            >
              <Trash2 className="size-3.5" />
            </Button>
          ),
      },
    ];

    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="team">
        <BackLink onClick={goBack} label={backLabel} />
        <Heading
          title="Invite your team to collaborate"
          subtitle="Choose the type of access each team member will need. You can adjust later."
        />

        <div data-slot="sign-up-page-seats" className="mt-6">
          <SeatStrip usage={seatUsage} billingCycle="Monthly" />
        </div>

        <div data-slot="sign-up-page-members-toolbar" className="mt-5 flex items-center justify-between">
          <p className="text-base font-bold text-foreground">Members</p>
          <Button onClick={() => setInviteOpen(true)} className="h-9 gap-1.5">
            <Plus className="size-3.5" />
            Invite Users
          </Button>
        </div>

        <div data-slot="sign-up-page-members-list" className="mt-3 flex max-h-[calc(100vh-22rem)] flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm">
          {/* The Table wrapper must not become the scroll container, or the sticky header stops sticking. */}
          <div className="flex-1 overflow-y-auto [&>[data-slot=table-container]]:overflow-visible">
            <DataTable
              variant="list"
              stickyHeader
              columns={memberColumns}
              data={memberRows}
              getRowId={(row) => row.id}
              getRowClassName={() => "transition-colors"}
            />
          </div>

          <div className="flex-shrink-0 border-t border-border/60 bg-muted/10 px-4 py-2 text-right text-sm text-muted-foreground">
            Current Total:{" "}
            <strong className="text-foreground">{1 + invites.length}</strong>{" "}
            assigned seat{invites.length === 0 ? "" : "s"}
          </div>

          <div className="sticky bottom-0 z-10 flex flex-shrink-0 items-center justify-end gap-2 border-t border-border bg-card px-4 py-3.5">
            <Button onClick={submitTeam} className="h-10 gap-1.5">
              {editing ? saveLabel : "Continue to review"}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
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

  /* ── Step 5: Review & checkout ──────────────────────────────────── */
  if (step === "review") {
    const digits = cardNumber.replace(/\s/g, "");
    const tzLabel = TIMEZONES.find((tz) => tz.value === timezone)?.label ?? timezone;
    const PlanIcon = PLAN_ICONS[picked];
    const billingLines = [
      [billingAddress, billingApt].filter(Boolean).join(", "),
      [city, postalCode].filter(Boolean).join(" "),
      country,
    ].filter(Boolean);

    /* Members table: the owner first, then invites. The owner takes the first seat,
       so invites past the plan's limit are flagged. */
    const reviewMemberRows: MemberTableRow[] = [
      { kind: "owner", id: "__owner" },
      ...invites.map((inv): MemberTableRow => ({ ...inv, kind: "invite" })),
    ];
    const overLimitIds = new Set(
      seatLimit === null ? [] : invites.filter((_, i) => i + 2 > seatLimit).map((inv) => inv.id)
    );
    const reviewMemberColumns: DataTableColumn<MemberTableRow>[] = [
      {
        key: "member",
        header: "MEMBER",
        cell: (row) => (
          <div className="min-w-0">
            <TruncatedText
              text={row.kind === "owner" ? `${fullName || "You"} (You)` : row.email.split("@")[0]}
              className="text-sm font-semibold text-foreground"
            />
            <TruncatedText text={row.kind === "owner" ? email : row.email} className="text-xs text-muted-foreground" />
          </div>
        ),
      },
      {
        key: "role",
        header: "ROLE",
        align: "right",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1.5">
            {overLimitIds.has(row.id) && (
              <StatusBadge tone="warning" dot={false} className="gap-1 px-2">
                <TriangleAlert className="size-3" /> Over limit
              </StatusBadge>
            )}
            <RoleBadge role={row.kind === "owner" ? "owner" : row.role} />
          </div>
        ),
      },
    ];

    /* What changed since Plan → Edit was pressed, for the notice above the heading. */
    const before = planBefore;
    const planChanged =
      !!before && (before.picked !== picked || before.cycle !== cycle || before.planChosen !== planChosen);
    const cycleName = (c: "monthly" | "annual") => (c === "annual" ? "Annual" : "Monthly");
    let notice: { title: string; detail: string } | null = null;
    if (before && planChanged) {
      const beforePlan = getCloudPlan(before.picked);
      const beforeName = before.planChosen ? beforePlan.name : "Free trial";
      const afterName = planChosen ? plan.name : "Free trial";
      const title =
        beforeName !== afterName
          ? `Plan changed · ${beforeName} → ${afterName}`
          : `Billing changed · ${cycleName(before.cycle)} → ${cycleName(cycle)}`;
      const beforeLimit = before.planChosen ? beforePlan.seats : null;
      const seatsText =
        seatLimit === null
          ? "You'll start on the free trial and can subscribe any time from Billing."
          : seatsOver > 0
            ? `${afterName} includes ${seatLimit} seat${seatLimit === 1 ? "" : "s"}, but your team has ${seatsUsed}. Remove ${seatsOver} member${seatsOver === 1 ? "" : "s"} or choose a bigger plan before checking out.`
            : `Your team now has ${seatLimit} seat${seatLimit === 1 ? "" : "s"} (${seatsUsed} in use)${beforeLimit !== null && beforeLimit !== seatLimit ? `, was ${beforeLimit}` : ""}.`;
      const totalText =
        before.total !== totalDue
          ? ` Total due today S$${before.total.toLocaleString()} → S$${totalDue.toLocaleString()}.`
          : "";
      notice = { title, detail: seatsText + totalText };
    }

    return (
      <WizardShell wide onCancel={() => navigate("/signin")} currentStep="review">
        <BackLink onClick={goBack} />
        {notice && (
          <Banner
            data-slot="sign-up-page-plan-change-alert"
            tone={seatsOver > 0 ? "warning" : "info"}
            title={notice.title}
            action={
              seatsOver > 0 ? (
                <Button variant="outline" size="sm" onClick={() => editStep("team")} className="h-8 text-sm">
                  Edit members
                </Button>
              ) : undefined
            }
            onDismiss={() => setPlanBefore(null)}
            dismissLabel="Dismiss plan change notice"
            className="mb-5"
          >
            {notice.detail}
          </Banner>
        )}
        <Heading
          title="Review and confirm"
          subtitle="Check everything before we activate your workspace. Use Edit to change a section, then come back here to check out."
        />
        <div data-slot="sign-up-page-review" className="mt-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_340px]">
          {/* On wide screens only the sections scroll; the checkout panel stays put beside them. */}
          <div
            data-slot="sign-up-page-review-sections"
            className={cn(
              "space-y-3 lg:overflow-y-auto lg:overscroll-contain lg:pr-2",
              notice ? "lg:max-h-[calc(100vh-21rem)]" : "lg:max-h-[calc(100vh-16rem)]"
            )}
          >
            <ReviewSection title="Account" icon={CircleUser} onEdit={() => editStep("account")}>
              <DescriptionList columns={2}>
                <DescriptionItem label="Name">{fullName || "—"}</DescriptionItem>
                <DescriptionItem label="Department">{departments.join(", ") || "—"}</DescriptionItem>
                <DescriptionItem label="Work email">
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    {email || "—"}
                    {email && email.trim() === verifiedEmail && (
                      <StatusBadge tone="success" dot={false} className="gap-1 px-2">
                        <Check className="size-3" strokeWidth={3} /> Verified
                      </StatusBadge>
                    )}
                  </span>
                </DescriptionItem>
                <DescriptionItem label="Phone" mono>
                  {phoneNumber ? `${dialCode} ${phoneNumber}` : "—"}
                </DescriptionItem>
              </DescriptionList>
            </ReviewSection>

            <ReviewSection title="Plan" icon={PlanIcon} onEdit={() => editStep("plan", "pick")}>
              {planChosen ? (
                <DescriptionList columns={2}>
                  <DescriptionItem label="Plan">{plan.name}</DescriptionItem>
                  <DescriptionItem label="Billing cycle">
                    {cycle === "annual" ? "Annual (save 17%)" : "Monthly"}
                  </DescriptionItem>
                  <DescriptionItem label="Price" mono>
                    {plan.free
                      ? "Free"
                      : cycle === "annual"
                        ? `S$${plan.pricePerYear.toLocaleString()} / year per site`
                        : `S$${plan.pricePerMonth.toLocaleString()} / month per site`}
                  </DescriptionItem>
                  <DescriptionItem label="Auto-renew">{autoRenew ? "On" : "Off"}</DescriptionItem>
                </DescriptionList>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No plan selected. You'll start on the free trial and can subscribe any time from Billing.
                </p>
              )}
            </ReviewSection>

            {planChosen && (
              <ReviewSection title="Payment" icon={CreditCard} onEdit={() => editStep("plan", "payment")}>
                <DescriptionList columns={2}>
                  <DescriptionItem label="Card" mono>
                    {digits ? `${cardBrand(digits)} ···· ${digits.slice(-4)}` : "—"}
                  </DescriptionItem>
                  <DescriptionItem label="Expires" mono>{expiry || "—"}</DescriptionItem>
                  <DescriptionItem label="Card holder">{cardName || "—"}</DescriptionItem>
                  <DescriptionItem label="Billing address">{billingLines.join(" · ") || "—"}</DescriptionItem>
                </DescriptionList>
              </ReviewSection>
            )}

            <ReviewSection title="Site" icon={Building2} onEdit={() => editStep("site")}>
              <DescriptionList columns={2}>
                <DescriptionItem label="Site name">{siteName || "—"}</DescriptionItem>
                <DescriptionItem label="Site ID" mono>{siteId}</DescriptionItem>
                <DescriptionItem label="Address" wide>{siteAddress || "—"}</DescriptionItem>
                <DescriptionItem label="Timezone">{tzLabel}</DescriptionItem>
                <DescriptionItem label="Operating hours" mono>{`${opFrom} – ${opTo}`}</DescriptionItem>
                <DescriptionItem label="Primary area">{primaryArea || "—"}</DescriptionItem>
                {siteDescription.trim() && (
                  <DescriptionItem label="Description" wide>{siteDescription.trim()}</DescriptionItem>
                )}
              </DescriptionList>
            </ReviewSection>

            <ReviewSection
              title="Members"
              description={
                seatLimit === null
                  ? `${seatsUsed} seat${seatsUsed === 1 ? "" : "s"} · invitations go out when you confirm`
                  : `${seatsUsed} of ${seatLimit} seats used on ${plan.name} · invitations go out when you confirm`
              }
              icon={Users}
              onEdit={() => editStep("team")}
              flushBody
              tone={seatsOver > 0 ? "warning" : planChanged ? "info" : undefined}
              badge={
                seatsOver > 0 ? (
                  <StatusBadge tone="warning">{seatsOver} over limit</StatusBadge>
                ) : planChanged ? (
                  <StatusBadge tone="info">Updated for {planChosen ? plan.name : "free trial"}</StatusBadge>
                ) : undefined
              }
            >
              {seatLimit !== null && (
                <div data-slot="sign-up-page-review-seats" className="px-4 pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Seats</span>
                    <span className={cn("font-mono font-semibold", seatsOver > 0 ? "text-warning" : "text-foreground")}>
                      {seatsUsed} / {seatLimit}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, (seatsUsed / seatLimit) * 100)}
                    aria-label={`${seatsUsed} of ${seatLimit} seats used`}
                    className={cn(
                      "h-1.5",
                      seatsOver > 0 && "bg-warning/20 *:data-[slot=progress-indicator]:bg-warning"
                    )}
                  />
                </div>
              )}
              <DataTable
                variant="list"
                className="mt-1"
                columns={reviewMemberColumns}
                data={reviewMemberRows}
                getRowId={(row) => row.id}
                getRowClassName={(row) => (overLimitIds.has(row.id) ? "bg-warning/5" : undefined)}
              />
            </ReviewSection>
          </div>

          <SectionCard
            data-slot="sign-up-page-checkout"
            title="Checkout"
            headingLevel={2}
            className="border-border/60 bg-card/40 backdrop-blur-sm"
          >
            {planChosen ? (
              <>
                <DescriptionList layout="inline">
                  <DescriptionItem label="1 Owner seat (included)">
                    <span className="text-success">Free</span>
                  </DescriptionItem>
                  <DescriptionItem label={`${plan.name} plan${cycle === "annual" ? " (annual)" : ""}`} mono>
                    {plan.free ? (
                      <span className="text-success">Free</span>
                    ) : (
                      `S$${monthlyPerSite.toLocaleString()}`
                    )}
                  </DescriptionItem>
                  {additionalSeats > 0 && (
                    <DescriptionItem
                      label={`${additionalSeats} additional seat${additionalSeats === 1 ? "" : "s"}`}
                      mono
                    >
                      {`S$${(additionalSeats * monthlyPerSeat).toLocaleString()}`}
                    </DescriptionItem>
                  )}
                  <DescriptionItem label="Subtotal" mono>{`S$${totalDue.toLocaleString()}`}</DescriptionItem>
                  <DescriptionItem label="Tax (0%)" mono>S$0.00</DescriptionItem>
                  <DescriptionItem
                    label={<span className="text-base font-bold text-foreground">Total due today</span>}
                  >
                    <span className="font-mono text-base font-bold">{`S$${totalDue.toLocaleString()}`}</span>
                  </DescriptionItem>
                </DescriptionList>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CreditCard className="size-3.5" />
                  Charged to {digits ? `${cardBrand(digits)} ···· ${digits.slice(-4)}` : "your card"}
                </p>
              </>
            ) : (
              <DescriptionList layout="inline">
                <DescriptionItem label="Free trial">
                  <span className="text-success">S$0</span>
                </DescriptionItem>
                <DescriptionItem label={<span className="text-base font-bold text-foreground">Due today</span>}>
                  <span className="font-mono text-base font-bold">S$0</span>
                </DescriptionItem>
              </DescriptionList>
            )}
            {planChosen && (
              <div className="mt-4 space-y-2.5">
                <Label className="items-start text-xs leading-normal font-normal text-muted-foreground">
                  <Checkbox
                    checked={autoRenew}
                    onCheckedChange={(c) => setAutoRenew(c === true)}
                    className="mt-0.5 size-3.5"
                  />
                  <span>
                    Auto-renewal of subscription. Your subscription will renew based on your selected billing cycle.
                  </span>
                </Label>
                <Label className="items-start text-xs leading-normal font-normal text-muted-foreground">
                  <Checkbox
                    checked={agreedCheckoutTos}
                    onCheckedChange={(c) => setAgreedCheckoutTos(c === true)}
                    className="mt-0.5 size-3.5"
                  />
                  <span>
                    I agree to{" "}
                    <a href="#" className="text-primary-ink underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-primary-ink underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </Label>
              </div>
            )}
            {seatsOver > 0 && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-warning">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                Remove {seatsOver} member{seatsOver === 1 ? "" : "s"} or choose a bigger plan to check out.
              </p>
            )}
            {error && (
              <div className="mt-3">
                <ErrorBox message={error} />
              </div>
            )}
            <Button
              onClick={confirmCheckout}
              disabled={checkingOut || seatsOver > 0 || (planChosen && !agreedCheckoutTos)}
              className="mt-4 h-10 w-full gap-1.5 text-base"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {planChosen ? "Processing payment…" : "Setting up…"}
                </>
              ) : planChosen ? (
                <>
                  <CreditCard className="size-3.5" />
                  Confirm checkout · S${totalDue.toLocaleString()}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Finish setup
                </>
              )}
            </Button>
          </SectionCard>
        </div>
      </WizardShell>
    );
  }

  return null;
}

/** One section of the review page: what was entered on a step, with an Edit button back to it. */
function ReviewSection({
  title,
  description,
  icon: Icon,
  onEdit,
  tone,
  badge,
  flushBody,
  children,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  onEdit: () => void;
  /** No body padding — for a table that runs edge to edge. */
  flushBody?: boolean;
  /** Outline the section when something elsewhere changed it (e.g. a plan change). */
  tone?: "info" | "warning";
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SectionCard
      size="sm"
      headingLevel={2}
      flushBody={flushBody}
      title={
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          {title}
          {badge}
        </span>
      }
      description={description}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          aria-label={`Edit ${title.toLowerCase()}`}
          className="h-8 gap-1.5 text-sm"
        >
          <Pencil className="size-3.5" /> Edit
        </Button>
      }
      className={cn(
        "bg-card/40 backdrop-blur-sm",
        tone === "warning" ? "border-warning/40" : tone === "info" ? "border-info/40" : "border-border/60"
      )}
    >
      {children}
    </SectionCard>
  );
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
    <Button
      variant="link"
      type="button"
      onClick={onClick}
      className="mb-4 h-auto gap-1.5 border-0 p-0 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground hover:no-underline"
    >
      <ArrowLeft className="size-3.5" />
      {label}
    </Button>
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

function PhoneField({
  dialCode,
  number,
  onDialCode,
  onNumber,
}: {
  dialCode: string;
  number: string;
  onDialCode: (code: string) => void;
  onNumber: (n: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const list = COUNTRY_CODES.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.includes(query)
  );

  return (
    <div className="flex h-10 w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-primary">
      <Popover
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            type="button"
            className="h-auto flex-shrink-0 gap-1 rounded-none border-0 border-r border-input px-3 font-mono text-base font-normal text-foreground transition-colors hover:bg-muted/40 hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground dark:hover:bg-muted/40"
          >
            <Phone className="size-3.5 text-muted-foreground" />
            {dialCode}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-1.5">
          <ToolbarSearch
            size="sm"
            value={query}
            onChange={setQuery}
            placeholder="Search country or code"
            className="mb-1"
            inputClassName="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none shadow-none md:text-sm dark:bg-background focus-visible:border-primary focus-visible:ring-0"
          />
          <div className="max-h-56 overflow-y-auto">
            {list.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                No match
              </p>
            ) : (
              list.map((c) => (
                <ItemButton
                  variant="plain"
                  selected={c.code === dialCode}
                  key={c.code}
                  onClick={() => {
                    onDialCode(c.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60",
                    c.code === dialCode && "bg-primary/10"
                  )}
                >
                  <span className="truncate text-foreground">{c.name}</span>
                  <span className="flex-shrink-0 font-mono text-xs text-muted-foreground">
                    {c.code}
                  </span>
                </ItemButton>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        value={number}
        onChange={(e) => onNumber(e.target.value)}
        placeholder="9123 4567"
        inputMode="tel"
        autoComplete="tel-national"
        className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:outline-none rounded-none border-0 py-0 shadow-none md:text-base dark:bg-transparent focus-visible:ring-0"
      />
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
    <Button
      variant="ghost"
      size="icon-xs"
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 size-auto -translate-y-1/2 border-0 p-0 text-muted-foreground hover:bg-transparent hover:text-foreground active:not-aria-[haspopup]:-translate-y-1/2 dark:hover:bg-transparent"
      aria-label={on ? "Hide password" : "Show password"}
    >
      {on ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
    </Button>
  );
}

/** A form error under the fields — the design system's Banner, compact. */
function ErrorBox({ message }: { message: string }) {
  return (
    <Banner tone="critical" size="sm">
      {message}
    </Banner>
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

/* ── Invite Users modal — mirrors the one in User Management ──────────
 * Differences from User Management:
 *   • Site Access input is disabled and locked to the just-created site
 *     (the user hasn't reached the dashboard yet, there's only one site).
 *   • Seat counts are computed against the freshly-purchased plan's totals
 *     (MOCK_SEATS) minus whatever the user already added in this wizard.
 */
export function InviteUsersModal({
  open,
  onClose,
  onInvite,
  siteName,
  currentInvites,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string[], role: InviteRole, departments: string[]) => void;
  siteName: string;
  currentInvites: InviteRow[];
}) {
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<InviteRole>("user");
  const [departments, setDepartments] = React.useState<string[]>([]);

  // Clear the form each time the modal opens (adjusted during render rather
  // than in an effect).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setEmails("");
      setRole("user");
      setDepartments([]);
    }
  }

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
    parsed.valid.length > 0 && parsed.invalid.length === 0 && departments.length > 0 && !overSeat;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Invite Users"
          description="Invitees receive a one-time email link valid for 7 days."
        />

        <ModalBody className="space-y-3.5">
          {/* Seat tiles double as the role selector — pick a tier to invite into. */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Seat Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background p-2">
              {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                const s = usage[r];
                const isLow = s.available === 0;
                const isSelected = role === r;
                // Owner is assigned only via ownership transfer — not invitable here.
                const selectable = r !== "owner";
                return (
                  <ItemButton
                    variant="plain"
                    selected={isSelected}
                    key={r}
                    disabled={!selectable}
                    onClick={() => selectable && setRole(r as InviteRole)}
                    className={cn(
                      "flex-col items-stretch gap-0 rounded-md border px-2 py-1.5 transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                      selectable ? "hover:border-primary/40" : "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-1">
                      <RoleBadge role={r} withIcon={false} />
                      <span
                        className={cn(
                          "font-mono text-3xs font-bold",
                          isLow ? "text-severity-critical" : "text-success"
                        )}
                      >
                        {s.available} left
                      </span>
                    </div>
                    <p className="font-mono text-2xs text-muted-foreground">
                      {s.assigned} / {s.total} used
                    </p>
                  </ItemButton>
                );
              })}
            </div>
            <p className="mt-1 text-2xs text-muted-foreground">
              Owner role can only be assigned via ownership transfer.
            </p>
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
              <span className="ml-auto inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground">
                <LockIcon className="size-3" /> Locked to current site
              </span>
            </div>
            <p className="mt-0.5 text-2xs text-muted-foreground">
              Additional sites can be added later from the Sites page.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </label>
            <Input
              value={departments.join(", ")}
              onChange={(e) => setDepartments(e.target.value.split(",").map((department) => department.trim()).filter(Boolean))}
              placeholder="e.g. Security Operations"
            />
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
                      overSeat ? "text-severity-critical" : "text-success"
                    )}
                  >
                    {parsed.valid.length}
                  </strong>{" "}
                  valid
                  {parsed.invalid.length > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <strong className="text-severity-critical">
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
            <Textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="alice@acme.com, bob@acme.com…"
              rows={2}
              className={cn(
                "w-full text-base",
                parsed.invalid.length > 0
                  ? "border-severity-critical/40 focus:border-severity-critical"
                  : "focus:border-primary"
              )}
            />
            <p className="mt-0.5 text-2xs text-muted-foreground">
              Separate multiple emails with commas, spaces, or new lines.
            </p>
            {parsed.invalid.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-severity-critical/30 bg-severity-critical/[0.05] px-2.5 py-1.5 text-xs text-severity-critical">
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

          {(noSeats || overSeat) && (
            <div className="flex items-start gap-2 rounded-md border border-severity-critical/30 bg-severity-critical/[0.06] px-2.5 py-1.5 text-xs text-severity-critical">
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
        </ModalBody>

        <ModalFooter>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onInvite(parsed.valid, role, departments)}
            className="gap-1.5"
          >
            <Mail className="size-3.5" />
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
