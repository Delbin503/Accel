import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  X,
  Users as UsersIcon,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Mail,
  Pencil,
  MapPin,
  Trash2,
  MoreHorizontal,
  KeyRound,
  Smartphone,
  Crown,
  CircleUser,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  CheckSquare,
  Calendar,
  Ban,
  Clock,
  Plus,
  CreditCard,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import {
  MOCK_USERS,
  USER_SITES,
  USER_ROLE_LABELS,
  USER_ROLE_DESCRIPTIONS,
  USER_STATUS_LABELS,
  USER_ACTIVITY_LABELS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
} from "@/mocks/users";
import { MOCK_SEATS, ORG_LICENSE_INFO } from "@/mocks/licenses";
import type { SitePermission, Suspension, UserData, UserRole, UserStatus } from "@/types/users";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";

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
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      {withIcon && <Icon className="size-3" />}
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<UserStatus, { bg: string; text: string; dot: string }> = {
  active:    { bg: "bg-success/15 border-success/30",           text: "text-success",      dot: "bg-success" },
  pending:   { bg: "bg-info/15 border-info/30",                 text: "text-info",         dot: "bg-info" },
  suspended: { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical", dot: "bg-sev-critical" },
};

function StatusPill({ status }: { status: UserStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {USER_STATUS_LABELS[status]}
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
      className="flex items-center justify-center rounded-full bg-muted font-mono text-[12px] font-semibold text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </div>
  );
}

/* ── Checkbox ────────────────────────────────────────────────────────────── */

function Checkbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate?: boolean; onChange: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={cn(
        "flex size-4 flex-shrink-0 items-center justify-center rounded border transition-colors",
        checked || indeterminate ? "border-primary bg-primary" : "border-muted-foreground/40 hover:border-primary/60"
      )}
    >
      {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
      {!checked && indeterminate && <span className="h-px w-2 bg-primary-foreground" />}
    </button>
  );
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */

type KpiFilter = "all" | "owners" | "admins" | "users" | "suspended";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  sub: string;
  accent: KpiAccent;
  getValue: (items: UserData[]) => number;
}[] = [
  { key: "all",       label: "Total Users",     sub: "All registered accounts",        accent: "primary",      getValue: (i) => i.length },
  { key: "owners",    label: "Owners",          sub: "Full control — billing & ownership", accent: "success",  getValue: (i) => i.filter((u) => u.role === "owner").length },
  { key: "admins",    label: "Admins",          sub: "Can grant any permission",       accent: "info",         getValue: (i) => i.filter((u) => u.role === "admin").length },
  { key: "users",     label: "Users",           sub: "Site-scoped daily users",        accent: "warning",      getValue: (i) => i.filter((u) => u.role === "user").length },
  { key: "suspended", label: "Suspended Users", sub: "Sign-in blocked",                accent: "sev-critical", getValue: (i) => i.filter((u) => u.status === "suspended").length },
];

/* ── Multi-select dropdown ───────────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly FilterOption[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className="truncate font-medium">{displayLabel}</span>
          <ChevronDown
            className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {opt.label}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Filter panel ────────────────────────────────────────────────────────── */

interface UserFilters {
  role:   string[];
  status: string[];
  site:   string[];
}
const EMPTY_FILTERS: UserFilters = { role: [], status: [], site: [] };

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: UserFilters;
  onChange: (f: UserFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof UserFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-[11px] font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All roles", "All statuses", "All sites"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(EMPTY_FILTERS); onSearchChange(""); }}
              className="text-[12px] text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, email, or user ID…"
              className="h-9 w-full pl-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: "role"   as const, label: "Role",   opts: USER_ROLE_OPTIONS as readonly FilterOption[] },
              { key: "status" as const, label: "Status", opts: USER_STATUS_OPTIONS as readonly FilterOption[] },
              { key: "site"   as const, label: "Site",   opts: USER_SITES },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}s`}
                  options={opts}
                  selected={filters[key]}
                  onChange={(v) => setGroup(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sites cell ──────────────────────────────────────────────────────────── */

function SitesCell({ user }: { user: UserData }) {
  if (user.sitePermissions.length === 0) {
    return <span className="text-[12px] text-muted-foreground">—</span>;
  }
  if (user.sitePermissions.length === USER_SITES.length) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-info/20 bg-info/5 px-2 py-0.5 text-[11px] font-semibold text-info">
        All Sites ({user.sitePermissions.length})
      </span>
    );
  }
  return (
    <span className="text-[12px] text-foreground">
      {user.sitePermissions.map((p) => p.siteName).join(", ")}
    </span>
  );
}

/* ── Drawer helpers ──────────────────────────────────────────────────────── */

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      {aside}
    </div>
  );
}

function StatCard({ label, value, valueClass, sub }: { label: string; value: React.ReactNode; valueClass?: string; sub?: React.ReactNode }) {
  // Derive accent from valueClass so the shared accent bar matches the value tint.
  const accent: KpiAccent =
    valueClass?.includes("text-success")      ? "success" :
    valueClass?.includes("text-info")         ? "info" :
    valueClass?.includes("text-sev-critical") ? "sev-critical" :
    valueClass?.includes("text-warning")      ? "warning" :
    valueClass?.includes("text-purple")       ? "purple" :
    "primary";
  return <KpiCard compact label={label} value={value} sub={sub} accent={accent} />;
}

const ACTIVITY_CHIP_STYLES: Record<string, string> = {
  auth:          "bg-success/15 text-success",
  events:        "bg-info/15 text-info",
  cases:         "bg-warning/15 text-warning",
  authorization: "bg-purple-soft text-purple",
  models:        "bg-info/15 text-info",
  user:          "bg-success/15 text-success",
  config:        "bg-warning/15 text-warning",
  "data-access": "bg-info/15 text-info",
  license:       "bg-purple-soft text-purple",
  system:        "bg-muted text-muted-foreground",
  maintenance:   "bg-sev-critical/15 text-sev-critical",
};

/* ── Update User dropdown (drawer footer) ────────────────────────────────── */

function UpdateUserMenu({
  isSuspended,
  onEdit,
  onChangeRole,
  onManageSite,
  onSuspend,
  onReinstate,
}: {
  isSuspended: boolean;
  onEdit: () => void;
  onChangeRole: () => void;
  onManageSite: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  function item(icon: React.ReactNode, label: string, handler: () => void, kind: "default" | "warn" | "success" = "default") {
    return (
      <button
        onClick={() => { setOpen(false); handler(); }}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] transition-colors",
          kind === "warn" && "text-warning hover:bg-warning/10",
          kind === "success" && "text-success hover:bg-success/10",
          kind === "default" && "text-foreground hover:bg-muted"
        )}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-1.5 text-[12px]">
          Update
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-52 p-1.5">
        <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Manage
        </div>
        {item(<Pencil className="size-3.5" />, "Edit User", onEdit)}
        {item(<Shield className="size-3.5" />, "Change Role", onChangeRole)}
        {item(<MapPin className="size-3.5" />, "Manage Site", onManageSite)}
        <div className="my-1.5 border-t border-border" />
        <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Access
        </div>
        {isSuspended
          ? item(<RotateCcw className="size-3.5" />, "Reinstate", onReinstate, "success")
          : item(<ShieldOff className="size-3.5" />, "Suspend User", onSuspend, "warn")}
      </PopoverContent>
    </Popover>
  );
}

/* ── Suspension info card (shown in drawer when status === suspended) ────── */

function SuspensionInfoCard({ suspension, onReinstate }: { suspension: Suspension; onReinstate: () => void }) {
  return (
    <div className="rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-sev-critical/30 bg-sev-critical/10">
            <Ban className="size-4 text-sev-critical" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-sev-critical">Account Suspended</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Sign-in is blocked. Active sessions are revoked on next refresh.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-success/40 text-success hover:bg-success/10"
          onClick={onReinstate}
        >
          <RotateCcw className="size-3.5" />
          Reinstate
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-sev-critical/15 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Suspended From</p>
          <p className="mt-0.5 text-[12px] font-medium text-foreground">{suspension.startedAtDisplay}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Ends</p>
          <p className="mt-0.5 text-[12px] font-semibold text-sev-critical">{suspension.endsAtDisplay}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Suspended By</p>
          <p className="mt-0.5 text-[12px] font-medium text-foreground">{suspension.suspendedBy}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Duration</p>
          <p className="mt-0.5 text-[12px] font-medium text-foreground">{SUSPEND_DURATION_LABEL[suspension.preset]}</p>
        </div>
      </div>
      {suspension.note && (
        <div className="mt-3 rounded-lg border border-sev-critical/15 bg-card px-3 py-2.5">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Note</p>
          <p className="text-[12px] leading-relaxed text-foreground">{suspension.note}</p>
        </div>
      )}
    </div>
  );
}

/* ── User detail drawer ──────────────────────────────────────────────────── */

interface UserDrawerProps {
  user: UserData | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onChangeRole: () => void;
  onManageSite: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
  onReset2FA: () => void;
}

function UserDrawer({
  user,
  open,
  onClose,
  onEdit,
  onChangeRole,
  onManageSite,
  onSuspend,
  onReinstate,
  onDelete,
  onResetPassword,
  onReset2FA,
}: UserDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          {user ? (
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar user={user} size={44} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <SheetTitle className="truncate text-[17px] font-bold">
                      {user.fullName}
                      {user.isCurrentUser && (
                        <span className="ml-1.5 text-[12px] font-medium text-muted-foreground">(You)</span>
                      )}
                    </SheetTitle>
                    <RoleBadge role={user.role} />
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {user.email}
                    {user.lastSignInRelative && ` · Last sign-in: ${user.lastSignInRelative}`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <SheetTitle className="text-[15px] text-muted-foreground">User not found</SheetTitle>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </SheetHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {user ? (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Suspension banner */}
            {user.status === "suspended" && user.suspension && (
              <SuspensionInfoCard suspension={user.suspension} onReinstate={onReinstate} />
            )}

            {/* Overview KPIs */}
            <div>
              <SectionTitle>Overview</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Cases Owned" value={user.cases30d} sub="Last 30 days" />
                <StatCard
                  label="SLA Met"
                  value={`${user.slaMetPct}%`}
                  sub="Across owned cases"
                  valueClass={
                    user.slaMetPct >= 90
                      ? "text-success"
                      : user.slaMetPct >= 75
                      ? "text-warning"
                      : "text-sev-critical"
                  }
                />
                <StatCard label="Sign-ins" value={user.signIns30d} sub="Last 30 days" />
              </div>
            </div>

            {/* Member details */}
            <div>
              <SectionTitle>Member Details</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
                {(
                  [
                    ["Full Name",     user.fullName],
                    ["Status",        <StatusPill status={user.status} />],
                    ["Display Name",  user.displayName],
                    ["Role",          <RoleBadge role={user.role} />],
                    ["Phone",         <span className="font-mono text-xs">{user.phone ?? "—"}</span>],
                    ["User ID",       <span className="font-mono text-xs text-primary">{user.id}</span>],
                    ["Department",    user.department ?? "—"],
                    ["Email",         user.email],
                    ["Created On",    user.createdAtDisplay],
                    ["Last Active",   user.lastActiveDisplay],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-[13px] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Site permissions — no Manage button (Fix #2) */}
            <div>
              <SectionTitle>Site Permissions ({user.sitePermissions.length})</SectionTitle>
              {user.sitePermissions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted-foreground">
                  No site access granted.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    User can access the following sites. Revoke a site to remove access immediately
                    (next sign-in or active session refresh).
                  </p>
                  {user.sitePermissions.map((p) => (
                    <div
                      key={p.siteId}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5"
                    >
                      <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                        <MapPin className="size-4 text-info" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-foreground">{p.siteName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.cameraCount} cameras · Granted {p.grantedAtDisplay} by {p.grantedBy}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                        <CheckCircle2 className="size-3" />
                        Granted
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role & Access */}
            <div>
              <SectionTitle>Role & Access</SectionTitle>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <RoleBadge role={user.role} />
                  <p className="flex-1 text-[12px] leading-relaxed text-muted-foreground">
                    {USER_ROLE_DESCRIPTIONS[user.role]}
                  </p>
                </div>
                <p className="mt-3 border-t border-border pt-3 text-[11px] text-muted-foreground">
                  Role-based permissions are configured by the Owner in{" "}
                  <span className="font-semibold text-foreground">System Config → Role Permissions</span>.
                </p>
              </div>
            </div>

            {/* Authentication — wired buttons (Fix #2) */}
            <div>
              <SectionTitle>Authentication</SectionTitle>
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-foreground">Password</p>
                    <p className="text-[11px] text-muted-foreground">
                      Last changed {user.passwordChangedDisplay}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onResetPassword}>
                    Reset (Force Change)
                  </Button>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
                  <Smartphone className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-semibold text-foreground">Two-Factor Authentication</p>
                      {user.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">
                          Opt-in · Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-warning">
                          Not Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {user.twoFactorEnabled ? "TOTP via Authenticator app" : "User has not enrolled in 2FA"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!user.twoFactorEnabled} onClick={onReset2FA}>
                    Reset (2FA)
                  </Button>
                </div>
              </div>
            </div>

            {/* Activities */}
            <div>
              <SectionTitle>User Activities</SectionTitle>
              {user.activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[12px] text-muted-foreground">
                  No activity yet.
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card">
                  {user.activities.map((a, idx) => (
                    <div
                      key={a.id}
                      className={cn(
                        "flex items-start gap-3 px-3.5 py-2.5",
                        idx > 0 && "border-t border-border/60"
                      )}
                    >
                      <p className="w-[120px] flex-shrink-0 font-mono text-[10px] leading-tight text-muted-foreground">
                        {a.whenDisplay}
                      </p>
                      <span
                        className={cn(
                          "inline-flex flex-shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          ACTIVITY_CHIP_STYLES[a.kind] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {USER_ACTIVITY_LABELS[a.kind]}
                      </span>
                      <p className="flex-1 text-[12px] leading-snug text-foreground">{a.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertTriangle className="size-8 opacity-20" />
            <p className="text-sm">User not found.</p>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {user && (
          <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
            <UpdateUserMenu
              isSuspended={user.status === "suspended"}
              onEdit={onEdit}
              onChangeRole={onChangeRole}
              onManageSite={onManageSite}
              onSuspend={onSuspend}
              onReinstate={onReinstate}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Delete User
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
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

function InviteUsersModal({
  open,
  onClose,
  onInvite,
  seatUsage,
}: {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string, role: UserRole, sites: string[]) => void;
  seatUsage: Record<UserRole, SeatUsage>;
}) {
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("user");
  const [sites, setSites] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) { setEmails(""); setRole("user"); setSites([]); }
  }, [open]);

  const parsed = React.useMemo(() => parseEmails(emails), [emails]);
  const seatsLeft = seatUsage[role].available;
  const overSeat = parsed.valid.length > seatsLeft;
  const noSeats = seatsLeft === 0;

  const canSubmit =
    parsed.valid.length > 0 &&
    parsed.invalid.length === 0 &&
    sites.length > 0 &&
    !overSeat;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Invite Users</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Invitees receive a one-time email link valid for 7 days.
          </p>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          {/* Seat summary strip */}
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-background p-3">
            {(["owner", "admin", "user"] as UserRole[]).map((r) => {
              const s = seatUsage[r];
              const isLow = s.available === 0;
              const isSelected = role === r;
              return (
                <div key={r} className={cn(
                  "rounded-md border px-2.5 py-2 transition-colors",
                  isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
                )}>
                  <div className="mb-1 flex items-center justify-between gap-1.5">
                    <RoleBadge role={r} withIcon={false} />
                    <span className={cn("font-mono text-[10px] font-bold", isLow ? "text-sev-critical" : "text-success")}>
                      {s.available} left
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {s.assigned} / {s.total} used
                  </p>
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email Addresses
              </p>
              {parsed.valid.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  <strong className={cn(overSeat ? "text-sev-critical" : "text-success")}>{parsed.valid.length}</strong> valid
                  {parsed.invalid.length > 0 && <> · <strong className="text-sev-critical">{parsed.invalid.length}</strong> invalid</>}
                  {parsed.duplicates.length > 0 && <> · <strong className="text-warning">{parsed.duplicates.length}</strong> duplicate</>}
                </span>
              )}
            </div>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="alice@acme.com, bob@acme.com…"
              rows={3}
              className={cn(
                "w-full rounded-lg border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none",
                parsed.invalid.length > 0 ? "border-sev-critical/40 focus:border-sev-critical" : "border-border focus:border-primary"
              )}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Separate multiple emails with commas, spaces, or new lines.
            </p>

            {/* Validation feedback */}
            {parsed.invalid.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.05] px-3 py-2 text-[11px] text-sev-critical">
                <AlertTriangle className="mt-0.5 size-3.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{parsed.invalid.length} invalid email{parsed.invalid.length === 1 ? "" : "s"}:</p>
                  <p className="font-mono text-[10px] opacity-80">{parsed.invalid.slice(0, 5).join(", ")}{parsed.invalid.length > 5 ? ` +${parsed.invalid.length - 5} more` : ""}</p>
                </div>
              </div>
            )}
            {parsed.duplicates.length > 0 && (
              <p className="mt-1.5 text-[11px] text-warning">
                Removed {parsed.duplicates.length} duplicate{parsed.duplicates.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</p>
            <div className="space-y-2">
              {(["admin", "user"] as const).map((r) => {
                const s = seatUsage[r];
                const willExceed = role === r && parsed.valid.length > s.available;
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                      role === r ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                        role === r ? "border-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {role === r && <span className="size-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <RoleBadge role={r} />
                        <span className={cn("font-mono text-[10px] font-bold",
                          s.available === 0 ? "text-sev-critical" :
                          willExceed ? "text-sev-critical" :
                          s.available <= 2 ? "text-warning" :
                          "text-success"
                        )}>
                          {s.available} of {s.total} seats available
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                        {USER_ROLE_DESCRIPTIONS[r]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Owner role can only be assigned via ownership transfer.
            </p>
          </div>

          {/* Seat shortfall warning */}
          {(noSeats || overSeat) && (
            <div className="flex items-start gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2.5 text-[12px] text-sev-critical">
              <AlertTriangle className="mt-0.5 size-3.5 flex-shrink-0" />
              <div>
                {noSeats ? (
                  <p><strong>No {seatUsage[role].label} seats remaining.</strong> Purchase more seats from Billing & License before inviting.</p>
                ) : (
                  <p><strong>Not enough seats.</strong> You're inviting {parsed.valid.length} {seatUsage[role].label.toLowerCase()}{parsed.valid.length === 1 ? "" : "s"} but only {seatsLeft} {seatsLeft === 1 ? "seat is" : "seats are"} available. Remove some addresses or purchase more seats.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Site Access</p>
            <div className="grid grid-cols-1 gap-1.5">
              {USER_SITES.map((s) => {
                const checked = sites.includes(s.value);
                return (
                  <button
                    key={s.value}
                    onClick={() =>
                      setSites((curr) => (curr.includes(s.value) ? curr.filter((v) => v !== s.value) : [...curr, s.value]))
                    }
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:border-primary/40"
                  >
                    <div
                      className={cn(
                        "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                    </div>
                    <span className="text-[13px] text-foreground">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
          <Button size="sm" disabled={!canSubmit} onClick={() => onInvite(emails, role, sites)} className="gap-1.5">
            <Mail className="size-3.5" />
            Send {parsed.valid.length > 0 ? `${parsed.valid.length} Invite${parsed.valid.length === 1 ? "" : "s"}` : "Invites"}
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Seat usage strip (top of page) ──────────────────────────────────────── */

interface SeatUsage { role: UserRole; total: number; assigned: number; available: number; price: number; label: string }

function computeSeatUsage(users: UserData[], totals: Record<UserRole, number>): Record<UserRole, SeatUsage> {
  return (["owner", "admin", "user"] as UserRole[]).reduce((acc, role) => {
    const tier = MOCK_SEATS[role];
    const assigned = users.filter((u) => u.role === role).length;
    acc[role] = {
      role,
      total: totals[role],
      assigned,
      available: Math.max(0, totals[role] - assigned),
      price: tier.pricePerMonth,
      label: tier.label,
    };
    return acc;
  }, {} as Record<UserRole, SeatUsage>);
}

const SEAT_ROLE_STYLES: Record<"all" | UserRole, { bg: string; text: string; barClass: string; icon: React.ComponentType<{ className?: string }> }> = {
  all:   { bg: "bg-muted-foreground/15 border-border",        text: "text-foreground",   barClass: "bg-muted-foreground/40", icon: UsersIcon },
  owner: { bg: "bg-success/15 border-success/30",             text: "text-success",      barClass: "bg-success",             icon: Crown },
  admin: { bg: "bg-info/15 border-info/30",                   text: "text-info",         barClass: "bg-info",                icon: ShieldCheck },
  user:  { bg: "bg-warning/15 border-warning/30",             text: "text-warning",      barClass: "bg-warning",             icon: CircleUser },
};

function SeatPill({
  label, total, assigned, available, price, kind, billingCycle,
}: {
  label: string; total: number; assigned: number; available: number; price?: number;
  kind: "all" | UserRole; billingCycle: string;
}) {
  const cfg = SEAT_ROLE_STYLES[kind];
  const Icon = cfg.icon;
  const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={cn("group flex w-full flex-col gap-1 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40")}>
          <div className="flex items-center gap-1.5">
            <Icon className={cn("size-3", cfg.text)} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className="ml-auto text-[10px] text-muted-foreground/60">{pct}%</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-[16px] font-bold leading-none", cfg.text)}>{assigned}</span>
            <span className="text-[11px] text-muted-foreground">/ {total} seats</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", cfg.barClass)} style={{ width: `${pct}%` }} />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className={cn("flex size-7 items-center justify-center rounded-md border", cfg.bg)}>
            <Icon className={cn("size-3.5", cfg.text)} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-foreground">Total {label}</p>
            {price !== undefined && <p className="text-[10px] text-muted-foreground">${price}/mo · {billingCycle}</p>}
          </div>
        </div>
        <div className="space-y-1.5 rounded-md border border-border bg-background p-2.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-semibold text-foreground">{total}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Assigned</span>
            <span className={cn("font-mono font-semibold", cfg.text)}>{assigned}</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">Available</span>
            <span className={cn("font-mono font-semibold", available === 0 ? "text-sev-critical" : "text-success")}>{available}</span>
          </div>
        </div>
        {kind !== "all" && available === 0 && (
          <p className="mt-2 flex items-start gap-1 text-[11px] text-warning">
            <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
            No available seats — purchasing required to add a user.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SeatStrip({ usage, billingCycle }: { usage: Record<UserRole, SeatUsage>; billingCycle: string }) {
  const totalAll     = (["owner", "admin", "user"] as UserRole[]).reduce((s, r) => s + usage[r].total, 0);
  const assignedAll  = (["owner", "admin", "user"] as UserRole[]).reduce((s, r) => s + usage[r].assigned, 0);
  const availableAll = Math.max(0, totalAll - assignedAll);

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <CreditCard className="size-3.5 text-primary" />
          Seat Usage
        </div>
        <span className="text-[10px] text-muted-foreground/70">Hover or click each tier to see breakdown</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SeatPill kind="all"   label="Total Seats" total={totalAll} assigned={assignedAll} available={availableAll} billingCycle={billingCycle} />
        <SeatPill kind="owner" label="Owner Seats" total={usage.owner.total} assigned={usage.owner.assigned} available={usage.owner.available} price={usage.owner.price} billingCycle={billingCycle} />
        <SeatPill kind="admin" label="Admin Seats" total={usage.admin.total} assigned={usage.admin.assigned} available={usage.admin.available} price={usage.admin.price} billingCycle={billingCycle} />
        <SeatPill kind="user"  label="User Seats"  total={usage.user.total}  assigned={usage.user.assigned}  available={usage.user.available}  price={usage.user.price}  billingCycle={billingCycle} />
      </div>
    </div>
  );
}

/* ── Change Role modal ───────────────────────────────────────────────────── */

function ChangeRoleModal({
  open,
  users,
  seatUsage,
  onClose,
  onConfirm,
  onPurchaseSeat,
}: {
  open: boolean;
  users: UserData[];
  seatUsage: Record<UserRole, SeatUsage>;
  onClose: () => void;
  onConfirm: (role: UserRole) => void;
  onPurchaseSeat: (role: UserRole, quantity: number) => void;
}) {
  const initial = users.length === 1 ? users[0].role : "user";
  const [role, setRole] = React.useState<UserRole>(initial);
  const [showPurchase, setShowPurchase] = React.useState(false);
  const isBulk = users.length > 1;

  React.useEffect(() => { if (open) { setRole(initial); setShowPurchase(false); } }, [open, initial]);

  if (users.length === 0) return null;

  // Net delta per role if we apply `role` to the selected users.
  const additions = users.filter((u) => u.role !== role).length;
  const seatsNeededAfter = seatUsage[role].assigned + additions;
  const seatShortfall = Math.max(0, seatsNeededAfter - seatUsage[role].total);
  const currentTier = MOCK_SEATS[role];
  const purchaseTotal = seatShortfall * currentTier.pricePerMonth;
  const sameRole = !isBulk && role === users[0].role;

  function handleApply() {
    if (seatShortfall > 0) {
      setShowPurchase(true);
      return;
    }
    onConfirm(role);
  }

  function confirmPurchaseAndApply() {
    onPurchaseSeat(role, seatShortfall);
    setShowPurchase(false);
    onConfirm(role);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {showPurchase
              ? `Purchase ${currentTier.label} Seat${seatShortfall === 1 ? "" : "s"}`
              : isBulk ? `Change Role (${users.length})` : "Change Role"}
          </DialogTitle>
          {showPurchase && (
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              No available {currentTier.label.toLowerCase()} seats — purchase to continue.
            </p>
          )}
        </DialogHeader>

        {!showPurchase ? (
          <div className="space-y-3 px-5 py-4">
            {isBulk ? (
              <p className="text-[12px] text-muted-foreground">
                Applying to <strong className="text-foreground">{users.length}</strong> selected users.
              </p>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
                <Avatar user={users[0]} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-foreground">{users[0].fullName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{users[0].email}</p>
                </div>
                <RoleBadge role={users[0].role} />
              </div>
            )}
            <p className="text-[12px] text-muted-foreground">Choose a role</p>
            {USER_ROLE_OPTIONS.map((opt) => {
              const tier = MOCK_SEATS[opt.value];
              const u = seatUsage[opt.value];
              const willHaveShortfall = !isBulk
                ? (opt.value !== users[0].role && u.available === 0)
                : false;
              return (
                <button
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    role === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                      role === opt.value ? "border-primary" : "border-muted-foreground/40"
                    )}
                  >
                    {role === opt.value && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <RoleBadge role={opt.value} />
                      <span className="inline-flex items-center gap-1 font-mono text-[12px] font-bold text-foreground">
                        ${tier.pricePerMonth}<span className="text-[10px] font-normal text-muted-foreground">/mo</span>
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                      {USER_ROLE_DESCRIPTIONS[opt.value]}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                      <span className="text-muted-foreground">
                        <strong className={cn(u.available === 0 ? "text-sev-critical" : "text-success")}>
                          {u.available}
                        </strong> available · {u.assigned}/{u.total} used
                      </span>
                      {willHaveShortfall && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-warning/15 px-1.5 py-0.5 font-semibold text-warning">
                          <AlertTriangle className="size-2.5" />
                          Purchase required
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {seatShortfall > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
                <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
                <p className="text-[12px] leading-snug text-muted-foreground">
                  Applying this change requires <strong className="text-foreground">{seatShortfall}</strong> additional{" "}
                  {currentTier.label.toLowerCase()} seat{seatShortfall === 1 ? "" : "s"} at{" "}
                  <strong className="text-foreground">${currentTier.pricePerMonth}/mo each</strong>. You will be prompted to purchase.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <div>
                <p className="text-[13px] font-semibold text-foreground">No {currentTier.label.toLowerCase()} seats available</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                  You currently have <strong className="text-foreground">{seatUsage[role].assigned} of {seatUsage[role].total}</strong> {currentTier.label.toLowerCase()} seats assigned.
                  Purchase <strong className="text-foreground">{seatShortfall}</strong> additional seat{seatShortfall === 1 ? "" : "s"} to apply this change.
                </p>
              </div>
            </div>
            <div className="space-y-1.5 rounded-lg border border-border bg-background px-3.5 py-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">{seatShortfall} × {currentTier.label} seat</span>
                <span className="font-mono text-foreground">${currentTier.pricePerMonth} × {seatShortfall}</span>
              </div>
              <div className="border-t border-border/60" />
              <div className="flex items-center justify-between text-[13px] font-bold text-foreground">
                <span>Charged on next invoice</span>
                <span className="font-mono">+ ${purchaseTotal}/mo</span>
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-info/30 bg-info/5 px-2 py-1.5 text-[11px] text-muted-foreground">
                <Calendar className="mt-0.5 size-3 flex-shrink-0 text-info" />
                Next invoice <strong className="text-foreground">{ORG_LICENSE_INFO.nextInvoiceDate}</strong> ({ORG_LICENSE_INFO.paymentMethod})
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Manage all seats in <strong className="text-foreground">Billing & License</strong>.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          {showPurchase ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowPurchase(false)}>Back</Button>
              <Button size="sm" onClick={confirmPurchaseAndApply} className="gap-1.5">
                <Plus className="size-3.5" />
                Purchase {seatShortfall} Seat{seatShortfall === 1 ? "" : "s"} & Apply
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" disabled={sameRole} onClick={handleApply} className="gap-1.5">
                {seatShortfall > 0 ? <>
                  <CreditCard className="size-3.5" />
                  Continue · ${purchaseTotal}/mo
                </> : "Apply"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Manage Site modal ───────────────────────────────────────────────────── */

function ManageSiteModal({
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
  const initial =
    users.length === 1 ? users[0].sitePermissions.map((p) => p.siteId) : [];
  const [sites, setSites] = React.useState<string[]>(initial);
  const [siteSearch, setSiteSearch] = React.useState("");
  const isBulk = users.length > 1;

  React.useEffect(() => { if (open) { setSites(initial); setSiteSearch(""); } }, [open, JSON.stringify(initial)]);

  if (users.length === 0) return null;

  function toggle(s: string) {
    setSites((curr) => (curr.includes(s) ? curr.filter((v) => v !== s) : [...curr, s]));
  }

  const visibleSites = USER_SITES.filter((s) => {
    if (!siteSearch) return true;
    return s.label.toLowerCase().includes(siteSearch.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {isBulk ? `Manage Site (${users.length})` : "Manage Site Access"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-shrink-0 space-y-3 px-5 py-4">
          {isBulk ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <p className="text-[12px] leading-snug text-muted-foreground">
                This will <strong className="text-foreground">replace</strong> site access for{" "}
                <strong className="text-foreground">{users.length}</strong> selected users with the selection below.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <Avatar user={users[0]} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">{users[0].fullName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{users[0].email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Site Access ({sites.length}/{USER_SITES.length} selected)
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSites(USER_SITES.map((s) => s.value))}
                className="text-[11px] text-muted-foreground underline hover:text-primary">
                Select all
              </button>
              <span className="text-muted-foreground/40">·</span>
              <button onClick={() => setSites([])}
                className="text-[11px] text-muted-foreground underline hover:text-primary">
                Clear
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)}
              placeholder="Search sites…" className="h-9 pl-9 text-[13px]" />
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-5 pb-3">
          {visibleSites.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] italic text-muted-foreground">No sites match "{siteSearch}".</p>
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
                  <span className="text-[13px] font-medium text-foreground">{s.label}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onConfirm(sites)}>Apply</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit User modal ─────────────────────────────────────────────────────── */

function EditUserModal({
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
  const [fullName, setFullName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [department, setDepartment] = React.useState("");

  React.useEffect(() => {
    if (open && user) {
      setFullName(user.fullName);
      setDisplayName(user.displayName);
      setPhone(user.phone ?? "");
      setDepartment(user.department ?? "");
    }
  }, [open, user]);

  if (!user) return null;

  const unchanged =
    fullName === user.fullName &&
    displayName === user.displayName &&
    phone === (user.phone ?? "") &&
    department === (user.department ?? "");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
            <Avatar user={user} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-foreground">{user.email}</p>
              <p className="font-mono text-[11px] text-muted-foreground">{user.id}</p>
            </div>
            <RoleBadge role={user.role} />
          </div>

          {[
            { label: "Full Name",    value: fullName,    set: setFullName,    mono: false },
            { label: "Display Name", value: displayName, set: setDisplayName, mono: false },
            { label: "Phone",        value: phone,       set: setPhone,       mono: true  },
            { label: "Department",   value: department,  set: setDepartment,  mono: false },
          ].map(({ label, value, set, mono }) => (
            <div key={label}>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </label>
              <input
                value={value}
                onChange={(e) => set(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  mono && "font-mono"
                )}
              />
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">
            Email and User ID cannot be changed after creation.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={unchanged || !fullName.trim()}
            onClick={() =>
              onConfirm({
                fullName: fullName.trim(),
                displayName: displayName.trim(),
                phone: phone.trim() || undefined,
                department: department.trim() || undefined,
              })
            }
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Suspend User modal (with duration picker + note) ────────────────────── */

type SuspendPreset = "1d" | "3d" | "7d" | "30d" | "custom";

const SUSPEND_DURATION_LABEL: Record<SuspendPreset, string> = {
  "1d":     "1 day",
  "3d":     "3 days",
  "7d":     "7 days",
  "30d":    "1 month",
  custom: "Custom range",
};

const PRESET_DAYS: Record<Exclude<SuspendPreset, "custom">, number> = {
  "1d": 1, "3d": 3, "7d": 7, "30d": 30,
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

function SuspendUserModal({
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

  const PRESETS: SuspendPreset[] = ["1d", "3d", "7d", "30d", "custom"];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {isBulk ? `Suspend User (${users.length})` : "Suspend User"}
          </DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Sign-in will be blocked for the selected duration. Audit history is preserved.
          </p>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          {isBulk ? (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <p className="text-[12px] leading-snug text-muted-foreground">
                Applying to <strong className="text-foreground">{users.length}</strong> selected users.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <Avatar user={users[0]} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">{users[0].fullName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{users[0].email}</p>
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </p>
            <div className="grid grid-cols-5 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] font-semibold transition-colors",
                    preset === p
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {p === "custom" ? <Calendar className="size-3.5" /> : <Clock className="size-3.5" />}
                  {SUSPEND_DURATION_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for suspension — visible to admins and in the audit log."
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="rounded-lg border border-sev-critical/25 bg-sev-critical/[0.05] px-3 py-2.5">
            <p className="text-[11px] text-muted-foreground">
              <Ban className="mr-1 inline-block size-3 text-sev-critical align-text-bottom" />
              Suspending blocks sign-in immediately. Active sessions revoke on next refresh.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!customValid}
            onClick={handleConfirm}
            className="gap-1.5 bg-sev-critical text-white hover:bg-sev-critical/90"
          >
            <ShieldOff className="size-3.5" />
            Suspend
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Reinstate confirm (lightweight) ─────────────────────────────────────── */

function ReinstateModal({
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {isBulk ? `Reinstate User (${users.length})` : "Reinstate User"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          {isBulk ? (
            <p className="text-[13px] text-muted-foreground">
              Reinstating <strong className="text-foreground">{users.length}</strong> selected users.
            </p>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
              <Avatar user={users[0]} size={32} />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">{users[0].fullName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{users[0].email}</p>
              </div>
            </div>
          )}
          <div className="rounded-lg border border-success/25 bg-success/[0.06] px-3 py-2.5">
            <p className="text-[12px] leading-snug text-muted-foreground">
              <RotateCcw className="mr-1 inline-block size-3 text-success align-text-bottom" />
              Access will be restored on next sign-in. Existing role and site permissions are unchanged.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} className="gap-1.5">
            <RotateCcw className="size-3.5" />
            Reinstate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete User modal ───────────────────────────────────────────────────── */

function DeleteUserModal({
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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-destructive">
            {isBulk ? `Delete Users (${users.length})` : "Delete User"}
          </DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">This action cannot be undone.</p>
        </DialogHeader>
        <div className="px-5 py-5">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">
                  You are about to permanently remove:
                </p>
                {isBulk ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {users.length} selected users will lose access immediately.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 font-mono text-[12px] text-muted-foreground">{users[0].id}</p>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">{users[0].fullName} · {users[0].email}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Audit history remains preserved for compliance. You will need to re-invite the user to restore access.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete {isBulk ? `${users.length} Users` : "User"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Reset confirms (password + 2FA) ─────────────────────────────────────── */

function ResetConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
            <div className="text-[12px] leading-snug text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Bulk action bar ─────────────────────────────────────────────────────── */

function BulkActionBar({
  count,
  onClear,
  onChangeRole,
  onSuspend,
  onManageSite,
}: {
  count: number;
  onClear: () => void;
  onChangeRole: () => void;
  onSuspend: () => void;
  onManageSite: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="fixed inset-x-6 bottom-6 z-40 mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CheckSquare className="size-3.5" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">
          {count} user{count > 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5 text-[12px] text-muted-foreground" onClick={onClear}>
          <X className="size-3.5" />
          Clear selection
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button variant="outline" size="sm" className="gap-1.5 text-[12px]" onClick={onChangeRole}>
          <Shield className="size-3.5" />
          Change Role
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-[12px]" onClick={onManageSite}>
          <MapPin className="size-3.5" />
          Manage Site
        </Button>
        <Button size="sm" className="gap-1.5 text-[12px]" onClick={onSuspend}>
          <ShieldOff className="size-3.5" />
          Suspend User
        </Button>
      </div>
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

/* ─── Page ───────────────────────────────────────────────────────────────── */

type SortKey = "newest" | "oldest" | "name-asc" | "last-active";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",      label: "Newest First" },
  { key: "oldest",      label: "Oldest First" },
  { key: "name-asc",    label: "Name (A → Z)" },
  { key: "last-active", label: "Last Active" },
];

type DialogKind =
  | "invite"
  | "edit"
  | "change-role"
  | "manage-site"
  | "suspend"
  | "reinstate"
  | "delete"
  | "reset-password"
  | "reset-2fa"
  | null;

interface DialogState {
  kind: DialogKind;
  userIds: string[];
}

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<UserData[]>(MOCK_USERS);
  const [seatTotals, setSeatTotals] = React.useState<Record<UserRole, number>>({
    owner: MOCK_SEATS.owner.total,
    admin: MOCK_SEATS.admin.total,
    user:  MOCK_SEATS.user.total,
  });
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<UserFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [dialog, setDialog] = React.useState<DialogState>({ kind: null, userIds: [] });
  // Adapter so existing setToast(...) call sites route through sonner without a rewrite.
  const setToast = React.useCallback((next: { kind: "success" | "error"; message: string } | null) => {
    if (!next) return;
    if (next.kind === "success") toast.success(next.message);
    else                         toast.error(next.message);
  }, []);
  const pageSize = 10;

  const seatUsage = React.useMemo(() => computeSeatUsage(users, seatTotals), [users, seatTotals]);

  function handlePurchaseSeat(role: UserRole, quantity: number) {
    setSeatTotals((curr) => ({ ...curr, [role]: curr[role] + quantity }));
    const tier = MOCK_SEATS[role];
    setToast({
      kind: "success",
      message: `${quantity} ${tier.label} seat${quantity === 1 ? "" : "s"} added — +$${quantity * tier.pricePerMonth}/mo on next invoice`,
    });
  }

  const filtered = React.useMemo(() => {
    let list = users.filter((u) => {
      if (kpiFilter === "owners" && u.role !== "owner") return false;
      if (kpiFilter === "admins" && u.role !== "admin") return false;
      if (kpiFilter === "users" && u.role !== "user") return false;
      if (kpiFilter === "suspended" && u.status !== "suspended") return false;
      if (filters.role.length > 0 && !filters.role.includes(u.role)) return false;
      if (filters.status.length > 0 && !filters.status.includes(u.status)) return false;
      if (filters.site.length > 0 && !filters.site.some((s) => u.sitePermissions.find((p) => p.siteId === s))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [u.id, u.fullName, u.email, u.displayName].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name-asc") return a.fullName.localeCompare(b.fullName);
      if (sort === "last-active") return (b.lastActiveAt || "").localeCompare(a.lastActiveAt || "");
      if (sort === "oldest") return a.createdAtDisplay.localeCompare(b.createdAtDisplay);
      return b.createdAtDisplay.localeCompare(a.createdAtDisplay);
    });
    return list;
  }, [users, kpiFilter, filters, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerUser = drawerId ? users.find((u) => u.id === drawerId) ?? null : null;
  const dialogUsers = dialog.userIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is UserData => !!u);
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  const allPageSelected = pageItems.length > 0 && pageItems.every((u) => selectedIds.has(u.id));
  const somePageSelected = !allPageSelected && pageItems.some((u) => selectedIds.has(u.id));

  function togglePageAll() {
    setSelectedIds((curr) => {
      const next = new Set(curr);
      if (allPageSelected) pageItems.forEach((u) => next.delete(u.id));
      else pageItems.forEach((u) => next.add(u.id));
      return next;
    });
  }
  function toggleRow(id: string) {
    setSelectedIds((curr) => {
      const next = new Set(curr);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setPage(1);
  }

  function openDialog(kind: Exclude<DialogKind, null | "invite">, ids: string[]) {
    setDialog({ kind, userIds: ids });
  }
  function closeDialog() { setDialog({ kind: null, userIds: [] }); }

  function handleChangeRole(role: UserRole) {
    const ids = dialog.userIds;
    setUsers((curr) => curr.map((u) => (ids.includes(u.id) ? { ...u, role } : u)));
    closeDialog();
    setSelectedIds(new Set());
    setToast({
      kind: "success",
      message: ids.length > 1 ? `${ids.length} users updated to ${USER_ROLE_LABELS[role]}` : "Role updated successfully",
    });
  }

  function handleManageSite(siteIds: string[]) {
    const ids = dialog.userIds;
    const newPerms: SitePermission[] = siteIds.map((s) => ({
      siteId: s,
      siteName: USER_SITES.find((opt) => opt.value === s)?.label ?? s,
      cameraCount: 0,
      grantedAtDisplay: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      grantedBy: "Delbin Arkar",
    }));
    setUsers((curr) =>
      curr.map((u) => {
        if (!ids.includes(u.id)) return u;
        const merged: SitePermission[] = newPerms.map((np) => {
          const existing = u.sitePermissions.find((p) => p.siteId === np.siteId);
          return existing ? { ...existing } : np;
        });
        return { ...u, sitePermissions: merged };
      })
    );
    closeDialog();
    setSelectedIds(new Set());
    setToast({ kind: "success", message: ids.length > 1 ? `Site access updated for ${ids.length} users` : "Site access updated" });
  }

  function handleSuspend(suspension: Suspension) {
    const ids = dialog.userIds;
    setUsers((curr) =>
      curr.map((u) =>
        ids.includes(u.id) ? { ...u, status: "suspended" as UserStatus, suspension } : u
      )
    );
    closeDialog();
    setSelectedIds(new Set());
    setToast({
      kind: "success",
      message:
        ids.length > 1
          ? `${ids.length} users suspended until ${suspension.endsAtDisplay}`
          : `Suspended until ${suspension.endsAtDisplay}`,
    });
  }

  function handleReinstate() {
    const ids = dialog.userIds;
    setUsers((curr) =>
      curr.map((u) =>
        ids.includes(u.id) ? { ...u, status: "active" as UserStatus, suspension: undefined } : u
      )
    );
    closeDialog();
    setSelectedIds(new Set());
    setToast({
      kind: "success",
      message:
        ids.length > 1
          ? `${ids.length} users reinstated — access restored`
          : "User reinstated — access restored",
    });
  }

  function handleEdit(patch: Partial<UserData>) {
    const ids = dialog.userIds;
    setUsers((curr) => curr.map((u) => (ids.includes(u.id) ? { ...u, ...patch } : u)));
    closeDialog();
    setToast({ kind: "success", message: "User details updated" });
  }

  function handleDelete() {
    const ids = dialog.userIds;
    const target = users.find((u) => u.id === ids[0]);
    setUsers((curr) => curr.filter((u) => !ids.includes(u.id)));
    closeDialog();
    setDrawerId(null);
    setSelectedIds(new Set());
    setToast({
      kind: "success",
      message:
        ids.length > 1
          ? `${ids.length} users removed from this organization.`
          : `${target?.fullName ?? "User"} removed from this organization.`,
    });
  }

  function handleResetPassword() {
    closeDialog();
    setToast({ kind: "success", message: "Password reset link emailed — user will be forced to change on next sign-in" });
  }

  function handleReset2FA() {
    const ids = dialog.userIds;
    setUsers((curr) => curr.map((u) => (ids.includes(u.id) ? { ...u, twoFactorEnabled: false } : u)));
    closeDialog();
    setToast({ kind: "success", message: "2FA reset — user must re-enrol on next sign-in" });
  }

  function handleInvite(emails: string, role: UserRole, sites: string[]) {
    const list = emails.split(",").map((s) => s.trim()).filter(Boolean);
    const sitePerms: SitePermission[] = sites.map((s) => ({
      siteId: s,
      siteName: USER_SITES.find((opt) => opt.value === s)?.label ?? s,
      cameraCount: 0,
      grantedAtDisplay: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      grantedBy: "Delbin Arkar",
    }));
    const newUsers: UserData[] = list.map((email, i) => ({
      id: `USR-${(users.length + i + 1).toString().padStart(3, "0")}`,
      fullName: "Pending Invite",
      displayName: "—",
      email,
      role,
      status: "pending",
      createdAtDisplay: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      lastActiveAt: "",
      lastActiveDisplay: "—",
      sitePermissions: sitePerms,
      cases30d: 0,
      slaMetPct: 0,
      signIns30d: 0,
      twoFactorEnabled: false,
      passwordChangedDisplay: "Never",
      activities: [],
    }));
    setUsers((curr) => [...newUsers, ...curr]);
    closeDialog();
    setToast({
      kind: "success",
      message: `${newUsers.length} invite${newUsers.length === 1 ? "" : "s"} sent successfully`,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>User Management</PageHeader.Title>
          <PageHeader.Description>
            Manage workspace members — roles, site access, and authentication.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" onClick={() => setDialog({ kind: "invite", userIds: [] })}>
            <UserPlus className="size-4" />
            Invite Users
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Seat usage strip */}
      <SeatStrip usage={seatUsage} billingCycle={ORG_LICENSE_INFO.billingCycle} />

      {/* KPI cards */}
      <KpiGrid cols={5}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(users)}
            sub={cfg.sub}
            accent={cfg.accent}
            active={kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </KpiGrid>

      {/* Filter panel */}
      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
      />

      {/* Count + sort */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "user" : "users"} match current filters
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
              className="ml-2 text-muted-foreground underline hover:text-primary"
            >
              Clear filters
            </button>
          )}
        </p>
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              {SORT_OPTIONS.find((o) => o.key === sort)?.label}
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-44 p-1">
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => { setSort(o.key); setSortOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[12px] hover:bg-muted",
                  sort === o.key ? "text-primary" : "text-foreground"
                )}
              >
                {o.label}
                {sort === o.key && <Check className="size-3.5" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <UsersIcon className="size-10 opacity-20" />
          <p className="text-sm">No users match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  <th className="w-[44px] px-4 py-2.5">
                    <Checkbox
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      onChange={togglePageAll}
                    />
                  </th>
                  {["USER ID", "USER", "ROLE", "STATUS", "SITES", "LAST ACTIVE", "ACTION"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageItems.map((u) => {
                  const isSel = selectedIds.has(u.id);
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setDrawerId(u.id)}
                      className={cn(
                        "group cursor-pointer text-[13px] transition-colors hover:bg-muted/20",
                        isSel && "bg-primary/[0.04]"
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={isSel} onChange={() => toggleRow(u.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                          {u.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar user={u} size={32} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                              {u.fullName}
                              {u.isCurrentUser && (
                                <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">(You)</span>
                              )}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3"><StatusPill status={u.status} /></td>
                      <td className="px-4 py-3"><SitesCell user={u} /></td>
                      <td className="px-4 py-3 text-[12px] text-muted-foreground">{u.lastActiveDisplay}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                              <MoreHorizontal className="size-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-44 p-1" align="end">
                            <button
                              onClick={() => setDrawerId(u.id)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                            >
                              <CircleUser className="size-3.5 text-muted-foreground" />
                              View details
                            </button>
                            <button
                              onClick={() => openDialog("change-role", [u.id])}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                            >
                              <Shield className="size-3.5 text-muted-foreground" />
                              Change Role
                            </button>
                            <button
                              onClick={() => openDialog("manage-site", [u.id])}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                            >
                              <MapPin className="size-3.5 text-muted-foreground" />
                              Manage Site
                            </button>
                            <div className="my-1 border-t border-border" />
                            {u.status === "suspended" ? (
                              <button
                                onClick={() => openDialog("reinstate", [u.id])}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-success hover:bg-success/10"
                              >
                                <RotateCcw className="size-3.5" />
                                Reinstate
                              </button>
                            ) : (
                              <button
                                onClick={() => openDialog("suspend", [u.id])}
                                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-warning hover:bg-warning/10"
                              >
                                <ShieldOff className="size-3.5" />
                                Suspend User
                              </button>
                            )}
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-[12px] text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-[12px] text-foreground">
                {page} <span className="text-muted-foreground/60">of {pageCount}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <UserDrawer
        user={drawerUser}
        open={drawerId !== null}
        onClose={() => setDrawerId(null)}
        onEdit={() => drawerUser && openDialog("edit", [drawerUser.id])}
        onChangeRole={() => drawerUser && openDialog("change-role", [drawerUser.id])}
        onManageSite={() => drawerUser && openDialog("manage-site", [drawerUser.id])}
        onSuspend={() => drawerUser && openDialog("suspend", [drawerUser.id])}
        onReinstate={() => drawerUser && openDialog("reinstate", [drawerUser.id])}
        onDelete={() => drawerUser && openDialog("delete", [drawerUser.id])}
        onResetPassword={() => drawerUser && openDialog("reset-password", [drawerUser.id])}
        onReset2FA={() => drawerUser && openDialog("reset-2fa", [drawerUser.id])}
      />

      {/* Modals */}
      <InviteUsersModal open={dialog.kind === "invite"} onClose={closeDialog} onInvite={handleInvite} seatUsage={seatUsage} />
      <EditUserModal
        open={dialog.kind === "edit"}
        user={dialogUsers[0] ?? null}
        onClose={closeDialog}
        onConfirm={handleEdit}
      />
      <ChangeRoleModal
        open={dialog.kind === "change-role"}
        users={dialogUsers}
        seatUsage={seatUsage}
        onClose={closeDialog}
        onConfirm={handleChangeRole}
        onPurchaseSeat={handlePurchaseSeat}
      />
      <ManageSiteModal
        open={dialog.kind === "manage-site"}
        users={dialogUsers}
        onClose={closeDialog}
        onConfirm={handleManageSite}
      />
      <SuspendUserModal
        open={dialog.kind === "suspend"}
        users={dialogUsers}
        onClose={closeDialog}
        onConfirm={handleSuspend}
      />
      <ReinstateModal
        open={dialog.kind === "reinstate"}
        users={dialogUsers}
        onClose={closeDialog}
        onConfirm={handleReinstate}
      />
      <DeleteUserModal
        open={dialog.kind === "delete"}
        users={dialogUsers}
        onClose={closeDialog}
        onConfirm={handleDelete}
      />
      <ResetConfirmModal
        open={dialog.kind === "reset-password"}
        title="Reset Password"
        confirmLabel="Send Reset Email"
        onClose={closeDialog}
        onConfirm={handleResetPassword}
        description={
          <>
            A password reset email will be sent. The user will be required to set a new password on next sign-in.
          </>
        }
      />
      <ResetConfirmModal
        open={dialog.kind === "reset-2fa"}
        title="Reset Two-Factor Authentication"
        confirmLabel="Reset 2FA"
        onClose={closeDialog}
        onConfirm={handleReset2FA}
        description={
          <>
            The user's current 2FA enrolment will be removed. They will be prompted to re-enrol on next sign-in.
          </>
        }
      />

      {/* Bulk action bar */}
      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onChangeRole={() => openDialog("change-role", [...selectedIds])}
        onSuspend={() => openDialog("suspend", [...selectedIds])}
        onManageSite={() => openDialog("manage-site", [...selectedIds])}
      />

    </div>
  );
}
