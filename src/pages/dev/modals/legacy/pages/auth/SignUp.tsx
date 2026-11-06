/**
 * Frozen copy of src/pages/auth/SignUp.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/auth/SignUp.tsx.
 */
import * as React from "react";
import { Mail, MapPin, AlertTriangle, Crown, ShieldCheck, CircleUser, Lock as LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MOCK_SEATS } from "@/mocks/licenses";
import { USER_ROLE_LABELS } from "@/mocks/users";
import type { UserRole } from "@/types/users";
import { TruncatedText } from "@/components/shared/TruncatedText";

type InviteRole = "admin" | "user";

interface InviteRow {
  id: string;
  email: string;
  role: InviteRole;
  departments: string[];
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

  React.useEffect(() => {
    if (open) {
      setEmails("");
      setRole("user");
      setDepartments([]);
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
                    onClick={() => selectable && setRole(r as InviteRole)}
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
        </ModalBody>

        <ModalFooter>
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
