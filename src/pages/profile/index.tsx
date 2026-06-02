import * as React from "react";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Shield,
  KeyRound,
  Smartphone,
  Camera,
  Save,
  Crown,
  ShieldCheck,
  CircleUser,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/useAuthStore";
import { MOCK_USERS } from "@/mocks/users";
import { USER_ROLE_LABELS } from "@/mocks/users";
import type { UserRole } from "@/types/users";

const ROLE_STYLES: Record<UserRole, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner: { bg: "bg-success/15 border-success/30", text: "text-success",          icon: Crown },
  admin: { bg: "bg-info/15 border-info/30",       text: "text-info",             icon: ShieldCheck },
  user:  { bg: "bg-muted border-border",          text: "text-muted-foreground", icon: CircleUser },
};

function RoleBadge({ role }: { role: UserRole }) {
  const s = ROLE_STYLES[role];
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", s.bg, s.text)}>
      <Icon className="size-3" />
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-[14px] font-bold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNext, setShowNext] = React.useState(false);

  React.useEffect(() => {
    if (open) { setCurrent(""); setNext(""); setConfirm(""); setShowCurrent(false); setShowNext(false); }
  }, [open]);

  const lengthOk = next.length >= 12;
  const mixedCase = /[a-z]/.test(next) && /[A-Z]/.test(next);
  const hasNumber = /\d/.test(next);
  const hasSymbol = /[^A-Za-z0-9]/.test(next);
  const matches = next.length > 0 && next === confirm;
  const canSubmit = current.length > 0 && lengthOk && mixedCase && hasNumber && hasSymbol && matches;

  function submit() {
    onClose();
    toast.success("Password updated", { description: "You will stay signed in on this device." });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Change Password</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
            <div className="relative">
              <Input type={showCurrent ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} className="h-9 pr-9 text-[13px]" />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
            <div className="relative">
              <Input type={showNext ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} className="h-9 pr-9 text-[13px]" />
              <button type="button" onClick={() => setShowNext((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNext ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confirm Password</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div className="space-y-1 rounded-lg border border-border bg-background px-3 py-2.5">
            {([
              ["At least 12 characters", lengthOk],
              ["Mixed upper and lowercase letters", mixedCase],
              ["At least one number", hasNumber],
              ["At least one symbol", hasSymbol],
              ["Passwords match", matches],
            ] as [string, boolean][]).map(([label, ok]) => (
              <div key={label} className="flex items-center gap-1.5 text-[11px]">
                <Check className={cn("size-3", ok ? "text-success" : "text-muted-foreground/40")} />
                <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!canSubmit} onClick={submit} className="gap-1.5">
            <KeyRound className="size-3.5" />
            Update Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TwoFAModal({ open, onClose, onEnable }: { open: boolean; onClose: () => void; onEnable: () => void }) {
  const [code, setCode] = React.useState("");
  React.useEffect(() => { if (open) setCode(""); }, [open]);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Enable Two-Factor Authentication</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Scan the QR code with your authenticator app, then enter the 6-digit code.
          </p>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          <div className="flex justify-center">
            <div className="flex size-44 items-center justify-center rounded-lg border border-border bg-background p-3">
              <div className="grid size-full grid-cols-12 grid-rows-12 gap-px">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className={cn("rounded-[1px]", ((i * 37) % 7 < 3 || i % 5 === 0) ? "bg-foreground" : "bg-transparent")} />
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Or enter this key</p>
            <p className="mt-0.5 font-mono text-[12px] text-foreground">JBSWY3DPEHPK3PXPEHPK3PXPEHPK3PXP</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">6-digit verification code</label>
            <Input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6}
              className="h-10 text-center font-mono text-[18px] tracking-[0.5em]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={code.length !== 6} onClick={() => { onEnable(); onClose(); }} className="gap-1.5">
            <ShieldCheck className="size-3.5" />
            Enable 2FA
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const seedUser = React.useMemo(() => MOCK_USERS.find((u) => u.isCurrentUser) ?? MOCK_USERS[0], []);

  const [fullName, setFullName] = React.useState(authUser?.name ?? seedUser.fullName);
  const [displayName, setDisplayName] = React.useState(seedUser.displayName);
  const [email] = React.useState(authUser?.email ?? seedUser.email);
  const [phone, setPhone] = React.useState(seedUser.phone ?? "");
  const [department, setDepartment] = React.useState(seedUser.department ?? "");
  const [twoFactor, setTwoFactor] = React.useState(seedUser.twoFactorEnabled);
  const [pwdOpen, setPwdOpen] = React.useState(false);
  const [twoFAOpen, setTwoFAOpen] = React.useState(false);

  const role: UserRole = seedUser.role;
  const initials = fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const dirty =
    fullName !== seedUser.fullName ||
    displayName !== seedUser.displayName ||
    phone !== (seedUser.phone ?? "") ||
    department !== (seedUser.department ?? "");

  function saveChanges() {
    toast.success("Profile updated", { description: "Your changes have been saved." });
  }

  function disable2FA() {
    setTwoFactor(false);
    toast.success("Two-factor authentication disabled");
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>My Profile</PageHeader.Title>
          <PageHeader.Description>
            Manage your personal info, contact details and authentication.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button disabled={!dirty} onClick={saveChanges} className="gap-1.5">
            <Save className="size-3.5" />
            Save Changes
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {initials}
          </div>
          <button className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-card bg-background text-muted-foreground transition-colors hover:text-foreground">
            <Camera className="size-3.5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[18px] font-bold text-foreground">{fullName}</h2>
            <RoleBadge role={role} />
          </div>
          <p className="mt-0.5 text-[12px] text-muted-foreground">{email}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            User ID <span className="font-mono text-foreground">{seedUser.id}</span> · Joined {seedUser.createdAtDisplay}
          </p>
        </div>
      </div>

      <SectionCard title="Personal Info" description="Your name and contact details.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <UserIcon className="size-3" />
              Full Name
            </label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <UserIcon className="size-3" />
              Display Name
            </label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Mail className="size-3" />
              Email Address
            </label>
            <Input value={email} disabled className="h-9 text-[13px]" />
            <p className="mt-1 text-[11px] text-muted-foreground">Email cannot be changed. Contact your admin.</p>
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Phone className="size-3" />
              Phone
            </label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+65 9123 4567" className="h-9 font-mono text-[13px]" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Building2 className="size-3" />
              Department
            </label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Security Operations" className="h-9 text-[13px]" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Role & Workspace" description="Your role and assigned permissions.">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3.5">
            <Shield className="mt-0.5 size-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-foreground">Current Role</p>
                <RoleBadge role={role} />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Your role is managed by your organization owner — contact them to request changes.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Site Access ({seedUser.sitePermissions.length})
            </p>
            {seedUser.sitePermissions.length === 0 ? (
              <p className="text-[12px] italic text-muted-foreground">No site access granted.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {seedUser.sitePermissions.map((p) => (
                  <span key={p.siteId} className="inline-flex items-center gap-1 rounded-md border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info">
                    {p.siteName}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Authentication" description="Secure your account with a strong password and 2FA.">
        <div className="space-y-2">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <KeyRound className="size-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-foreground">Password</p>
              <p className="text-[11px] text-muted-foreground">Last changed {seedUser.passwordChangedDisplay}</p>
            </div>
            <Button variant="outline" onClick={() => setPwdOpen(true)}>Change Password</Button>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <Smartphone className="size-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold text-foreground">Two-Factor Authentication</p>
                {twoFactor ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">Enabled</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning">Not Enabled</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {twoFactor ? "TOTP via Authenticator app" : "Add a layer of protection by requiring a code from your authenticator app."}
              </p>
            </div>
            {twoFactor ? (
              <Button variant="outline" className="border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10" onClick={disable2FA}>
                Disable
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setTwoFAOpen(true)}>Enable 2FA</Button>
            )}
          </div>
        </div>
      </SectionCard>

      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
      <TwoFAModal open={twoFAOpen} onClose={() => setTwoFAOpen(false)} onEnable={() => { setTwoFactor(true); toast.success("Two-factor authentication enabled"); }} />
    </div>
  );
}
