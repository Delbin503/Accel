/**
 * Frozen copy of src/pages/auth/onprem/OnPremSetup.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/auth/onprem/OnPremSetup.tsx.
 */
import * as React from "react";
import { Lock, AlertCircle, ShieldCheck, Mail, Crown, CircleUser, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { MOCK_SEATS } from "@/mocks/licenses";
import type { UserRole } from "@/types/users";

type MemberRole = "admin" | "user";

interface Member {
  id: string;
  email: string;
  role: MemberRole;
  departments: string[];
}

const MEMBER_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  user: "User",
};

/* Email parser — same regex + token rules as the On-Cloud invite modal. */
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
    if (MEMBER_EMAIL_RE.test(t)) valid.push(t);
    else invalid.push(t);
  }
  return { all: tokens, valid, invalid, duplicates };
}

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

/* ── Member modal — mirrors the On-Cloud Invite Users modal exactly ── */

export function MemberModal({
  open,
  onClose,
  onInvite,
  siteName,
  currentMembers,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string[], role: MemberRole, departments: string[]) => void;
  siteName: string;
  currentMembers: Member[];
}) {
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<MemberRole>("user");
  const [departments, setDepartments] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setEmails("");
      setRole("user");
      setDepartments([]);
    }
  }, [open]);

  const parsed = React.useMemo(() => parseEmails(emails), [emails]);

  const usage: Record<UserRole, { assigned: number; total: number; available: number }> =
    React.useMemo(() => {
      const mk = (r: UserRole, assigned: number) => {
        const total = MOCK_SEATS[r].total;
        return { assigned, total, available: Math.max(0, total - assigned) };
      };
      return {
        owner: mk("owner", 1),
        admin: mk("admin", currentMembers.filter((m) => m.role === "admin").length),
        user: mk("user", currentMembers.filter((m) => m.role === "user").length),
      };
    }, [currentMembers]);

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
              Owner role can only be assigned via ownership transfer.
            </p>
          </div>

          {/* Site Access — locked to the current site */}
          <div>
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Access
            </label>
            <div
              className="flex h-9 w-full cursor-not-allowed items-center gap-2 rounded-md border border-input bg-muted/30 px-3 text-base"
              aria-disabled="true"
            >
              <MapPin className="size-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-foreground">{siteName || "Your new site"}</span>
              <span className="ml-auto inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground/70">
                <Lock className="size-3" /> Locked to current site
              </span>
            </div>
            <p className="mt-0.5 text-2xs text-muted-foreground/70">
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
                  <strong className={cn(overSeat ? "text-sev-critical" : "text-success")}>
                    {parsed.valid.length}
                  </strong>{" "}
                  valid
                  {parsed.invalid.length > 0 && (
                    <>
                      {" "}
                      · <strong className="text-sev-critical">{parsed.invalid.length}</strong> invalid
                    </>
                  )}
                  {parsed.duplicates.length > 0 && (
                    <>
                      {" "}
                      · <strong className="text-warning">{parsed.duplicates.length}</strong> duplicate
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
                  ? "border-sev-critical/40 focus:border-sev-critical"
                  : "focus:border-primary"
              )}
            />
            <p className="mt-0.5 text-2xs text-muted-foreground/70">
              Separate multiple emails with commas, spaces, or new lines.
            </p>
            {parsed.invalid.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.05] px-2.5 py-1.5 text-xs text-sev-critical">
                <AlertCircle className="mt-0.5 size-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    {parsed.invalid.length} invalid email{parsed.invalid.length === 1 ? "" : "s"}:
                  </p>
                  <p className="font-mono text-2xs opacity-80">
                    {parsed.invalid.slice(0, 5).join(", ")}
                    {parsed.invalid.length > 5 ? ` +${parsed.invalid.length - 5} more` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {(noSeats || overSeat) && (
            <div className="flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.06] px-2.5 py-1.5 text-xs text-sev-critical">
              <AlertCircle className="mt-0.5 size-3 flex-shrink-0" />
              <div>
                {noSeats ? (
                  <p>
                    <strong>No {MEMBER_ROLE_LABELS[role]} seats remaining.</strong> Upgrade your plan or remove pending invites.
                  </p>
                ) : (
                  <p>
                    <strong>Not enough seats.</strong> Inviting {parsed.valid.length} but only {seatsLeft} available.
                  </p>
                )}
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
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
