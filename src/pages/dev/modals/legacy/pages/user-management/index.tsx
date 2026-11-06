/**
 * Frozen copy of src/pages/user-management/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/user-management/index.tsx.
 */
import * as React from "react";
import { Search, ChevronDown, Check, ShieldCheck, ShieldOff, Mail, MapPin, Trash2, Crown, CircleUser, AlertTriangle, RotateCcw, Calendar, Ban, Clock } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DEFAULT_DIAL_CODE, splitPhone } from "@/lib/dialCodes";
import { PhoneField } from "@/components/shared/PhoneField";
import { USER_SITES, USER_ROLE_LABELS } from "@/mocks/users";
import type { Suspension, UserData, UserRole } from "@/types/users";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ── Role badge ──────────────────────────────────────────────────────────── */

const ROLE_STYLES: Record<UserRole, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  owner: { bg: "bg-success/15 border-success/30", text: "text-success", icon: Crown },
  admin: { bg: "bg-info/15 border-info/30",       text: "text-info",    icon: ShieldCheck },
  user:  { bg: "bg-warning/15 border-warning/30", text: "text-warning", icon: CircleUser },
};

function RoleBadge({ role, withIcon = true }: { role: UserRole; withIcon?: boolean }) {
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

/* ── Avatar ──────────────────────────────────────────────────────────────── */

function Avatar({ user, size = 36 }: { user: UserData; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full bg-muted font-mono text-sm font-semibold text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </div>
  );
}

/* ── Invite Users modal ──────────────────────────────────────────────────── */

// Basic but practical email regex — accepts "name+tag@domain.co" style addresses.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): { all: string[]; valid: string[]; invalid: string[]; duplicates: string[] } {
  const tokens = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  for (const t of tokens) {
    const lower = t.toLowerCase();
    if (seen.has(lower)) { duplicates.push(t); continue; }
    seen.add(lower);
    if (EMAIL_RE.test(t)) valid.push(t);
    else invalid.push(t);
  }
  return { all: tokens, valid, invalid, duplicates };
}

export function InviteUsersModal({
  open,
  onClose,
  onInvite,
  seatUsage,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string, role: UserRole, sites: string[], departments: string[]) => void;
  seatUsage: Record<UserRole, SeatUsage>;
}) {
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("user");
  const [sites, setSites] = React.useState<string[]>([]);
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<{ emails?: string; sites?: string; departments?: string }>({});

  React.useEffect(() => {
    if (open) { setEmails(""); setRole("user"); setSites([]); setDepartments([]); setErrors({}); }
  }, [open]);

  const parsed = React.useMemo(() => parseEmails(emails), [emails]);
  const seatsLeft = seatUsage[role].available;
  const overSeat = parsed.valid.length > seatsLeft;
  const noSeats = seatsLeft === 0;

  // Clear validation errors as the user edits emails / site selection.
  React.useEffect(() => { setErrors({}); }, [emails, sites, departments]);

  function handleSend() {
    const next: { emails?: string; sites?: string; departments?: string } = {};
    if (parsed.valid.length === 0) next.emails = "Enter at least one valid email address.";
    else if (parsed.invalid.length > 0) next.emails = "Fix the invalid email addresses before sending.";
    if (sites.length === 0) next.sites = "Select at least one site.";
    if (departments.length === 0) next.departments = "Select at least one department.";
    setErrors(next);
    if (Object.keys(next).length > 0 || overSeat || noSeats) return;
    onInvite(emails, role, sites, departments);
  }

  const siteLabel =
    sites.length === 0                 ? "Select sites" :
    sites.length === USER_SITES.length ? "All sites" :
    sites.length === 1                 ? (USER_SITES.find((s) => s.value === sites[0])?.label ?? "1 site") :
                                         `${sites.length} sites selected`;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Invite Users"
          description="Invitees receive a one-time email link valid for 7 days."
        />

        {/* Scrollable body — modal height is fixed; content scrolls inside. */}
        <ModalBody className="space-y-3.5">
          {/* Seat tiles double as the role selector — pick a tier to invite into. */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Seat Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background p-2">
              {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                const s = seatUsage[r];
                const isLow = s.available === 0;
                const isSelected = role === r;
                // Owner is assigned only via ownership transfer — not invitable here.
                const selectable = r !== "owner";
                return (
                  <button
                    key={r}
                    type="button"
                    disabled={!selectable}
                    onClick={() => selectable && setRole(r)}
                    className={cn(
                      "rounded-md border px-2 py-1.5 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                      selectable ? "hover:border-primary/40" : "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-1">
                      <RoleBadge role={r} withIcon={false} />
                      <span className={cn("font-mono text-3xs font-bold", isLow ? "text-sev-critical" : "text-success")}>
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
              Owner role can only be assigned via ownership transfer.
            </p>
          </div>

          {/* Site Access — moved ABOVE the email field, rendered as a dropdown */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Access
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-base transition-colors",
                    sites.length === 0
                      ? "border-input text-muted-foreground"
                      : "border-primary/50 text-foreground"
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    {siteLabel}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1.5">
                <button
                  onClick={() => setSites(sites.length === USER_SITES.length ? [] : USER_SITES.map((s) => s.value))}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  <span>{sites.length === USER_SITES.length ? "Clear all" : "Select all"}</span>
                  <span className="font-mono text-muted-foreground">{sites.length}/{USER_SITES.length}</span>
                </button>
                <div className="mt-1 max-h-48 overflow-y-auto border-t border-border pt-1">
                  {USER_SITES.map((s) => {
                    const checked = sites.includes(s.value);
                    return (
                      <button
                        key={s.value}
                        onClick={() =>
                          setSites((curr) => (curr.includes(s.value) ? curr.filter((v) => v !== s.value) : [...curr, s.value]))
                        }
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                      >
                        <span className={cn(
                          "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border",
                          checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                        )}>
                          {checked && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                        <TruncatedText text={s.label} className="text-foreground" />
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Department */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </label>
            <Input
              value={departments.join(", ")}
              onChange={(e) => setDepartments(e.target.value.split(",").map((department) => department.trim()).filter(Boolean))}
              placeholder="e.g. Security Operations"
              className={errors.departments ? "border-sev-critical/60" : undefined}
            />
            {errors.departments && <p className="mt-1 text-xs text-sev-critical">{errors.departments}</p>}
          </div>

          {/* Emails */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Addresses
              </label>
              {parsed.valid.length > 0 && (
                <span className="text-2xs text-muted-foreground">
                  <strong className={cn(overSeat ? "text-sev-critical" : "text-success")}>{parsed.valid.length}</strong> valid
                  {parsed.invalid.length > 0 && <> · <strong className="text-sev-critical">{parsed.invalid.length}</strong> invalid</>}
                  {parsed.duplicates.length > 0 && <> · <strong className="text-warning">{parsed.duplicates.length}</strong> duplicate</>}
                </span>
              )}
            </div>
            <Textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="alice@acme.com, bob@acme.com…"
              rows={2}
              className={cn(
                "w-full",
                parsed.invalid.length > 0 && "border-sev-critical/40 focus:border-sev-critical"
              )}
            />
            <p className="mt-0.5 text-2xs text-muted-foreground/70">
              Separate multiple emails with commas, spaces, or new lines.
            </p>
            {errors.emails && <p className="mt-1 text-xs text-sev-critical">{errors.emails}</p>}
            {parsed.invalid.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.05] px-2.5 py-1.5 text-xs text-sev-critical">
                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{parsed.invalid.length} invalid email{parsed.invalid.length === 1 ? "" : "s"}:</p>
                  <p className="font-mono text-2xs opacity-80">{parsed.invalid.slice(0, 5).join(", ")}{parsed.invalid.length > 5 ? ` +${parsed.invalid.length - 5} more` : ""}</p>
                </div>
              </div>
            )}
          </div>

          {errors.sites && <p className="text-xs text-sev-critical">{errors.sites}</p>}

          {(noSeats || overSeat) && (
            <div className="flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.06] px-2.5 py-1.5 text-xs text-sev-critical">
              <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
              <div>
                {noSeats ? (
                  <p><strong>No {seatUsage[role].label} seats remaining.</strong> Purchase more from Billing & License.</p>
                ) : (
                  <p><strong>Not enough seats.</strong> Inviting {parsed.valid.length} but only {seatsLeft} available.</p>
                )}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSend} className="gap-1.5">
            <Mail className="size-3.5" />
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Seat usage strip (top of page) ──────────────────────────────────────── */

export interface SeatUsage { role: UserRole; total: number; assigned: number; available: number; pending: number; price: number; label: string }

/* ── Manage Site modal ───────────────────────────────────────────────────── */

export function ManageSiteModal({
  open,
  users,
  onClose,
  onConfirm,
}: {
  open: boolean;
  users: UserData[];
  onClose: () => void;
  onConfirm: (sites: string[]) => void;
}) {
  const initialSites = users.length === 1 ? users[0].sitePermissions.map((p) => p.siteId) : [];
  const initialSitesKey = initialSites.slice().sort().join("|");
  const [sites, setSites] = React.useState<string[]>(initialSites);
  const [siteSearch, setSiteSearch] = React.useState("");
  const isBulk = users.length > 1;
  const isDirty = sites.slice().sort().join("|") !== initialSitesKey;

  React.useEffect(() => { if (open) { setSites(initialSites); setSiteSearch(""); } }, [open, initialSitesKey]);

  if (users.length === 0) return null;

  function toggle(s: string) {
    setSites((curr) => (curr.includes(s) ? curr.filter((v) => v !== s) : [...curr, s]));
  }

  const visibleSites = USER_SITES.filter((s) => {
    if (!siteSearch) return true;
    return s.label.toLowerCase().includes(siteSearch.toLowerCase());
  });

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Manage Site (${users.length})` : "Manage Site Access"}
          description={
            isBulk
              ? `Choose which sites the ${users.length} selected members can access.`
              : "Choose which sites this member can access. Changes apply immediately."
          }
        />
        <ModalBody className="space-y-3">
          {isBulk ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <p className="text-sm leading-snug text-muted-foreground">
                This will <strong className="text-foreground">replace</strong> site access for{" "}
                <strong className="text-foreground">{users.length}</strong> selected users with the selection below.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <Avatar user={users[0]} size={32} />
              <div className="min-w-0">
                <TruncatedText text={users[0].fullName} className="text-base font-semibold text-foreground" />
                <TruncatedText text={users[0].email} className="text-xs text-muted-foreground" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Access ({sites.length}/{USER_SITES.length} selected)
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSites(USER_SITES.map((s) => s.value))}
                className="text-xs text-muted-foreground underline hover:text-primary">
                Select all
              </button>
              <span className="text-muted-foreground/40">·</span>
              <button onClick={() => setSites([])}
                className="text-xs text-muted-foreground underline hover:text-primary">
                Clear
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)}
              placeholder="Search sites…" className="h-9 pl-9 text-base" />
          </div>
        </ModalBody>
        <ModalBody className="space-y-1.5">
          {visibleSites.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">No sites match "{siteSearch}".</p>
          ) : (
            visibleSites.map((s) => {
              const checked = sites.includes(s.value);
              return (
                <button
                  key={s.value}
                  onClick={() => toggle(s.value)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                >
                  <div
                    className={cn(
                      "flex size-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
                      checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                    )}
                  >
                    {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                  </div>
                  <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                    <MapPin className="size-4 text-info" />
                  </div>
                  <span className="text-base font-medium text-foreground">{s.label}</span>
                </button>
              );
            })
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!isDirty} onClick={() => onConfirm(sites)}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Edit User modal ─────────────────────────────────────────────────────── */

export function EditUserModal({
  open,
  user,
  onClose,
  onConfirm,
}: {
  open: boolean;
  user: UserData | null;
  onClose: () => void;
  onConfirm: (patch: Partial<UserData>) => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [dialCode, setDialCode] = React.useState(DEFAULT_DIAL_CODE);
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [departments, setDepartments] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open && user) {
      // Treat placeholder "—" values as empty so the placeholder text shows.
      const clean = (v: string) => (v === "—" || v.trim() === "" ? "" : v);
      setFirstName(clean(user.firstName));
      setLastName(clean(user.lastName));
      const parsed = splitPhone(user.phone);
      setDialCode(parsed.dialCode);
      setPhoneNumber(parsed.number);
      setDepartments(user.departments);
    }
  }, [open, user]);

  if (!user) return null;

  // Recombine code + number; an empty number means "no phone".
  const phone = phoneNumber.trim() ? `${dialCode} ${phoneNumber.trim()}` : "";

  const unchanged =
    firstName === user.firstName &&
    lastName === user.lastName &&
    phone === (user.phone ?? "") &&
    departments.join("|") === user.departments.join("|");

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Edit User"
          description="Email and User ID are fixed after creation."
        />
        <ModalBody className="space-y-3">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
            <Avatar user={user} size={32} />
            <div className="min-w-0 flex-1">
              <TruncatedText text={user.email} className="text-base font-semibold text-foreground" />
              <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>

          {([
            { label: "First Name",  kind: "text",  value: firstName, set: setFirstName, mono: false, placeholder: "e.g. Delbin", icon: CircleUser },
            { label: "Last Name",   kind: "text",  value: lastName,  set: setLastName,  mono: false, placeholder: "e.g. Arkar", icon: CircleUser },
            { label: "Phone",       kind: "phone" },
          ] as const).map((f) => (
            <div key={f.label}>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {f.label}
              </label>
              {f.kind === "phone" ? (
                <PhoneField dialCode={dialCode} number={phoneNumber} onDialCode={setDialCode} onNumber={setPhoneNumber} />
              ) : (
                <div className="relative">
                  <f.icon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className={cn(
                      "h-9 w-full rounded-md border border-input bg-background px-9 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                      f.mono && "font-mono"
                    )}
                  />
                </div>
              )}
            </div>
          ))}
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
          <p className="text-xs text-muted-foreground">
            Email and User ID cannot be changed after creation.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={unchanged || !firstName.trim()}
            onClick={() =>
              onConfirm({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
                phone: phone.trim() || undefined,
                departments,
              })
            }
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Suspend User modal (with duration picker + note) ────────────────────── */

type SuspendPreset = "permanent" | "7d" | "30d" | "custom";

const SUSPEND_DURATION_LABEL: Record<SuspendPreset, string> = {
  permanent: "Permanent",
  "7d":     "7 days",
  "30d":    "1 month",
  custom: "Custom range",
};

const PRESET_DAYS: Record<"7d" | "30d", number> = {
  "7d": 7, "30d": 30,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function fmtInput(d: Date): string {
  // yyyy-mm-dd for native date input
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function SuspendUserModal({
  open,
  users,
  onClose,
  onConfirm,
}: {
  open: boolean;
  users: UserData[];
  onClose: () => void;
  onConfirm: (suspension: Suspension) => void;
}) {
  const [preset, setPreset] = React.useState<SuspendPreset>("7d");
  const today = new Date();
  const [startDate, setStartDate] = React.useState<string>(fmtInput(today));
  const [endDate, setEndDate] = React.useState<string>(fmtInput(addDays(today, 7)));
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      const now = new Date();
      setPreset("7d");
      setStartDate(fmtInput(now));
      setEndDate(fmtInput(addDays(now, 7)));
      setNote("");
    }
  }, [open]);

  if (users.length === 0) return null;
  const isBulk = users.length > 1;

  const customValid =
    preset !== "custom" || (startDate.length > 0 && endDate.length > 0 && new Date(endDate) >= new Date(startDate));

  function handleConfirm() {
    const now = new Date();
    let endsDisplay: string;
    if (preset === "custom") {
      endsDisplay = fmtDate(new Date(endDate));
    } else if (preset === "permanent") {
      endsDisplay = "Permanent";
    } else {
      endsDisplay = fmtDate(addDays(now, PRESET_DAYS[preset]));
    }
    const startedAtDisplay =
      preset === "custom"
        ? fmtDate(new Date(startDate))
        : now.toLocaleString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
    onConfirm({
      preset,
      startedAtDisplay,
      endsAtDisplay: endsDisplay,
      suspendedBy: "Delbin Arkar",
      note: note.trim() || undefined,
    });
  }

  const PRESETS: SuspendPreset[] = ["permanent", "7d", "30d", "custom"];

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Suspend User (${users.length})` : "Suspend User"}
          description="Sign-in will be blocked for the selected duration. Audit history is preserved."
        />
        <ModalBody className="space-y-4">
          {isBulk ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <p className="text-sm leading-snug text-muted-foreground">
                Applying to <strong className="text-foreground">{users.length}</strong> selected users.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <Avatar user={users[0]} size={32} />
              <div className="min-w-0">
                <TruncatedText text={users[0].fullName} className="text-base font-semibold text-foreground" />
                <TruncatedText text={users[0].email} className="text-xs text-muted-foreground" />
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors",
                    preset === p
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {p === "custom" ? <Calendar className="size-3.5" /> : p === "permanent" ? <ShieldOff className="size-3.5" /> : <Clock className="size-3.5" />}
                  {SUSPEND_DURATION_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Note (Optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for suspension — visible to admins and in the audit log."
              rows={3}
              className="w-full"
            />
          </div>

          <div className="rounded-lg border border-sev-critical/25 bg-sev-critical/[0.05] px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              <Ban className="mr-1 inline-block size-3 text-sev-critical align-text-bottom" />
              Suspending blocks sign-in immediately. Active sessions revoke on next refresh.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={!customValid}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            <ShieldOff className="size-3.5" />
            Suspend
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Reinstate confirm (lightweight) ─────────────────────────────────────── */

export function ReinstateModal({
  open,
  users,
  onClose,
  onConfirm,
}: {
  open: boolean;
  users: UserData[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (users.length === 0) return null;
  const isBulk = users.length > 1;
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Reinstate User (${users.length})` : "Reinstate User"}
          description="Sign-in is restored immediately and previous access is reapplied."
        />
        <ModalBody className="space-y-3">
          {isBulk ? (
            <p className="text-base text-muted-foreground">
              Reinstating <strong className="text-foreground">{users.length}</strong> selected users.
            </p>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <Avatar user={users[0]} size={32} />
              <div className="min-w-0">
                <TruncatedText text={users[0].fullName} className="text-base font-semibold text-foreground" />
                <TruncatedText text={users[0].email} className="text-xs text-muted-foreground" />
              </div>
            </div>
          )}
          <div className="rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2.5">
            <p className="text-sm leading-snug text-muted-foreground">
              <RotateCcw className="mr-1 inline-block size-3 text-success align-text-bottom" />
              Access will be restored on next sign-in. Existing role and site permissions are unchanged.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Reinstate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete User modal ───────────────────────────────────────────────────── */

export function DeleteUserModal({
  open,
  users,
  onClose,
  onConfirm,
}: {
  open: boolean;
  users: UserData[];
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) setNote("");
  }, [open]);

  if (users.length === 0) return null;
  const isBulk = users.length > 1;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Delete Users (${users.length})` : "Delete User"}
          description="This action cannot be undone."
          tone="destructive"
        />
        <ModalBody>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">
                  You are about to permanently remove:
                </p>
                {isBulk ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {users.length} selected users will lose access immediately.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 font-mono text-sm text-muted-foreground">{users[0].id}</p>
                    <p className="mt-0.5 text-base text-muted-foreground">{users[0].fullName} · {users[0].email}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Audit history remains preserved for compliance. You will need to re-invite the user to restore access.
          </p>
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Note (Optional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for permanent deletion — preserved in the audit log."
              rows={3}
              className="w-full"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => onConfirm(note)}>
            <Trash2 className="size-3.5" />
            Delete {isBulk ? `${users.length} Users` : "User"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Reset confirms (password + 2FA) ─────────────────────────────────────── */

export function ResetConfirmModal({
  open,
  title,
  description,
  detail,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  /** One-line header summary. */
  description: string;
  /** Longer consequence copy, shown in the body callout. */
  detail: React.ReactNode;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title={title} description={description} />
        <ModalBody>
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
            <div className="text-sm leading-snug text-muted-foreground">{detail}</div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
