import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
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
  Crown,
  CircleUser,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { SeatStrip, type SeatUsage } from "@/pages/user-management";
import { MOCK_SEATS } from "@/mocks/licenses";
import type { UserRole } from "@/types/users";

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
  email: string;
  role: MemberRole;
  firstLogin: FirstLoginMethod;
  setupCode?: string;
}

const MEMBER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  user: "User",
};

/* Role badge (owner / admin / user) — matches the On-Cloud invite layout. */
const ROLE_BADGE: Record<
  UserRole,
  { bg: string; text: string; icon: React.ElementType; label: string }
> = {
  owner: { bg: "border-success/30 bg-success/15", text: "text-success", icon: Crown, label: "Owner" },
  admin: { bg: "border-info/30 bg-info/15", text: "text-info", icon: ShieldCheck, label: "Admin" },
  user: { bg: "border-warning/30 bg-warning/15", text: "text-warning", icon: CircleUser, label: "User" },
};

function RoleBadge({ role, withIcon = true }: { role: UserRole; withIcon?: boolean }) {
  const s = ROLE_BADGE[role];
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
      {s.label}
    </span>
  );
}

/* Seat usage for the account license — owner is the bootstrap admin (1),
 * admin/user come from the members added during setup. */
function computeMemberSeatUsage(members: Member[]): Record<UserRole, SeatUsage> {
  const mk = (r: UserRole, assigned: number): SeatUsage => ({
    role: r,
    total: MOCK_SEATS[r].total,
    assigned,
    available: Math.max(0, MOCK_SEATS[r].total - assigned),
    price: MOCK_SEATS[r].pricePerMonth,
    label: MOCK_SEATS[r].label,
  });
  return {
    owner: mk("owner", 1),
    admin: mk("admin", members.filter((m) => m.role === "admin").length),
    user: mk("user", members.filter((m) => m.role === "user").length),
  };
}

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
  wide = false,
}: {
  children: React.ReactNode;
  currentStep: OnPremStepKey;
  onCancel: () => void;
  wide?: boolean;
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
        <div className={cn("w-full", wide ? "max-w-[1024px]" : "max-w-[560px]")}>{children}</div>
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
  const [siteAddress, setSiteAddress] = React.useState("");
  const [primaryArea, setPrimaryArea] = React.useState("");
  const [siteDescription, setSiteDescription] = React.useState("");
  const [timezone, setTimezone] = React.useState(TIMEZONES[0]);
  const [networkMode, setNetworkMode] = React.useState<NetworkMode>("airgapped");
  const [opFrom, setOpFrom] = React.useState("06:00");
  const [opTo, setOpTo] = React.useState("18:00");

  const bootstrapUsername = "admin@local.account";

  /* ── Step 3: Members ─────────────────────────────────────────── */
  const [members, setMembers] = React.useState<Member[]>([]);
  const [memberModalOpen, setMemberModalOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<Member | null>(null);

  function pickLicenseFile() {
    // Demo dropzone: simulate a chosen file, then auto-validate.
    const name = `entitlement-account.lic`;
    setLicenseFile(name);
  }

  React.useEffect(() => {
    if (!licenseFile) return;
    setLicenseStatus("validating");
    const invalid = /bad|invalid/i.test(licenseFile);
    const t = setTimeout(() => {
      if (invalid) {
        setLicenseStatus("invalid");
        return;
      }
      // Valid file — activate and advance to Configure Site automatically.
      setLicenseStatus("valid");
      toast.success("License key worked", {
        description: "Validation succeeded against this account's fingerprint.",
      });
      setStep("site");
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
      description: "Validation succeeded against this account's fingerprint.",
    });
    setStep("site");
  }

  function submitSite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (siteName.trim().length < 2) return setError("Enter a site name.");
    if (siteAddress.trim().length < 3) return setError("Enter a site address.");
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
    site.address = siteAddress.trim();
    site.timezone = timezone.split(" ")[0];
    site.operatingHours = { from: opFrom, to: opTo };
    site.description =
      siteDescription.trim() ||
      `On-premise · ${NETWORK_MODES.find((n) => n.key === networkMode)?.label}`;
    site.areas = [
      {
        id: `area-${Math.random().toString(36).slice(2, 6)}`,
        name: primaryArea.trim() || "Main Area",
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
          subtitle="Upload the license file from your installation pack. This account cannot be used until activation completes."
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
              License valid — entitlement matches this account's fingerprint.
            </div>
          )}
          {licenseStatus === "invalid" && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2.5 text-sm text-sev-critical">
              <AlertCircle className="size-4 flex-shrink-0" />
              License invalid — this file does not match this account. Upload a valid .lic file.
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
    const siteSlug = siteName
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 12);
    const siteId = siteSlug ? `SITE-${siteSlug}` : "SITE-XXXX";
    return (
      <WizardShell currentStep="site" onCancel={() => navigate("/on-premise/signin")}>
        <BackLink onClick={goBack} />
        <Heading
          title="Configure this site"
          subtitle="Add basic details and the operational defaults. On-Premise accounts manage exactly one site."
        />
        <form onSubmit={submitSite} className="mt-8 space-y-4">
          <Field label="Site name" icon={Building2}>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Sembawang Naval Base"
              className="h-10 pl-9 text-base"
            />
          </Field>

          <Field label="Site ID (auto-generated)" icon={Lock}>
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
              placeholder="8 Admiralty Road West, Singapore 759956"
              className="h-10 pl-9 text-base"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div>
              <Label icon={Clock}>Operating Hours</Label>
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
              placeholder="e.g. Main Gate, Armoury, Loading Bay…"
              className="h-10 pl-9 text-base"
            />
          </Field>

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

          <div>
            <Label>Description (Optional)</Label>
            <Textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={2}
              placeholder="A short description of this site…"
              className="w-full text-base"
            />
          </div>

          {error && <ErrorBox message={error} />}
          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>
      </WizardShell>
    );
  }

  /* ── Render: Members ───────────────────────────────────────── */

  const seatUsage = computeMemberSeatUsage(members);

  return (
    <WizardShell wide currentStep="operators" onCancel={() => navigate("/on-premise/signin")}>
      <BackLink onClick={goBack} />
      <Heading
        title="Add Members"
        subtitle="Since this is an offline account, each member gets a setup code (handed over physically) or a temporary password to use on first sign-in."
      />

      <div className="mt-6">
        <SeatStrip usage={seatUsage} billingCycle="Perpetual" />
      </div>

      <InfoBanner
        tone="info"
        icon={<Mail className="size-3.5" />}
        title="Hand-off in person"
        className="mt-4"
      >
        Print this member list with codes (admin only) before completing setup.
        Members enrol 2FA themselves on their first sign-in.
      </InfoBanner>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-base font-bold text-foreground">Members</p>
        <Button onClick={openAddMember} className="h-9 gap-1.5">
          <Plus className="size-3.5" />
          Add Member
        </Button>
      </div>

      <div className="mt-3 flex max-h-[calc(100vh-26rem)] flex-col overflow-hidden rounded-lg border border-border/60 bg-card/40 backdrop-blur-sm">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/30 backdrop-blur-sm">
              <tr className="border-b border-border text-left">
                {["MEMBER", "ROLE", "STATUS", "FIRST SIGN-IN", "ACTION"].map((h) => (
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
              {/* Bootstrap account owner — already provisioned. */}
              <tr className="text-base transition-colors hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-success/15 font-mono text-sm font-semibold text-success">
                      <Crown className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        Account Owner
                        <span className="ml-1.5 text-xs font-medium text-muted-foreground">(You)</span>
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">{bootstrapUsername}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <RoleBadge role="owner" />
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
                    Active
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">Configured</td>
                <td className="px-4 py-3" />
              </tr>

              {members.map((m) => (
                <tr key={m.id} className="text-base transition-colors hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <MemberAvatar firstName={m.firstName} lastName={m.lastName} />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">
                          {m.firstName} {m.lastName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.role} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-warning">
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.firstLogin === "setup-code" ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-2xs font-semibold text-primary">
                          <KeyRound className="size-3" />
                          Setup code
                        </span>
                        <span className="font-mono text-xs font-semibold text-primary">{m.setupCode}</span>
                      </div>
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

        <div className="flex-shrink-0 border-t border-border/60 bg-muted/10 px-4 py-2 text-right text-sm text-muted-foreground">
          Current Total:{" "}
          <strong className="text-foreground">{1 + members.length}</strong> assigned seat
          {members.length === 0 ? "" : "s"}
        </div>

        <div className="sticky bottom-0 z-10 flex flex-shrink-0 items-center justify-between gap-2 border-t border-border bg-card px-4 py-3.5">
          <Button variant="ghost" onClick={finishSetup}>
            Skip — finish later
          </Button>
          <Button onClick={finishSetup} className="h-10 gap-1.5">
            <CheckCircle2 className="size-3.5" />
            Complete Setup
          </Button>
        </div>
      </div>

      {error && <ErrorBox message={error} className="mt-3" />}

      <MemberModal
        open={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        onSave={saveMember}
        existing={editingMember}
        siteName={siteName || "Sembawang Naval Base"}
        currentMembers={members}
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
  siteName,
  currentMembers,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (m: Member) => void;
  existing: Member | null;
  siteName: string;
  currentMembers: Member[];
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<MemberRole>("user");
  const [firstLogin, setFirstLogin] =
    React.useState<FirstLoginMethod>("setup-code");
  const [setupCode, setSetupCode] = React.useState("");
  const [tempPw, setTempPw] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  /* Seat usage for the role tiles — exclude the member being edited so its
   * own seat isn't double-counted against availability. */
  const usage = React.useMemo(() => {
    const others = existing ? currentMembers.filter((m) => m.id !== existing.id) : currentMembers;
    const mk = (r: UserRole, assigned: number) => {
      const total = MOCK_SEATS[r].total;
      return { assigned, total, available: Math.max(0, total - assigned) };
    };
    return {
      owner: mk("owner", 1),
      admin: mk("admin", others.filter((m) => m.role === "admin").length),
      user: mk("user", others.filter((m) => m.role === "user").length),
    } as Record<UserRole, { assigned: number; total: number; available: number }>;
  }, [currentMembers, existing]);

  const noSeats = usage[role].available === 0;

  React.useEffect(() => {
    if (open) {
      if (existing) {
        setFirstName(existing.firstName);
        setLastName(existing.lastName);
        setEmail(existing.email);
        setRole(existing.role);
        setFirstLogin(existing.firstLogin);
        setSetupCode(existing.setupCode ?? genSetupCode());
        setTempPw("");
      } else {
        setFirstName("");
        setLastName("");
        setEmail("");
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
    if (!MEMBER_EMAIL_RE.test(email.trim())) return setErr("Enter a valid email address.");
    if (noSeats) return setErr(`No ${MEMBER_ROLE_LABELS[role]} seats remaining.`);
    if (firstLogin === "temp-password" && tempPw.length < 8)
      return setErr("Temp password must be at least 8 characters.");
    onSave({
      id: existing?.id ?? `mbr-${Math.random().toString(36).slice(2, 6)}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
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
            <Label>Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="member@account.local"
                className="h-9 pl-9 text-base"
              />
            </div>
          </div>
          {/* Seat tiles double as the role selector — pick a tier to add into. */}
          <div>
            <Label>Seat Type</Label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background p-2">
              {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                const s = usage[r];
                const isLow = s.available === 0;
                const isSelected = role === r;
                // Owner is the account bootstrap account — not assignable here.
                const selectable = r !== "owner";
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={!selectable}
                    onClick={() => selectable && setRole(r as MemberRole)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                      selectable ? "hover:border-primary/40" : "cursor-not-allowed opacity-60"
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
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-2xs text-muted-foreground/70">
              Owner is the account bootstrap account and can't be reassigned here.
            </p>
          </div>

          {/* Site Access — locked to the account's site. */}
          <div>
            <Label>Site Access</Label>
            <div
              className="flex h-9 w-full cursor-not-allowed items-center gap-2 rounded-md border border-input bg-muted/30 px-3 text-base"
              aria-disabled="true"
            >
              <MapPin className="size-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {siteName}
              </span>
              <span className="ml-auto inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground/70">
                <Lock className="size-3" /> Locked to this account
              </span>
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

          {noSeats && (
            <div className="flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.06] px-2.5 py-1.5 text-xs text-sev-critical">
              <AlertCircle className="mt-0.5 size-3 flex-shrink-0" />
              <p>
                <strong>No {MEMBER_ROLE_LABELS[role]} seats remaining.</strong> Remove a member or
                pick another seat type.
              </p>
            </div>
          )}

          {err && <ErrorBox message={err} />}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={noSeats}>
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

