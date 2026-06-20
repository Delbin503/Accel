import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Lock,
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
  ShieldCheck,
  WifiOff,
  Wifi,
  Globe,
  RefreshCcw,
  CheckCircle2,
  LoaderCircle,
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

/* ── Constants ──────────────────────────────────────────────────────── */

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

type MemberRole = "admin" | "user";
type FirstLoginMethod = "setup-code" | "temp-password";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  role: MemberRole;
  firstLogin: FirstLoginMethod;
  setupCode?: string;
}

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  user: "User",
};

const MEMBER_ROLE_STYLES: Record<MemberRole, string> = {
  admin: "bg-info/15 border-info/30 text-info",
  user: "bg-warning/15 border-warning/30 text-warning",
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

type LicenseStatus = "idle" | "validating" | "valid" | "invalid";

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

export default function OnPremSetupPage({
  initialStep = "license",
}: {
  initialStep?: OnPremStepKey;
} = {}) {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const setHasCreatedSite = useAuthStore((s) => s.setHasCreatedSite);
  const setHasActiveSubscription = useAuthStore((s) => s.setHasActiveSubscription);
  const addSite = useSitesStore((s) => s.addSite);

  const [step, setStep] = React.useState<OnPremStepKey>(initialStep);
  const [error, setError] = React.useState<string | null>(null);

  /* ── Step 1: License ──────────────────────────────────────────── */
  const [licenseFile, setLicenseFile] = React.useState<string | null>(null);
  const [licenseStatus, setLicenseStatus] = React.useState<LicenseStatus>("idle");

  /* ── Step 2: Site ────────────────────────────────────────────── */
  const [siteName, setSiteName] = React.useState("");
  const [siteCode, setSiteCode] = React.useState("");
  const [country, setCountry] = React.useState("Singapore");
  const [timezone, setTimezone] = React.useState(TIMEZONES[0]);
  const [networkMode, setNetworkMode] = React.useState<NetworkMode>("airgapped");
  const [opFrom, setOpFrom] = React.useState("06:00");
  const [opTo, setOpTo] = React.useState("18:00");

  const bootstrapUsername = "admin@local.appliance";

  /* ── Step 3: Members ─────────────────────────────────────────── */
  const [members, setMembers] = React.useState<Member[]>([]);
  const [memberModalOpen, setMemberModalOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<Member | null>(null);

  function pickLicenseFile() {
    // Demo dropzone: simulate a chosen file, then auto-validate.
    const name = `entitlement-${siteCode || "appliance"}.lic`;
    setLicenseFile(name);
  }

  React.useEffect(() => {
    if (!licenseFile) return;
    setLicenseStatus("validating");
    const invalid = /bad|invalid/i.test(licenseFile);
    const t = setTimeout(() => {
      setLicenseStatus(invalid ? "invalid" : "valid");
    }, 1200);
    return () => clearTimeout(t);
  }, [licenseFile]);

  function goBack() {
    setError(null);
    if (step === "license") {
      navigate("/on-premise/signin");
      return;
    }
    if (step === "site") setStep("license");
    else if (step === "operators") setStep("site");
  }

  /* ── Step submit handlers ──────────────────────────────────── */

  function submitLicense(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (licenseStatus !== "valid") {
      setError("Upload a valid license file to continue.");
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
    setStep("operators");
  }

  function openAddMember() {
    setEditingMember(null);
    setMemberModalOpen(true);
  }

  function openEditMember(m: Member) {
    setEditingMember(m);
    setMemberModalOpen(true);
  }

  function saveMember(m: Member) {
    setMembers((curr) => {
      const exists = curr.some((x) => x.id === m.id);
      return exists ? curr.map((x) => (x.id === m.id ? m : x)) : [...curr, m];
    });
    setMemberModalOpen(false);
    toast.success(
      editingMember
        ? "Member updated"
        : `${m.firstName} ${m.lastName} added · first-login via ${m.firstLogin === "setup-code" ? "setup code" : "temp password"}`
    );
  }

  function removeMember(id: string) {
    setMembers((curr) => curr.filter((x) => x.id !== id));
    toast.success("Member removed");
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
      description: `${siteName.trim()} is now ready. Members can sign in with their codes.`,
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
          subtitle="Upload the license file from your installation pack. This appliance cannot be used until activation completes."
        />
        <form onSubmit={submitLicense} className="mt-10 space-y-5">
          <div>
            <Label>Upload license file</Label>
            <button
              type="button"
              onClick={pickLicenseFile}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-secondary/50 hover:text-foreground"
            >
              <Upload className="size-4" />
              {licenseFile ? (
                <span className="font-mono text-foreground">{licenseFile}</span>
              ) : (
                <>
                  Drop <strong className="text-foreground">.lic</strong> file here or click to browse
                </>
              )}
            </button>
          </div>

          {licenseStatus === "validating" && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-3 py-2.5 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Validating license…
            </div>
          )}
          {licenseStatus === "valid" && (
            <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/[0.08] px-3 py-2.5 text-sm text-success">
              <CheckCircle2 className="size-4 flex-shrink-0" />
              License valid — entitlement matches this appliance's fingerprint.
            </div>
          )}
          {licenseStatus === "invalid" && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2.5 text-sm text-sev-critical">
              <AlertCircle className="size-4 flex-shrink-0" />
              License invalid — this file does not match this appliance. Upload a valid .lic file.
            </div>
          )}

          <InfoBanner
            tone="info"
            icon={<ShieldCheck className="size-3.5" />}
            title="No internet required"
          >
            Validation runs locally against the signed entitlement payload.
            Activation is final and creates the audit baseline.
          </InfoBanner>

          {error && <ErrorBox message={error} />}
          <Button
            type="submit"
            disabled={licenseStatus !== "valid"}
            className="mt-2 h-10 w-full gap-2 text-base"
          >
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
          subtitle="Add basic details and the operational defaults. On-Premise appliances manage exactly one site."
        />
        <form onSubmit={submitSite} className="mt-10 space-y-5">
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
                        ? "border-primary bg-primary/[0.06]"
                        : "border-border/60 hover:border-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-sm font-bold",
                        selected ? "text-primary" : "text-foreground"
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

  /* ── Render: Members ───────────────────────────────────────── */

  return (
    <WizardShell currentStep="operators" onCancel={() => navigate("/on-premise/signin")}>
      <BackLink onClick={goBack} />
      <Heading
        title="Add Members"
        subtitle="Since this is an offline appliance, each member gets a setup code (handed over physically) or a temporary password to use on first sign-in."
      />

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-bold text-foreground">
            Members added so far{" "}
            <span className="font-mono text-muted-foreground">
              ({members.length})
            </span>
          </p>
          <Button onClick={openAddMember} className="h-9 gap-1.5">
            <Plus className="size-3.5" />
            Add Member
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/70 bg-card/30 p-8 text-center backdrop-blur-sm">
            <User className="mx-auto mb-2 size-6 text-muted-foreground/60" />
            <p className="text-base font-semibold text-foreground">
              No members yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can add members now or after finishing setup from{" "}
              <strong className="text-foreground">Settings → Users</strong>.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border/60 bg-card/40 backdrop-blur-sm">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {["MEMBER", "ROLE", "FIRST SIGN-IN", "ACTION"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {members.map((m) => (
                  <tr key={m.id} className="text-base transition-colors hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar firstName={m.firstName} lastName={m.lastName} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {m.firstName} {m.lastName}
                          </p>
                          {m.firstLogin === "setup-code" ? (
                            <p className="text-xs text-muted-foreground">
                              Setup code{" "}
                              <span className="font-mono font-semibold text-primary">
                                {m.setupCode}
                              </span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Temp password on first sign-in
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
                          MEMBER_ROLE_STYLES[m.role]
                        )}
                      >
                        {MEMBER_ROLE_LABELS[m.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {m.firstLogin === "setup-code" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-2xs font-semibold text-primary">
                          <KeyRound className="size-3" />
                          Setup code
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-info/15 px-2 py-0.5 text-2xs font-semibold text-info">
                          <Lock className="size-3" />
                          Temp password
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEditMember(m)}
                          className="flex size-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          aria-label="Edit member"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          onClick={() => removeMember(m.id)}
                          className="flex size-7 items-center justify-center rounded-md border border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10"
                          aria-label="Remove member"
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
          Print this member list with codes (admin only) before completing setup.
          Members enrol 2FA themselves on their first sign-in.
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

      <MemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        onSave={saveMember}
        existing={editingMember}
      />
    </WizardShell>
  );
}

/* ── Member avatar ──────────────────────────────────────────────── */

function MemberAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  return (
    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-semibold text-muted-foreground">
      {initials}
    </div>
  );
}

/* ── Member modal ───────────────────────────────────────────────── */

function MemberModal({
  open,
  onClose,
  onSave,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (m: Member) => void;
  existing: Member | null;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [role, setRole] = React.useState<MemberRole>("user");
  const [firstLogin, setFirstLogin] =
    React.useState<FirstLoginMethod>("setup-code");
  const [setupCode, setSetupCode] = React.useState("");
  const [tempPw, setTempPw] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      if (existing) {
        setFirstName(existing.firstName);
        setLastName(existing.lastName);
        setRole(existing.role);
        setFirstLogin(existing.firstLogin);
        setSetupCode(existing.setupCode ?? genSetupCode());
        setTempPw("");
      } else {
        setFirstName("");
        setLastName("");
        setRole("user");
        setFirstLogin("setup-code");
        setSetupCode(genSetupCode());
        setTempPw("");
      }
      setErr(null);
    }
  }, [open, existing]);

  function submit() {
    setErr(null);
    if (firstName.trim().length < 1) return setErr("Enter a first name.");
    if (lastName.trim().length < 1) return setErr("Enter a last name.");
    if (firstLogin === "temp-password" && tempPw.length < 8)
      return setErr("Temp password must be at least 8 characters.");
    onSave({
      id: existing?.id ?? `mbr-${Math.random().toString(36).slice(2, 6)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
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
            {existing ? "Edit member" : "Add member"}
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            On-prem members sign in with their first-login credential. They'll
            be prompted to enrol 2FA on first sign-in.
          </p>
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>First name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. KC"
                className="h-9 text-base"
              />
            </div>
            <div>
              <Label>Last name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Loke"
                className="h-9 text-base"
              />
            </div>
          </div>
          <div>
            <Label>Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["admin", "user"] as MemberRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-md border px-2.5 py-1.5 text-sm font-semibold transition-colors",
                    role === r
                      ? "border-primary bg-primary/[0.06] text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {MEMBER_ROLE_LABELS[r]}
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
                description="A one-time 8-char code printed by you and handed over physically. The member picks their own password on first sign-in."
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
                <div className="flex-1 rounded-md border border-primary/40 bg-primary/[0.10] px-3 py-2 text-center font-mono text-md font-bold tracking-[0.15em] text-primary">
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
            {existing ? "Save changes" : "Add member"}
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
          ? "border-primary bg-primary/[0.06]"
          : "border-border hover:border-primary/40"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-muted-foreground/40"
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-primary" />}
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

