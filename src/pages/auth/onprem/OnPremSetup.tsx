import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Clock,
  Shapes,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  Play,
  KeyRound,
  Upload,
  Cpu,
  ShieldCheck,
  WifiOff,
  Wifi,
  Globe,
  Copy,
  Printer,
  RefreshCcw,
  CheckCircle2,
  HardDrive,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { makeBlankSite } from "@/mocks/sites";
import { AuthBackground } from "@/components/shared/AuthBackground";
import { OnPremStepBar, type OnPremStepKey } from "@/components/shared/OnPremStepBar";
import { PasswordStrengthBar } from "@/components/shared/PasswordStrengthBar";

/* ── Constants ──────────────────────────────────────────────────────── */

const HARDWARE_FINGERPRINT = "FP-7A4E:9B2C:E118:F034:NX-JETSON-ORIN-AGX-64";

const TIMEZONES = [
  "Asia/Singapore (SGT · UTC+8)",
  "Asia/Bangkok (ICT · UTC+7)",
  "Asia/Jakarta (WIB · UTC+7)",
  "Asia/Kuala_Lumpur (MYT · UTC+8)",
  "Asia/Tokyo (JST · UTC+9)",
  "Asia/Dubai (GST · UTC+4)",
  "Europe/London (BST · UTC+0)",
  "America/New_York (EST · UTC-5)",
  "Australia/Sydney (AEST · UTC+10)",
  "UTC",
];

const COUNTRIES = [
  "Singapore",
  "Indonesia",
  "Malaysia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "Australia",
  "United Kingdom",
  "United States",
  "Other",
];

type NetworkMode = "airgapped" | "hybrid" | "connected";
const NETWORK_MODES: {
  key: NetworkMode;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "airgapped",
    label: "Air-gapped",
    description: "No internet · defence-grade",
    icon: WifiOff,
  },
  {
    key: "hybrid",
    label: "Hybrid",
    description: "Internet for updates only",
    icon: Wifi,
  },
  {
    key: "connected",
    label: "Connected",
    description: "Full internet · cloud sync",
    icon: Globe,
  },
];

type OperatorRole = "manager" | "operator" | "viewer";
type FirstLoginMethod = "setup-code" | "temp-password";

interface Operator {
  id: string;
  fullName: string;
  username: string;
  role: OperatorRole;
  firstLogin: FirstLoginMethod;
  setupCode?: string;
}

const OPERATOR_ROLE_LABELS: Record<OperatorRole, string> = {
  manager: "Site Manager",
  operator: "Operator",
  viewer: "Viewer",
};

const OPERATOR_ROLE_STYLES: Record<OperatorRole, string> = {
  manager: "bg-info/15 border-info/30 text-info",
  operator: "bg-secondary/15 border-secondary/30 text-secondary",
  viewer: "bg-success/15 border-success/30 text-success",
};

function genSetupCode(): string {
  const block = () =>
    Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4)
      .padEnd(4, "0");
  return `${block()}-${block()}`;
}

function genRecoveryCode(): string {
  const block = () =>
    Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4)
      .padEnd(4, "0");
  return `${block()}-${block()}-${block()}-${block()}`;
}

/* ── Wizard shell ───────────────────────────────────────────────────── */

function WizardShell({
  children,
  currentStep,
  onCancel,
}: {
  children: React.ReactNode;
  currentStep: OnPremStepKey;
  onCancel: () => void;
}) {
  return (
    <div className="relative flex min-h-screen flex-col text-foreground">
      <AuthBackground />

      <header className="relative z-10 px-6 pt-4 pb-2 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/on-premise/signin" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-secondary">
              <Play className="size-3 fill-white text-white" />
            </div>
            <p className="text-md font-bold tracking-tight">Accel</p>
            <span className="ml-1 hidden rounded-full border border-secondary/40 bg-secondary/10 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-secondary sm:inline">
              On-Premise
            </span>
          </Link>
          <button
            onClick={onCancel}
            className="rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm font-semibold text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
          >
            Save & exit
          </button>
        </div>
        <div className="mt-4">
          <OnPremStepBar current={currentStep} />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 justify-center px-4 pt-6 pb-8 sm:px-6 sm:pt-10">
        <div className="w-full max-w-[560px]">{children}</div>
      </main>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function OnPremSetupPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setHasCreatedSite = useAuthStore((s) => s.setHasCreatedSite);
  const setHasActiveSubscription = useAuthStore((s) => s.setHasActiveSubscription);
  const addSite = useSitesStore((s) => s.addSite);

  const [step, setStep] = React.useState<OnPremStepKey>("license");
  const [error, setError] = React.useState<string | null>(null);

  /* ── Step 1: License ──────────────────────────────────────────── */
  const [licenseKey, setLicenseKey] = React.useState(
    "ACCL-ENTP-DSTA-A4F2-9B71-3D08-7XYZ-K2M8"
  );

  /* ── Step 2: Site ────────────────────────────────────────────── */
  const [siteName, setSiteName] = React.useState("");
  const [siteCode, setSiteCode] = React.useState("");
  const [country, setCountry] = React.useState("Singapore");
  const [timezone, setTimezone] = React.useState(TIMEZONES[0]);
  const [networkMode, setNetworkMode] = React.useState<NetworkMode>("airgapped");
  const [opFrom, setOpFrom] = React.useState("06:00");
  const [opTo, setOpTo] = React.useState("18:00");

  /* ── Step 3: Admin ───────────────────────────────────────────── */
  const [bootstrapUsername] = React.useState("admin@local.appliance");
  const [bootstrapPw, setBootstrapPw] = React.useState("");
  const [showBootstrap, setShowBootstrap] = React.useState(false);
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [recoveryCode, setRecoveryCode] = React.useState(() => genRecoveryCode());

  /* ── Step 4: Operators ───────────────────────────────────────── */
  const [operators, setOperators] = React.useState<Operator[]>([]);
  const [operatorModalOpen, setOperatorModalOpen] = React.useState(false);
  const [editingOperator, setEditingOperator] = React.useState<Operator | null>(null);

  function goBack() {
    setError(null);
    if (step === "license") {
      navigate("/on-premise/signin");
      return;
    }
    if (step === "site") setStep("license");
    else if (step === "admin") setStep("site");
    else if (step === "operators") setStep("admin");
  }

  /* ── Step submit handlers ──────────────────────────────────── */

  function submitLicense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const stripped = licenseKey.replace(/\s|-/g, "");
    if (stripped.length < 24) {
      setError("Enter a valid 32-character license key.");
      return;
    }
    toast.success("License activated", {
      description: "Validation succeeded against this appliance's fingerprint.",
    });
    setStep("site");
  }

  function submitSite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (siteName.trim().length < 2) return setError("Enter a site name.");
    if (siteCode.trim().length < 3) return setError("Enter a site code.");
    setStep("admin");
  }

  function submitAdmin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (bootstrapPw.trim().length < 4)
      return setError("Enter the bootstrap password from your sealed envelope.");
    if (newPw.length < 14)
      return setError("New password must be at least 14 characters.");
    if (newPw !== confirmPw) return setError("Passwords don't match.");
    setStep("operators");
  }

  function openAddOperator() {
    setEditingOperator(null);
    setOperatorModalOpen(true);
  }

  function openEditOperator(op: Operator) {
    setEditingOperator(op);
    setOperatorModalOpen(true);
  }

  function saveOperator(op: Operator) {
    setOperators((curr) => {
      const exists = curr.some((x) => x.id === op.id);
      return exists ? curr.map((x) => (x.id === op.id ? op : x)) : [...curr, op];
    });
    setOperatorModalOpen(false);
    toast.success(
      editingOperator
        ? "Operator updated"
        : `${op.fullName} added · first-login via ${op.firstLogin === "setup-code" ? "setup code" : "temp password"}`
    );
  }

  function removeOperator(id: string) {
    setOperators((curr) => curr.filter((x) => x.id !== id));
    toast.success("Operator removed");
  }

  function finishSetup() {
    // Create the single on-prem site.
    const site = makeBlankSite(siteName.trim(), "#DD7224");
    site.address = country;
    site.timezone = timezone.split(" ")[0];
    site.operatingHours = { from: opFrom, to: opTo };
    site.description = `On-premise · ${NETWORK_MODES.find((n) => n.key === networkMode)?.label} · Site code ${siteCode}`;
    site.areas = [
      {
        id: `area-${Math.random().toString(36).slice(2, 6)}`,
        name: "Main Area",
        color: "#DD7224",
        points: [],
      },
    ];
    site.status = "active";
    addSite(site);

    // Sign in as the bootstrap admin.
    const initials = bootstrapUsername
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "AD";
    signUp({
      id: "usr-onprem-001",
      name: "Super Admin",
      initials,
      role: "admin",
      email: bootstrapUsername,
      username: bootstrapUsername,
      notificationCount: 0,
      orgName: siteName.trim(),
      deploymentMode: "onprem",
    });

    // On-prem skips the cloud subscription — flip both gates so the
    // RequireOnboarding guard lets us straight into the dashboard.
    setHasCreatedSite(true);
    setHasActiveSubscription(true);
    completeOnboarding();

    toast.success("Setup complete", {
      description: `${siteName.trim()} is now ready. Operators can sign in with their codes.`,
    });
    navigate("/", { replace: true });
  }

  /* ── Render: License ───────────────────────────────────────── */

  if (step === "license") {
    return (
      <WizardShell currentStep="license" onCancel={() => navigate("/on-premise/signin")}>
        <BackLink onClick={goBack} label="Back to sign in" />
        <Heading
          title="Activate your license"
          subtitle="Enter the license key from your installation pack. This appliance cannot be used until activation completes."
        />
        <form onSubmit={submitLicense} className="mt-7 space-y-4">
          <div>
            <Label>License Key</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="ACCL-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                className="h-10 pl-9 font-mono text-sm tracking-wider"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              32 characters from your renewal email or sealed envelope.
            </p>
          </div>

          <div>
            <Label>Or upload license file</Label>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 px-4 py-5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Upload className="size-4" />
              Drop <strong className="text-foreground">.lic</strong> file here or click to browse
            </button>
          </div>

          <div className="rounded-md border border-border/60 bg-card/40 p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Cpu className="size-3" /> This appliance's hardware fingerprint
            </div>
            <p className="font-mono text-xs leading-relaxed text-muted-foreground">
              {HARDWARE_FINGERPRINT}
            </p>
            <p className="mt-1 text-2xs text-muted-foreground/70">
              Auto-detected. Your license key must match this fingerprint.
            </p>
          </div>

          <InfoBanner
            tone="info"
            icon={<ShieldCheck className="size-3.5" />}
            title="No internet required"
          >
            Validation runs locally against the signed entitlement payload.
            Activation is final and creates the audit baseline.
          </InfoBanner>

          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Activate & Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Render: Site ──────────────────────────────────────────── */

  if (step === "site") {
    return (
      <WizardShell currentStep="site" onCancel={() => navigate("/on-premise/signin")}>
        <BackLink onClick={goBack} />
        <Heading
          title="Configure this site"
          subtitle="These details identify the deployment and set the operational defaults. On-Premise appliances manage exactly one site."
        />
        <form onSubmit={submitSite} className="mt-7 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Site name" icon={Building2}>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. Sembawang Naval Base"
                className="h-10 pl-9 text-base"
              />
            </Field>
            <Field label="Site code" icon={Shapes}>
              <Input
                value={siteCode}
                onChange={(e) => setSiteCode(e.target.value.toUpperCase())}
                placeholder="SBW-NAV-001"
                className="h-10 pl-9 font-mono text-base"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Country / Region</Label>
              <Select value={country} onValueChange={(v) => setCountry(v)}>
                <SelectTrigger className="h-10 w-full text-base">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Time zone</Label>
              <Select value={timezone} onValueChange={(v) => setTimezone(v)}>
                <SelectTrigger className="h-10 w-full text-base">
                  <SelectValue placeholder="Select a time zone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Network mode</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {NETWORK_MODES.map((m) => {
                const Icon = m.icon;
                const selected = networkMode === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setNetworkMode(m.key)}
                    className={cn(
                      "flex flex-col items-start gap-1.5 rounded-md border bg-card/40 px-3 py-2.5 text-left backdrop-blur-sm transition-colors",
                      selected
                        ? "border-secondary bg-secondary/10"
                        : "border-border/60 hover:border-secondary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-bold",
                        selected ? "text-secondary" : "text-foreground"
                      )}
                    >
                      <Icon className="size-3.5" />
                      {m.label}
                    </div>
                    <span className="text-2xs text-muted-foreground">
                      {m.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label icon={Clock}>Operating hours · start</Label>
              <Input
                type="time"
                value={opFrom}
                onChange={(e) => setOpFrom(e.target.value)}
                className="h-10 text-base"
              />
            </div>
            <div>
              <Label icon={Clock}>Operating hours · end</Label>
              <Input
                type="time"
                value={opTo}
                onChange={(e) => setOpTo(e.target.value)}
                className="h-10 text-base"
              />
            </div>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Detections outside these hours are treated as{" "}
            <strong className="text-foreground">after-hours events</strong> by default. Per
            use-case overrides can be configured later.
          </p>

          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Render: Admin ─────────────────────────────────────────── */

  if (step === "admin") {
    return (
      <WizardShell currentStep="admin" onCancel={() => navigate("/on-premise/signin")}>
        <BackLink onClick={goBack} />
        <Heading
          title="Replace the bootstrap password"
          subtitle="You were issued a temporary password in the sealed envelope. Replace it now — it can never be used again after this step."
        />
        <form onSubmit={submitAdmin} className="mt-7 space-y-4">
          <Field label="Bootstrap username (from envelope)" icon={User}>
            <Input
              value={bootstrapUsername}
              disabled
              className="h-10 pl-9 font-mono text-base"
            />
          </Field>

          <Field label="Bootstrap password (from envelope)" icon={Lock}>
            <Input
              type={showBootstrap ? "text" : "password"}
              value={bootstrapPw}
              onChange={(e) => setBootstrapPw(e.target.value)}
              placeholder="Paste the temp password from the sealed envelope"
              className="h-10 px-9 text-base"
            />
            <EyeToggle
              on={showBootstrap}
              onClick={() => setShowBootstrap((v) => !v)}
            />
          </Field>

          <div>
            <Field label="New password" icon={Lock}>
              <Input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="At least 14 characters"
                className="h-10 px-9 text-base"
              />
              <EyeToggle on={showNew} onClick={() => setShowNew((v) => !v)} />
            </Field>
            <PasswordStrengthBar className="mt-1.5" password={newPw} />
          </div>

          <Field label="Confirm new password" icon={Lock}>
            <Input
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password"
              className="h-10 px-9 text-base"
            />
            <EyeToggle
              on={showConfirm}
              onClick={() => setShowConfirm((v) => !v)}
            />
          </Field>

          <InfoBanner
            tone="warning"
            icon={<AlertTriangle className="size-3.5" />}
            title="No online recovery"
          >
            This appliance is offline. If you lose this password, recovery
            requires the printed recovery code below or physical re-imaging by
            the vendor.
          </InfoBanner>

          <div className="rounded-md border border-secondary/30 bg-secondary/[0.06] p-4">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-secondary">
              <HardDrive className="size-3.5" /> Recovery code
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              If you forget your password, this 16-character code can be used
              once to reset it.{" "}
              <strong className="text-foreground">
                Print this and store it offline.
              </strong>
            </p>
            <div className="rounded-md border border-dashed border-secondary/40 bg-background/40 py-3.5 text-center font-mono text-xl font-bold tracking-[0.18em] text-secondary">
              {recoveryCode}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
              <RecoveryActionBtn
                icon={<Printer className="size-3" />}
                label="Print"
                onClick={() =>
                  toast.message("Print dialog stub", {
                    description: "A printable copy of the recovery code would open here.",
                  })
                }
              />
              <RecoveryActionBtn
                icon={<Copy className="size-3" />}
                label="Copy"
                onClick={() => {
                  navigator.clipboard?.writeText(recoveryCode);
                  toast.success("Recovery code copied to clipboard");
                }}
              />
              <RecoveryActionBtn
                icon={<RefreshCcw className="size-3" />}
                label="Regenerate"
                onClick={() => {
                  setRecoveryCode(genRecoveryCode());
                  toast.message("New recovery code generated");
                }}
              />
            </div>
          </div>

          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Render: Operators ─────────────────────────────────────── */

  return (
    <WizardShell currentStep="operators" onCancel={() => navigate("/on-premise/signin")}>
      <BackLink onClick={goBack} />
      <Heading
        title="Add your operators"
        subtitle="Since this is an offline appliance, each operator gets a setup code (handed over physically) or a temporary password to use on first sign-in."
      />

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-bold text-foreground">
            Operators added so far{" "}
            <span className="font-mono text-muted-foreground">
              ({operators.length})
            </span>
          </p>
          <Button onClick={openAddOperator} className="h-9 gap-1.5">
            <Plus className="size-3.5" />
            Add Operator
          </Button>
        </div>

        {operators.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/70 bg-card/30 p-8 text-center backdrop-blur-sm">
            <User className="mx-auto mb-2 size-6 text-muted-foreground/60" />
            <p className="text-base font-semibold text-foreground">
              No operators yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can add operators now or after finishing setup from{" "}
              <strong className="text-foreground">Settings → Users</strong>.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border/60 bg-card/40 backdrop-blur-sm">
            <table className="w-full text-left">
              <thead className="bg-muted/20">
                <tr className="border-b border-border/60">
                  <th className="px-3 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Name</th>
                  <th className="px-3 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Username</th>
                  <th className="px-3 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">Role</th>
                  <th className="px-3 py-2 text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">First-login</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {operators.map((op) => (
                  <tr key={op.id}>
                    <td className="px-3 py-2.5 text-base font-semibold text-foreground">
                      {op.fullName}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm text-muted-foreground">
                      {op.username}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
                          OPERATOR_ROLE_STYLES[op.role]
                        )}
                      >
                        {OPERATOR_ROLE_LABELS[op.role]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {op.firstLogin === "setup-code" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-secondary/15 px-2 py-0.5 text-2xs font-semibold text-secondary">
                          <KeyRound className="size-3" />
                          {op.setupCode}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-info/15 px-2 py-0.5 text-2xs font-semibold text-info">
                          <Lock className="size-3" />
                          Temp password
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditOperator(op)}
                          className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          aria-label="Edit operator"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          onClick={() => removeOperator(op.id)}
                          className="flex size-7 items-center justify-center rounded-md border border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10"
                          aria-label="Remove operator"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <InfoBanner
          tone="info"
          icon={<Mail className="size-3.5" />}
          title="Hand-off in person"
          className="mt-4"
        >
          Print this user list with codes (admin only) before completing setup.
          Operators enrol 2FA themselves on their first sign-in.
        </InfoBanner>

        {error && <ErrorBox message={error} className="mt-3" />}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={finishSetup}>
            Skip — finish later
          </Button>
          <Button onClick={finishSetup} className="h-10 gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Complete Setup
          </Button>
        </div>
      </div>

      <OperatorModal
        open={operatorModalOpen}
        onClose={() => setOperatorModalOpen(false)}
        onSave={saveOperator}
        existing={editingOperator}
      />
    </WizardShell>
  );
}

/* ── Operator modal ─────────────────────────────────────────────── */

function OperatorModal({
  open,
  onClose,
  onSave,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (op: Operator) => void;
  existing: Operator | null;
}) {
  const [fullName, setFullName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [role, setRole] = React.useState<OperatorRole>("operator");
  const [firstLogin, setFirstLogin] =
    React.useState<FirstLoginMethod>("setup-code");
  const [setupCode, setSetupCode] = React.useState("");
  const [tempPw, setTempPw] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (existing) {
        setFullName(existing.fullName);
        setUsername(existing.username);
        setRole(existing.role);
        setFirstLogin(existing.firstLogin);
        setSetupCode(existing.setupCode ?? genSetupCode());
        setTempPw("");
      } else {
        setFullName("");
        setUsername("");
        setRole("operator");
        setFirstLogin("setup-code");
        setSetupCode(genSetupCode());
        setTempPw("");
      }
      setErr(null);
    }
  }, [open, existing]);

  function submit() {
    setErr(null);
    if (fullName.trim().length < 2) return setErr("Enter a full name.");
    if (username.trim().length < 2) return setErr("Enter a username.");
    if (firstLogin === "temp-password" && tempPw.length < 8)
      return setErr("Temp password must be at least 8 characters.");
    onSave({
      id: existing?.id ?? `op-${Math.random().toString(36).slice(2, 6)}`,
      fullName: fullName.trim(),
      username: username.trim(),
      role,
      firstLogin,
      setupCode: firstLogin === "setup-code" ? setupCode : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[520px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {existing ? "Edit operator" : "Add operator"}
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            On-prem operators sign in with their username + first-login
            credential. They'll be prompted to enrol 2FA on first sign-in.
          </p>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div>
            <Label>Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. KC Loke"
              className="h-9 text-base"
            />
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/\s+/g, "."))
              }
              placeholder="e.g. kc.loke"
              className="h-9 font-mono text-base"
            />
          </div>
          <div>
            <Label>Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["manager", "operator", "viewer"] as OperatorRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-sm font-semibold transition-colors",
                    role === r
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-border text-muted-foreground hover:border-secondary/40"
                  )}
                >
                  {OPERATOR_ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>First-login method</Label>
            <div className="grid grid-cols-1 gap-2">
              <FirstLoginCard
                selected={firstLogin === "setup-code"}
                title="Setup code (recommended)"
                description="A one-time 8-char code printed by you and handed over physically. Operator picks their own password on first sign-in."
                icon={<KeyRound className="size-3.5" />}
                onClick={() => setFirstLogin("setup-code")}
              />
              <FirstLoginCard
                selected={firstLogin === "temp-password"}
                title="Temporary password"
                description="Assign a temp password they'll be forced to change immediately on first sign-in."
                icon={<Lock className="size-3.5" />}
                onClick={() => setFirstLogin("temp-password")}
              />
            </div>
          </div>

          {firstLogin === "setup-code" && (
            <div>
              <Label>Setup code</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-secondary/30 bg-secondary/[0.06] px-3 py-2 text-center font-mono text-md font-bold tracking-[0.15em] text-secondary">
                  {setupCode}
                </div>
                <button
                  type="button"
                  onClick={() => setSetupCode(genSetupCode())}
                  className="flex size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Regenerate"
                >
                  <RefreshCcw className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {firstLogin === "temp-password" && (
            <div>
              <Label>Temporary password</Label>
              <Input
                value={tempPw}
                onChange={(e) => setTempPw(e.target.value)}
                placeholder="At least 8 characters"
                className="h-9 text-base"
              />
            </div>
          )}

          {err && <ErrorBox message={err} />}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>
            {existing ? "Save changes" : "Add operator"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FirstLoginCard({
  selected,
  title,
  description,
  icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-2 rounded-md border bg-background px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-secondary bg-secondary/[0.06]"
          : "border-border hover:border-secondary/40"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
          selected ? "border-secondary" : "border-muted-foreground/40"
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-secondary" />}
      </div>
      <div className="flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}

/* ── Reusable helpers ───────────────────────────────────────────── */

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

function Label({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="size-3" />}
      {children}
    </label>
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
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
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

function ErrorBox({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical",
        className
      )}
    >
      <AlertCircle className="size-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}

function InfoBanner({
  tone,
  icon,
  title,
  children,
  className,
}: {
  tone: "info" | "warning";
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const palette =
    tone === "info"
      ? "border-info/30 bg-info/[0.06] text-info"
      : "border-warning/30 bg-warning/[0.06] text-warning";
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2.5",
        palette,
        className
      )}
    >
      <span className="mt-0.5">{icon}</span>
      <div className="text-sm leading-relaxed text-muted-foreground">
        <strong className={tone === "info" ? "text-info" : "text-warning"}>
          {title}.
        </strong>{" "}
        {children}
      </div>
    </div>
  );
}

function RecoveryActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}
