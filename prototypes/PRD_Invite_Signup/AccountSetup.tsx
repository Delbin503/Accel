import * as React from "react";
import { Eye, EyeOff, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AccelMark, roleLabel, type InviteContext } from "./shared";
import { PhoneField, DEFAULT_DIAL_CODE } from "./PhoneField";

export interface AccountProfile {
  fullName: string;
  displayName: string;
  phone: string;
  department: string;
}

/* Role pill — mirrors the dashboard RoleBadge palette. */
function RolePill({ role }: { role: InviteContext["role"] }) {
  const styles: Record<InviteContext["role"], string> = {
    owner: "bg-success-soft text-success",
    admin: "bg-primary-muted text-primary",
    user: "bg-warning-soft text-warning",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider",
        styles[role]
      )}
    >
      {roleLabel(role)}
    </span>
  );
}

function initials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  const chars = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : local.slice(0, 2);
  return chars.toUpperCase();
}

/* Field label — matches the EditUserModal pattern in the live app. */
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";
const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

const MIN_PASSWORD = 8;

/** Lightweight strength score 0–4 from length + character variety. */
function passwordStrength(pw: string): { score: number; label: string; barClass: string; textClass: string } {
  let score = 0;
  if (pw.length >= MIN_PASSWORD) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12 && score >= 3) score = 4;
  const meta = [
    { label: "Too short", barClass: "bg-muted", textClass: "text-muted-foreground" },
    { label: "Weak", barClass: "bg-sev-critical", textClass: "text-sev-critical" },
    { label: "Fair", barClass: "bg-warning", textClass: "text-warning" },
    { label: "Good", barClass: "bg-success", textClass: "text-success" },
    { label: "Strong", barClass: "bg-success", textClass: "text-success" },
  ];
  return { score, ...meta[score] };
}

export function AccountSetup({
  invite,
  onComplete,
}: {
  invite: InviteContext;
  onComplete: (profile: AccountProfile) => void;
}) {
  const [fullName, setFullName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [dialCode, setDialCode] = React.useState(DEFAULT_DIAL_CODE);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [agreed, setAgreed] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const pwLongEnough = password.length >= MIN_PASSWORD;
  const pwMatches = confirm.length > 0 && password === confirm;
  const nameValid = fullName.trim().length >= 2;
  const strength = passwordStrength(password);

  const canSubmit = nameValid && pwLongEnough && pwMatches && agreed;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!canSubmit) return;
    const phone = phoneNumber.trim() ? `${dialCode} ${phoneNumber.trim()}` : "";
    onComplete({
      fullName: fullName.trim(),
      displayName: displayName.trim() || fullName.trim().split(/\s+/)[0] || "",
      phone,
      department: department.trim(),
    });
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-5 py-10">
      <header className="mb-7 flex flex-col items-center text-center">
        <AccelMark size="lg" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Set up your account</h1>
        <p className="mt-1.5 text-md text-muted-foreground">
          <strong className="text-foreground">{invite.inviterName}</strong> invited you to{" "}
          <strong className="text-foreground">{invite.orgName}</strong>. Complete your profile to get started.
        </p>
      </header>

      {/* Identity chip — same layout as the live app's Edit User modal header. */}
      <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
        <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-muted text-sm font-bold text-primary">
          {initials(invite.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">{invite.email}</p>
          <p className="text-xs text-muted-foreground">Invited by {invite.inviterName}</p>
        </div>
        <RolePill role={invite.role} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="fullName" className={labelClass}>Full Name</label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Delbin Arkar"
            autoComplete="name"
            className={cn(inputClass, submitted && !nameValid && "border-sev-critical")}
          />
          {submitted && !nameValid && (
            <p className="mt-1 flex items-center gap-1 text-2xs text-sev-critical">
              <CircleAlert className="size-3" /> Enter your full name.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="displayName" className={labelClass}>Display Name</label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Delbin (shown to teammates)"
            autoComplete="nickname"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <PhoneField dialCode={dialCode} number={phoneNumber} onDialCode={setDialCode} onNumber={setPhoneNumber} />
        </div>

        <div>
          <label htmlFor="department" className={labelClass}>Department</label>
          <input
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="e.g. Operations, Security, IT"
            autoComplete="organization-title"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={cn(inputClass, "pr-10", submitted && !pwLongEnough && "border-sev-critical")}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < strength.score ? strength.barClass : "bg-muted"
                    )}
                  />
                ))}
              </div>
              <p className={cn("mt-1 text-2xs font-semibold uppercase tracking-wider", strength.textClass)}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirm" className={labelClass}>Confirm Password</label>
          <input
            id="confirm"
            type={showPw ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            className={cn(inputClass, confirm.length > 0 && !pwMatches && "border-sev-critical")}
          />
          {confirm.length > 0 && !pwMatches && (
            <p className="mt-1 flex items-center gap-1 text-2xs text-sev-critical">
              <CircleAlert className="size-3" /> Passwords don't match.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">Email and User ID cannot be changed after creation.</p>

        {/* Terms agreement */}
        <label htmlFor="terms" className="flex items-center gap-2.5 pt-1">
          <Checkbox id="terms" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} />
          <span className="text-sm text-foreground">
            I agree to the{" "}
            <a href="#" className="font-medium text-primary underline hover:text-primary-hover">Terms of Service</a> and{" "}
            <a href="#" className="font-medium text-primary underline hover:text-primary-hover">Privacy Policy</a>.
          </span>
        </label>

        <Button type="submit" disabled={!canSubmit} className="mt-2 w-full" size="lg">
          Create account
        </Button>
      </form>
    </div>
  );
}
