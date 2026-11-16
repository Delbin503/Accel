import * as React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  SlidersHorizontal,
  Check,
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
  Calendar,
  Ban,
  Clock,
  Plus,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerFooter,
  DetailDrawerFooterStart,
  DetailDrawerHeader,
  DetailDrawerSection,
  DetailDrawerTitle,
} from "@accel/ui/components/shared/DetailDrawer";
import { DescriptionItem, DescriptionList } from "@accel/ui/components/shared/DescriptionList";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { Button } from "@accel/ui/components/ui/button";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { ItemButton } from "@accel/ui/components/ui/item";
import { Input } from "@accel/ui/components/ui/input";
import { Textarea } from "@accel/ui/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { cn } from "@accel/ui/lib/utils";
import { DEFAULT_DIAL_CODE, splitPhone } from "@accel/ui/lib/dialCodes";
import { PhoneField } from "@accel/ui/components/shared/PhoneField";
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
import { KpiCard, KpiGrid, type KpiTone } from "@accel/ui/components/shared/KpiCard";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { DEPARTMENTS } from "@/mocks/departments";
import { OtpField } from "@accel/ui/components/shared/OtpField";

const DEPARTMENT_OPTIONS: { value: string; label: string }[] = DEPARTMENTS.map((d) => ({
  value: d,
  label: d,
}));

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

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<UserStatus, { bg: string; text: string; dot: string }> = {
  active:    { bg: "bg-success/15 border-success/30",           text: "text-success",      dot: "bg-success" },
  pending:   { bg: "bg-info/15 border-info/30",                 text: "text-info",         dot: "bg-info" },
  suspended: { bg: "bg-severity-critical/15 border-severity-critical/30", text: "text-severity-critical", dot: "bg-severity-critical" },
};

function StatusPill({ status }: { status: UserStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider",
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
    <div data-slot="user-avatar"
      className="flex items-center justify-center rounded-full bg-muted font-mono text-sm font-semibold text-muted-foreground"
      style={{ width: size, height: size }}
    >
      {initials || "?"}
    </div>
  );
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */

type KpiFilter = "all" | "owners" | "admins" | "users" | "suspended";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  sub: string;
  accent: KpiTone;
  getValue: (items: UserData[]) => number;
}[] = [
  { key: "all",       label: "Total Users",     sub: "All registered accounts",        accent: "primary",      getValue: (i) => i.length },
  { key: "owners",    label: "Owner",           sub: "Full control — billing & ownership", accent: "success",  getValue: (i) => i.filter((u) => u.role === "owner").length },
  { key: "admins",    label: "Admins",          sub: "Can grant any permission",       accent: "info",         getValue: (i) => i.filter((u) => u.role === "admin").length },
  { key: "users",     label: "Members",         sub: "Site-scoped daily members",      accent: "warning",      getValue: (i) => i.filter((u) => u.role === "user").length },
  { key: "suspended", label: "Suspended Users", sub: "Sign-in blocked",                accent: "severity-critical", getValue: (i) => i.filter((u) => u.status === "suspended").length },
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
        <ItemButton variant="plain"
          className={cn("text-center", 
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary-ink" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <ItemButton variant="plain"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
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
            </ItemButton>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Filter panel ────────────────────────────────────────────────────────── */

interface UserFilters {
  role:       string[];
  status:     string[];
  site:       string[];
  department: string[];
}
const EMPTY_FILTERS: UserFilters = { role: [], status: [], site: [], department: [] };

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
  hideStatus = false,
  additionalActiveCount = 0,
}: {
  filters: UserFilters;
  onChange: (f: UserFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  hideStatus?: boolean;
  additionalActiveCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0) + additionalActiveCount;
  const emptyFilterLabels = hideStatus ? ["All sites"] : ["All statuses", "All sites"];
  const filterGroups = [
    ...(!hideStatus ? [{ key: "status" as const, label: "Status", opts: USER_STATUS_OPTIONS as readonly FilterOption[] }] : []),
    { key: "site"       as const, label: "Site",       opts: USER_SITES },
    { key: "department" as const, label: "Department", opts: DEPARTMENT_OPTIONS },
  ];

  function setGroup(group: keyof UserFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div data-slot="user-filter-panel" className="rounded-xl border border-border bg-card">
      <div data-slot="user-filter-panel-header"
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ItemButton variant="plain" type="button" onClick={() => setOpen((v) => !v)} className="text-[length:inherit] text-inherit flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {emptyFilterLabels.map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </ItemButton>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="h-auto px-0 border-0 rounded-none font-normal gap-0 text-[length:inherit] whitespace-normal hover:bg-transparent dark:hover:bg-transparent" type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div data-slot="user-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search by name, email, or user ID…" className="sm:w-full" />
          {/* One row — three columns on the main view, two when Status is hidden. */}
          <div data-slot="user-filter-panel-grid"
            className={cn(
              "grid grid-cols-1 gap-3",
              filterGroups.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
            )}
          >
            {filterGroups.map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  if (user.sitePermissions.length === USER_SITES.length) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md border border-info/20 bg-info/5 px-2 py-0.5 text-xs font-semibold text-info">
        All Sites ({user.sitePermissions.length})
      </span>
    );
  }
  return (
    <span className="text-sm text-foreground">
      {user.sitePermissions.map((p) => p.siteName).join(", ")}
    </span>
  );
}

/* ── Drawer helpers ──────────────────────────────────────────────────────── */

function StatCard({ label, value, valueClass, sub }: { label: string; value: React.ReactNode; valueClass?: string; sub?: React.ReactNode }) {
  // Derive accent from valueClass so the shared accent bar matches the value tint.
  const accent: KpiTone =
    valueClass?.includes("text-success")      ? "success" :
    valueClass?.includes("text-info")         ? "info" :
    valueClass?.includes("text-severity-critical") ? "severity-critical" :
    valueClass?.includes("text-warning")      ? "warning" :
    valueClass?.includes("text-violet")       ? "violet" :
    "primary";
  return <KpiCard compact label={label} value={value} sub={sub} tone={accent} />;
}

const ACTIVITY_CHIP_STYLES: Record<string, string> = {
  auth:          "bg-success/15 text-success",
  events:        "bg-info/15 text-info",
  cases:         "bg-warning/15 text-warning",
  authorization: "bg-violet/15 text-violet",
  models:        "bg-info/15 text-info",
  user:          "bg-success/15 text-success",
  config:        "bg-warning/15 text-warning",
  "data-access": "bg-info/15 text-info",
  license:       "bg-violet/15 text-violet",
  system:        "bg-muted text-muted-foreground",
  maintenance:   "bg-severity-critical/15 text-severity-critical",
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
      <ItemButton variant="plain"
        onClick={() => { setOpen(false); handler(); }}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-base transition-colors",
          kind === "warn" && "text-warning hover:bg-warning/10",
          kind === "success" && "text-success hover:bg-success/10",
          kind === "default" && "text-foreground hover:bg-muted"
        )}
      >
        {icon}
        {label}
      </ItemButton>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" className="gap-1.5 text-sm">
          Update
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-52 p-1.5">
        <div className="mb-1 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Manage
        </div>
        {item(<Pencil className="size-3.5" />, "Edit User", onEdit)}
        {item(<Shield className="size-3.5" />, "Change Role", onChangeRole)}
        {item(<MapPin className="size-3.5" />, "Manage Site", onManageSite)}
        <div className="my-1.5 border-t border-border" />
        <div className="mb-1 px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
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
    <div data-slot="suspension-info-card" className="rounded-xl border border-severity-critical/30 bg-severity-critical/[0.05] p-4">
      <div data-slot="suspension-info-card-header" className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-severity-critical/30 bg-severity-critical/10">
            <Ban className="size-4 text-severity-critical" />
          </div>
          <div>
            <p className="text-base font-bold text-severity-critical">Account Suspended</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
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
      <DescriptionList data-slot="suspension-info-card-details" columns={2} className="border-t border-severity-critical/15 pt-3 text-sm">
        <DescriptionItem label="Suspended From">{suspension.startedAtDisplay}</DescriptionItem>
        <DescriptionItem label="Ends"><span className="font-semibold text-severity-critical">{suspension.endsAtDisplay}</span></DescriptionItem>
        <DescriptionItem label="Suspended By">{suspension.suspendedBy}</DescriptionItem>
        <DescriptionItem label="Duration">{SUSPEND_DURATION_LABEL[suspension.preset]}</DescriptionItem>
      </DescriptionList>
      {suspension.note && (
        <div data-slot="suspension-info-card-note" className="mt-3 rounded-lg border border-severity-critical/15 bg-card px-3 py-2.5">
          <p className="mb-0.5 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Note</p>
          <p className="text-sm leading-relaxed text-foreground">{suspension.note}</p>
        </div>
      )}
    </div>
  );
}

function DeletedAccountInfoCard({
  deletedAtDisplay,
  deletedBy,
  deleteReason,
  onRestore,
}: {
  deletedAtDisplay: string;
  deletedBy: string;
  deleteReason?: string;
  onRestore: () => void;
}) {
  return (
    <div data-slot="deleted-account-info-card" className="rounded-xl border border-severity-critical/30 bg-severity-critical/[0.05] p-4">
      <div data-slot="deleted-account-info-card-header" className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-severity-critical/30 bg-severity-critical/10">
            <Trash2 className="size-4 text-severity-critical" />
          </div>
          <div>
            <p className="text-base font-bold text-severity-critical">Account Deleted</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              This account is removed from active access. Restore it to make the user active again.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-success/40 text-success hover:bg-success/10"
          onClick={onRestore}
        >
          <RotateCcw className="size-3.5" />
          Restore
        </Button>
      </div>
      <DescriptionList data-slot="deleted-account-info-card-details" columns={2} className="border-t border-severity-critical/15 pt-3 text-sm">
        <DescriptionItem label="Deleted On"><span className="font-semibold text-severity-critical">{deletedAtDisplay}</span></DescriptionItem>
        <DescriptionItem label="Deleted By">{deletedBy}</DescriptionItem>
        {deleteReason && (
          <DescriptionItem label="Reason" wide><span className="font-normal leading-relaxed">{deleteReason}</span></DescriptionItem>
        )}
      </DescriptionList>
    </div>
  );
}

/* ── User detail drawer ──────────────────────────────────────────────────── */

interface UserDrawerProps {
  user: UserData | null;
  open: boolean;
  mode?: "active" | "deleted";
  deletedMeta?: { deletedAtDisplay: string; deletedBy: string; deleteReason?: string };
  onClose: () => void;
  onEdit: () => void;
  onChangeRole: () => void;
  onManageSite: () => void;
  onSuspend: () => void;
  onReinstate: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  onResetPassword: () => void;
  onReset2FA: () => void;
}

export function UserDrawer({
  user,
  open,
  mode = "active",
  deletedMeta,
  onClose,
  onEdit,
  onChangeRole,
  onManageSite,
  onSuspend,
  onReinstate,
  onDelete,
  onRestore,
  onResetPassword,
  onReset2FA,
}: UserDrawerProps) {
  const isDeleted = mode === "deleted";
  return (
    <DetailDrawer open={open} onOpenChange={(v) => !v && onClose()} size="lg">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DetailDrawerHeader data-slot="user-drawer-header">
          {user ? (
            <div className="flex min-w-0 items-start gap-3">
              <Avatar user={user} size={44} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <RoleBadge role={user.role} />
                  {user.isCurrentUser && (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                      You
                    </span>
                  )}
                </div>
                <DetailDrawerTitle>
                  <TruncatedText text={user.fullName} />
                </DetailDrawerTitle>
                <DetailDrawerDescription>
                  {user.email}
                  {user.lastSignInRelative && ` · Last sign-in: ${user.lastSignInRelative}`}
                </DetailDrawerDescription>
              </div>
            </div>
          ) : (
            <DetailDrawerTitle className="text-md font-normal text-muted-foreground">User not found</DetailDrawerTitle>
          )}
        </DetailDrawerHeader>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        {user ? (
          <DetailDrawerBody data-slot="user-drawer-body">
            {isDeleted && deletedMeta && (
              <DeletedAccountInfoCard
                deletedAtDisplay={deletedMeta.deletedAtDisplay}
                deletedBy={deletedMeta.deletedBy}
                deleteReason={deletedMeta.deleteReason}
                onRestore={() => onRestore?.()}
              />
            )}

            {/* Suspension banner */}
            {!isDeleted && user.status === "suspended" && user.suspension && (
              <SuspensionInfoCard suspension={user.suspension} onReinstate={onReinstate} />
            )}

            {/* Overview KPIs */}
            <DetailDrawerSection data-slot="user-drawer-overview" title="Overview">
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
                      : "text-severity-critical"
                  }
                />
                <StatCard label="Sign-ins" value={user.signIns30d} sub="Last 30 days" />
              </div>
            </DetailDrawerSection>

            {/* Member details */}
            <DetailDrawerSection data-slot="user-drawer-details" title="Member Details">
              <DescriptionList columns={2} variant="card">
                <DescriptionItem label="First Name">{user.firstName || "—"}</DescriptionItem>
                {!isDeleted && <DescriptionItem label="Status"><StatusPill status={user.status} /></DescriptionItem>}
                <DescriptionItem label="Last Name">{user.lastName || "—"}</DescriptionItem>
                <DescriptionItem label="Role"><RoleBadge role={user.role} /></DescriptionItem>
                <DescriptionItem label="Phone" mono>{user.phone ?? "—"}</DescriptionItem>
                <DescriptionItem label="User ID" mono><span className="text-primary-ink">{user.id}</span></DescriptionItem>
                <DescriptionItem label="Department">
                  {user.departments.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {user.departments.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary-ink"
                        >
                          {d}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "—"
                  )}
                </DescriptionItem>
                <DescriptionItem label="Email">{user.email}</DescriptionItem>
                <DescriptionItem label="Created On">{user.createdAtDisplay}</DescriptionItem>
                <DescriptionItem label="Last Active">{user.lastActiveDisplay}</DescriptionItem>
              </DescriptionList>
            </DetailDrawerSection>

            {/* Site permissions — no Manage button (Fix #2) */}
            <DetailDrawerSection data-slot="user-drawer-sites" title={`Site Permissions (${user.sitePermissions.length})`}>
              {user.sitePermissions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No site access granted.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="mb-2 text-xs text-muted-foreground">
                    {isDeleted
                      ? "These were the user's assigned sites before deletion."
                      : "User can access the following sites. Revoke a site to remove access immediately (next sign-in or active session refresh)."}
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
                        <TruncatedText text={p.siteName} className="text-base font-semibold text-foreground" />
                        <p className="text-2xs text-muted-foreground">
                          {p.cameraCount} cameras · Granted {p.grantedAtDisplay} by {p.grantedBy}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
                        <CheckCircle2 className="size-3" />
                        Granted
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </DetailDrawerSection>

            {/* Role & Access */}
            <DetailDrawerSection data-slot="user-drawer-role" title="Role & Access">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <RoleBadge role={user.role} />
                  <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                    {USER_ROLE_DESCRIPTIONS[user.role]}
                  </p>
                </div>
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  Role-based permissions are configured by the Owner in{" "}
                  <span className="font-semibold text-foreground">System Configuration → Role Permissions</span>.
                </p>
              </div>
            </DetailDrawerSection>

            {/* Authentication — wired buttons (Fix #2) */}
            {!isDeleted && (
            <DetailDrawerSection data-slot="user-drawer-auth" title="Authentication">
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
                  <KeyRound className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">Password</p>
                    <p className="text-xs text-muted-foreground">
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
                      <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                      {user.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-success">
                          Opt-in · Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-warning">
                          Not Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.twoFactorEnabled ? "TOTP via Authenticator app" : "User has not enrolled in 2FA"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled={!user.twoFactorEnabled} onClick={onReset2FA}>
                    Reset (2FA)
                  </Button>
                </div>
              </div>
            </DetailDrawerSection>
            )}

            {/* Activities */}
            <DetailDrawerSection data-slot="user-drawer-activity" title="User Activities">
              {user.activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
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
                      <p className="w-[120px] flex-shrink-0 font-mono text-2xs leading-tight text-muted-foreground">
                        {a.whenDisplay}
                      </p>
                      <span
                        className={cn(
                          "inline-flex flex-shrink-0 items-center rounded px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
                          ACTIVITY_CHIP_STYLES[a.kind] ?? "bg-muted text-muted-foreground"
                        )}
                      >
                        {USER_ACTIVITY_LABELS[a.kind]}
                      </span>
                      <p className="flex-1 text-sm leading-snug text-foreground">{a.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </DetailDrawerSection>
          </DetailDrawerBody>
        ) : (
          <div data-slot="user-drawer-empty" className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <AlertTriangle className="size-8 opacity-20" />
            <p className="text-sm">User not found.</p>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {user && (
          <DetailDrawerFooter data-slot="user-drawer-footer" className="gap-2">
            {isDeleted ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-success/40 text-success hover:bg-success/10"
                onClick={() => onRestore?.()}
              >
                <RotateCcw className="size-3.5" />
                Restore Account
              </Button>
            ) : (
              <>
                <DetailDrawerFooterStart className="gap-2">
                  <UpdateUserMenu
                    isSuspended={user.status === "suspended"}
                    onEdit={onEdit}
                    onChangeRole={onChangeRole}
                    onManageSite={onManageSite}
                    onSuspend={onSuspend}
                    onReinstate={onReinstate}
                  />
                </DetailDrawerFooterStart>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-severity-critical/40 text-severity-critical hover:bg-severity-critical/10"
                  onClick={onDelete}
                >
                  <Trash2 className="size-3.5" />
                  Delete User
                </Button>
              </>
            )}
          </DetailDrawerFooter>
        )}
    </DetailDrawer>
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

  // Reset the form each time the modal opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) { setEmails(""); setRole("user"); setSites([]); setDepartments([]); setErrors({}); }
  }

  const parsed = React.useMemo(() => parseEmails(emails), [emails]);
  const seatsLeft = seatUsage[role].available;
  const overSeat = parsed.valid.length > seatsLeft;
  const noSeats = seatsLeft === 0;

  // Clear validation errors as the user edits emails / site selection.
  const [prevInputs, setPrevInputs] = React.useState({ emails, sites, departments });
  if (prevInputs.emails !== emails || prevInputs.sites !== sites || prevInputs.departments !== departments) {
    setPrevInputs({ emails, sites, departments });
    setErrors({});
  }

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
          <div data-slot="invite-users-modal-seats">
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
                  <ItemButton variant="plain" selected={isSelected}
                    key={r}
                    type="button"
                    disabled={!selectable}
                    onClick={() => selectable && setRole(r)}
                    className={cn("block w-auto text-[length:inherit] text-inherit", 
                      "rounded-md border px-2 py-1.5 text-left transition-colors",
                      isSelected ? "border-primary bg-primary/5" : "border-border bg-card",
                      selectable ? "hover:border-primary/40" : "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-1">
                      <RoleBadge role={r} withIcon={false} />
                      <span className={cn("font-mono text-3xs font-bold", isLow ? "text-severity-critical" : "text-success")}>
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

          {/* Site Access — moved ABOVE the email field, rendered as a dropdown */}
          <div data-slot="invite-users-modal-sites">
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Site Access
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <ItemButton variant="plain"
                  type="button"
                  className={cn("text-center", 
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
                </ItemButton>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-1.5">
                <ItemButton variant="plain"
                  onClick={() => setSites(sites.length === USER_SITES.length ? [] : USER_SITES.map((s) => s.value))}
                  className="gap-0 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-semibold text-primary-ink hover:bg-primary/10"
                >
                  <span>{sites.length === USER_SITES.length ? "Clear all" : "Select all"}</span>
                  <span className="font-mono text-muted-foreground">{sites.length}/{USER_SITES.length}</span>
                </ItemButton>
                <div className="mt-1 max-h-48 overflow-y-auto border-t border-border pt-1">
                  {USER_SITES.map((s) => {
                    const checked = sites.includes(s.value);
                    return (
                      <ItemButton variant="plain"
                        key={s.value}
                        onClick={() =>
                          setSites((curr) => (curr.includes(s.value) ? curr.filter((v) => v !== s.value) : [...curr, s.value]))
                        }
                        className="text-inherit flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
                      >
                        <span className={cn(
                          "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border",
                          checked ? "border-primary bg-primary-fill text-primary-foreground" : "border-input"
                        )}>
                          {checked && <Check className="size-2.5" strokeWidth={3} />}
                        </span>
                        <TruncatedText text={s.label} className="text-foreground" />
                      </ItemButton>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Department */}
          <div data-slot="invite-users-modal-department">
            <label className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </label>
            <Input
              value={departments.join(", ")}
              onChange={(e) => setDepartments(e.target.value.split(",").map((department) => department.trim()).filter(Boolean))}
              placeholder="e.g. Security Operations"
              className={errors.departments ? "border-severity-critical/60" : undefined}
            />
            {errors.departments && <p className="mt-1 text-xs text-severity-critical">{errors.departments}</p>}
          </div>

          {/* Emails */}
          <div data-slot="invite-users-modal-emails">
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Addresses
              </label>
              {parsed.valid.length > 0 && (
                <span className="text-2xs text-muted-foreground">
                  <strong className={cn(overSeat ? "text-severity-critical" : "text-success")}>{parsed.valid.length}</strong> valid
                  {parsed.invalid.length > 0 && <> · <strong className="text-severity-critical">{parsed.invalid.length}</strong> invalid</>}
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
                parsed.invalid.length > 0 && "border-severity-critical/40 focus:border-severity-critical"
              )}
            />
            <p className="mt-0.5 text-2xs text-muted-foreground">
              Separate multiple emails with commas, spaces, or new lines.
            </p>
            {errors.emails && <p className="mt-1 text-xs text-severity-critical">{errors.emails}</p>}
            {parsed.invalid.length > 0 && (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-severity-critical/30 bg-severity-critical/[0.05] px-2.5 py-1.5 text-xs text-severity-critical">
                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">{parsed.invalid.length} invalid email{parsed.invalid.length === 1 ? "" : "s"}:</p>
                  <p className="font-mono text-2xs opacity-80">{parsed.invalid.slice(0, 5).join(", ")}{parsed.invalid.length > 5 ? ` +${parsed.invalid.length - 5} more` : ""}</p>
                </div>
              </div>
            )}
          </div>

          {errors.sites && <p className="text-xs text-severity-critical">{errors.sites}</p>}

          {(noSeats || overSeat) && (
            <div className="flex items-start gap-2 rounded-md border border-severity-critical/30 bg-severity-critical/[0.06] px-2.5 py-1.5 text-xs text-severity-critical">
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

function computeSeatUsage(users: UserData[], totals: Record<UserRole, number>): Record<UserRole, SeatUsage> {
  return (["owner", "admin", "user"] as UserRole[]).reduce((acc, role) => {
    const tier = MOCK_SEATS[role];
    const assigned = users.filter((u) => u.role === role).length;
    acc[role] = {
      role,
      total: totals[role],
      assigned,
      available: Math.max(0, totals[role] - assigned),
      // An invited user holds their seat from the moment the invite goes out —
      // it is assigned AND pending until they finish setup.
      pending: users.filter((u) => u.role === role && u.status === "pending").length,
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
  label, total, assigned, available, kind, breakdown,
}: {
  label: string; total: number; assigned: number; available: number;
  kind: "all" | UserRole; billingCycle?: string;
  breakdown?: { label: string; value: number; icon?: React.ComponentType<{ className?: string }>; iconClass?: string }[];
}) {
  const cfg = SEAT_ROLE_STYLES[kind];
  const Icon = cfg.icon;
  const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <ItemButton variant="plain" className={cn("items-stretch text-[length:inherit] text-inherit", "group flex w-full flex-col gap-1 rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40")}>
          <div className="flex items-center gap-1.5">
            <Icon className={cn("size-3", cfg.text)} />
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            <span className="ml-auto text-2xs text-muted-foreground">{pct}%</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-lg font-bold leading-none", cfg.text)}>{assigned}</span>
            <span className="text-xs text-muted-foreground">/ {total} seats</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", cfg.barClass)} style={{ width: `${pct}%` }} />
          </div>
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className={cn("flex size-7 items-center justify-center rounded-md border", cfg.bg)}>
            <Icon className={cn("size-3.5", cfg.text)} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-foreground">{label}</p>
          </div>
        </div>
        <div data-slot="seat-pill-details" className="space-y-1.5 rounded-md border border-border bg-background p-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-mono font-semibold text-foreground">{total}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assigned</span>
            <span className={cn("font-mono font-semibold", cfg.text)}>{assigned}</span>
          </div>
          {breakdown && breakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {b.icon && <b.icon className={cn("size-3", b.iconClass)} />}
                {b.label}
              </span>
              <span className="font-mono font-medium text-muted-foreground">{b.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className={cn("font-mono font-semibold", available === 0 ? "text-severity-critical" : "text-success")}>{available}</span>
          </div>
        </div>
        {kind !== "all" && kind !== "owner" && available === 0 && (
          <p className="mt-2 flex items-start gap-1 text-xs text-warning">
            <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
            No available seats — purchasing required to add a user.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function SeatStrip({ usage, billingCycle }: { usage: Record<UserRole, SeatUsage>; billingCycle: string }) {
  const totalAll     = (["owner", "admin", "user"] as UserRole[]).reduce((s, r) => s + usage[r].total, 0);
  const assignedAll  = (["owner", "admin", "user"] as UserRole[]).reduce((s, r) => s + usage[r].assigned, 0);
  const availableAll = Math.max(0, totalAll - assignedAll);

  const userTotal     = usage.admin.total + usage.user.total;
  const userAssigned  = usage.admin.assigned + usage.user.assigned;
  const userAvailable = Math.max(0, userTotal - userAssigned);

  /* Seats held by invites that haven't been accepted yet. They are already
     paid for and unavailable, so they count against capacity — the Total Seats
     breakdown just says how many of the assigned seats nobody is using yet. */
  const pendingAll   = (["owner", "admin", "user"] as UserRole[]).reduce((s, r) => s + usage[r].pending, 0);
  const activatedAll = Math.max(0, assignedAll - pendingAll);

  return (
    <div data-slot="seat-strip" className="rounded-xl border border-border bg-card p-3">
      <div data-slot="seat-strip-header" className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Seat Usage
        </div>
        <span className="text-2xs text-muted-foreground">Hover or click each tier to see breakdown</span>
      </div>
      <div data-slot="seat-strip-grid" className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        <SeatPill
          kind="all"
          label="Total Seats"
          total={totalAll}
          assigned={assignedAll}
          available={availableAll}
          billingCycle={billingCycle}
          breakdown={[
            { label: "Activated", value: activatedAll, icon: CheckCircle2, iconClass: "text-success" },
            { label: "Pending invites", value: pendingAll, icon: Clock, iconClass: "text-info" },
          ]}
        />
        <SeatPill kind="owner" label="Owner Seats" total={usage.owner.total} assigned={usage.owner.assigned} available={usage.owner.available} billingCycle={billingCycle} />
        <SeatPill
          kind="user"
          label="User Seats"
          total={userTotal}
          assigned={userAssigned}
          available={userAvailable}
          billingCycle={billingCycle}
          breakdown={[
            { label: "Admins", value: usage.admin.assigned, icon: ShieldCheck, iconClass: "text-info" },
            { label: "Members", value: usage.user.assigned, icon: CircleUser, iconClass: "text-warning" },
          ]}
        />
      </div>
    </div>
  );
}

/* ── Change Role modal ───────────────────────────────────────────────────── */

/** One-time code emailed to the Owner to confirm an ownership transfer. */
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export function ChangeRoleModal({
  open,
  users,
  allUsers,
  seatUsage,
  onClose,
  onConfirm,
  onTransferOwnership,
  onPurchaseSeat,
}: {
  open: boolean;
  users: UserData[];
  allUsers: UserData[];
  seatUsage: Record<UserRole, SeatUsage>;
  onClose: () => void;
  onConfirm: (role: UserRole) => void;
  onTransferOwnership: (newOwnerId: string, previousOwnerRole: UserRole) => void;
  onPurchaseSeat: (role: UserRole, quantity: number) => void;
}) {
  const initial = users.length === 1 ? users[0].role : "user";
  const [role, setRole] = React.useState<UserRole>(initial);
  const [showPurchase, setShowPurchase] = React.useState(false);
  const [showSuccessorPicker, setShowSuccessorPicker] = React.useState(false);
  const [showTransfer, setShowTransfer] = React.useState(false);
  const [successorSearch, setSuccessorSearch] = React.useState("");
  const [selectedSuccessorId, setSelectedSuccessorId] = React.useState<string | null>(null);
  const [otp, setOtp] = React.useState("");
  const [password, setPassword] = React.useState("");
  /* Transfer verification runs in two steps: password, then an emailed code. */
  const [verifyStep, setVerifyStep] = React.useState<"password" | "checking" | "code">("password");
  const isBulk = users.length > 1;

  // Reset when the modal opens (or the target role changes while open).
  const [prevReset, setPrevReset] = React.useState({ open, initial });
  if (prevReset.open !== open || prevReset.initial !== initial) {
    setPrevReset({ open, initial });
    if (open) {
      setRole(initial);
      setShowPurchase(false);
      setShowSuccessorPicker(false);
      setShowTransfer(false);
      setSuccessorSearch("");
      setSelectedSuccessorId(null);
      setOtp("");
      setPassword("");
      setVerifyStep("password");
    }
  }

  // Simulated password check — about a second, then the code is sent.
  const ownerEmail = allUsers.find((user) => user.role === "owner")?.email ?? users[0]?.email;
  React.useEffect(() => {
    if (verifyStep !== "checking") return;
    const timer = window.setTimeout(() => {
      setVerifyStep("code");
      toast.message("Verification code sent", {
        description: `We emailed a ${OTP_LENGTH}-digit code to ${ownerEmail}.`,
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [verifyStep, ownerEmail]);

  if (users.length === 0) return null;

  const sameRole = !isBulk && role === users[0].role;
  const isOwnerTransfer = role === "owner";
  const isOwnerDemotion = !isBulk && users[0].role === "owner" && role !== "owner";
  const currentOwner = allUsers.find((user) => user.role === "owner") ?? users[0];
  const selectedSuccessor = selectedSuccessorId
    ? allUsers.find((user) => user.id === selectedSuccessorId) ?? null
    : null;
  const transferRecipient = isOwnerDemotion ? selectedSuccessor : users[0];
  const previousOwnerRoleWithArticle = role === "admin" ? "an Admin" : "a Member";
  // When the successor already occupies the Owner's destination tier, the
  // ownership swap frees that seat before the former Owner takes it.
  const additions = users.filter((user) => user.role !== role).length;
  const seatsFreedByTransfer = isOwnerDemotion && selectedSuccessor?.role === role ? 1 : 0;
  const seatsNeededAfter = seatUsage[role].assigned + additions - seatsFreedByTransfer;
  const seatShortfall = Math.max(0, seatsNeededAfter - seatUsage[role].total);
  const currentTier = MOCK_SEATS[role];
  const purchaseTotal = seatShortfall * currentTier.pricePerMonth;
  const normalizedSuccessorSearch = successorSearch.trim().toLowerCase();
  const successorCandidates = allUsers.filter((user) => {
    if (user.id === currentOwner.id) return false;
    if (!normalizedSuccessorSearch) return true;
    return [user.id, user.fullName, user.email]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSuccessorSearch);
  });

  function handleApply() {
    // An Owner cannot leave the role until another active user is selected to
    // receive ownership. The handoff is confirmed in the existing re-auth step.
    if (isOwnerDemotion) {
      setShowSuccessorPicker(true);
      return;
    }
    // Promoting to Owner is an ownership transfer — confirm + re-auth first.
    if (isOwnerTransfer) {
      openTransfer();
      return;
    }
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

  /* The transfer step asks for the Owner's password, then emails them a
     one-time code (the "Ownership Transfer Verification Code" template), so
     neither a known password nor a hijacked session alone can hand the
     workspace away. */
  function openTransfer() {
    setOtp("");
    setPassword("");
    setVerifyStep("password");
    setShowTransfer(true);
  }

  function verifyPassword() {
    if (!password.trim() || verifyStep !== "password") return;
    setVerifyStep("checking");
  }

  function resendCode() {
    setOtp("");
    toast.message("Code re-sent", { description: `A new code was sent to ${currentOwner.email}.` });
  }

  function confirmTransfer() {
    if (verifyStep !== "code" || otp.length < OTP_LENGTH) return;
    if (isOwnerDemotion) {
      if (!selectedSuccessorId) return;
      if (seatShortfall > 0) onPurchaseSeat(role, seatShortfall);
      onTransferOwnership(selectedSuccessorId, role);
      return;
    }
    onConfirm("owner");
  }

  // The modal swaps between several states, so title/description resolve together
  // to keep the header contract (always a title *and* a description) intact.
  const headerTitle = showTransfer
    ? "Transfer Ownership"
    : showSuccessorPicker
    ? "Choose the Next Owner"
    : showPurchase
    ? `Purchase ${currentTier.label} Seat${seatShortfall === 1 ? "" : "s"}`
    : isBulk ? `Change Role (${users.length})` : "Change Role";
  const headerDescription = showTransfer
    ? verifyStep === "code"
      ? "Enter the code we emailed to finish the transfer."
      : "Confirm your identity to transfer the Owner role."
    : showSuccessorPicker
    ? "Select an active workspace member to receive ownership."
    : showPurchase
    ? `No available ${currentTier.label.toLowerCase()} seats — purchase to continue.`
    : isBulk
    ? `Set the workspace role for the ${users.length} selected members.`
    : "Role changes apply immediately on the member's next request.";

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title={headerTitle} description={headerDescription} />

        {showTransfer ? (
          <ModalBody className="space-y-4">
            {currentOwner && transferRecipient && (
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar user={currentOwner} size={32} />
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Current Owner</p>
                    <TruncatedText text={currentOwner.fullName} className="text-sm font-semibold text-foreground" />
                  </div>
                </div>
                <div className="flex size-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary-ink">
                  <ArrowRight className="size-3.5" />
                </div>
                <div className="flex min-w-0 items-center justify-end gap-2.5 text-right">
                  <div className="min-w-0">
                    <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">New Owner</p>
                    <TruncatedText text={transferRecipient.fullName} className="text-sm font-semibold text-foreground" />
                  </div>
                  <Avatar user={transferRecipient} size={32} />
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/[0.06] px-3 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-severity-critical" />
              <div>
                <p className="text-sm font-semibold text-foreground">You are transferring ownership</p>
                <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                  <strong className="text-foreground">{currentOwner.fullName}</strong> becomes {isOwnerDemotion ? previousOwnerRoleWithArticle : "an Admin"}.
                  Only another transfer can undo this.
                </p>
              </div>
            </div>
            {isOwnerDemotion && seatShortfall > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
                <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
                <p className="text-sm leading-snug text-muted-foreground">
                  Transferring ownership will also add <strong className="text-foreground">{seatShortfall}</strong>{" "}
                  {currentTier.label.toLowerCase()} seat{seatShortfall === 1 ? "" : "s"} at{" "}
                  <strong className="text-foreground">${purchaseTotal}/mo</strong>.
                </p>
              </div>
            )}
            {verifyStep === "code" ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 flex-shrink-0 text-success" />
                  Password confirmed
                </div>
                <div>
                  <label htmlFor="ownership-transfer-code" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Enter verification code
                  </label>
                  <OtpField id="ownership-transfer-code" value={otp} onChange={setOtp} length={OTP_LENGTH} autoFocus />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Sent to <strong className="text-foreground">{currentOwner.email}</strong> · expires in {OTP_EXPIRY_MINUTES} minutes.{" "}
                    <Button variant="link" type="button" onClick={resendCode} className="h-auto px-0 border-0 rounded-none gap-0 text-[length:inherit] whitespace-normal font-semibold text-foreground underline underline-offset-2 hover:text-primary-ink">
                      Resend code
                    </Button>
                  </p>
                </div>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyPassword();
                }}
              >
                <label htmlFor="ownership-transfer-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Re-enter your password
                </label>
                <Input
                  id="ownership-transfer-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your account password"
                  className="text-base"
                  disabled={verifyStep === "checking"}
                  autoFocus
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  We'll then email a verification code to <strong className="text-foreground">{currentOwner.email}</strong>.
                </p>
              </form>
            )}
          </ModalBody>
        ) : showSuccessorPicker ? (
          <ModalBody className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
              <Crown className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <p className="text-sm leading-snug text-muted-foreground">
                Before <strong className="text-foreground">{users[0].fullName}</strong> becomes a {USER_ROLE_LABELS[role]}, choose who will take over billing, workspace settings, and irreversible actions.
              </p>
            </div>
            <div>
              <label htmlFor="ownership-successor-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Search workspace users
              </label>
              <ToolbarSearch value={successorSearch} onChange={setSuccessorSearch} id="ownership-successor-search" placeholder="Search by name, email, or user ID" autoFocus className="sm:w-full" />
            </div>
            <div className="space-y-2">
              {successorCandidates.length > 0 ? (
                successorCandidates.map((candidate) => {
                  const isEligible = candidate.status === "active";
                  const isSelected = candidate.id === selectedSuccessorId;
                  return (
                    <ItemButton variant="plain" selected={isSelected}
                      key={candidate.id}
                      type="button"
                      disabled={!isEligible}
                      onClick={() => setSelectedSuccessorId(candidate.id)}
                      className={cn("text-[length:inherit] text-inherit", 
                        "flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                        !isEligible && "cursor-not-allowed opacity-50 hover:border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                          isSelected ? "border-primary" : "border-muted-foreground/40"
                        )}
                      >
                        {isSelected && <span className="size-2 rounded-full bg-primary" />}
                      </div>
                      <Avatar user={candidate} size={34} />
                      <div className="min-w-0 flex-1">
                        <TruncatedText text={candidate.fullName} className="text-base font-semibold text-foreground" />
                        <TruncatedText text={`${candidate.email} · ${candidate.id}`} className="text-xs text-muted-foreground" />
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <RoleBadge role={candidate.role} />
                        {!isEligible && <StatusPill status={candidate.status} />}
                      </div>
                    </ItemButton>
                  );
                })
              ) : (
                <div className="rounded-lg border border-dashed border-border py-8 text-center">
                  <UsersIcon className="mx-auto size-5 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No users match “{successorSearch}”.</p>
                </div>
              )}
            </div>
          </ModalBody>
        ) : !showPurchase ? (
          <ModalBody className="space-y-3">
            {isBulk ? (
              <p className="text-sm text-muted-foreground">
                Applying to <strong className="text-foreground">{users.length}</strong> selected users.
              </p>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
                <Avatar user={users[0]} size={32} />
                <div className="min-w-0">
                  <TruncatedText text={users[0].fullName} className="text-base font-semibold text-foreground" />
                  <TruncatedText text={users[0].email} className="text-xs text-muted-foreground" />
                </div>
                <RoleBadge role={users[0].role} />
              </div>
            )}
            <p className="text-sm text-muted-foreground">Choose a role</p>
            {USER_ROLE_OPTIONS.map((opt) => {
              const u = seatUsage[opt.value];
              // Owner is an ownership transfer, not a seat purchase — never a "shortfall".
              const willHaveShortfall = !isBulk
                ? (opt.value !== "owner" && opt.value !== users[0].role && u.available === 0)
                : false;
              return (
                <ItemButton variant="plain" selected={role === opt.value}
                  key={opt.value}
                  onClick={() => setRole(opt.value)}
                  className={cn("text-[length:inherit] text-inherit", 
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
                    </div>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">
                      {USER_ROLE_DESCRIPTIONS[opt.value]}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-2xs">
                      <span className="text-muted-foreground">
                        <strong className={cn(u.available === 0 ? "text-severity-critical" : "text-success")}>
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
                </ItemButton>
              );
            })}

            {seatShortfall > 0 && !isOwnerTransfer && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
                <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
                <p className="text-sm leading-snug text-muted-foreground">
                  No {currentTier.label.toLowerCase()} seats left — applying this change adds{" "}
                  <strong className="text-foreground">{seatShortfall}</strong> seat{seatShortfall === 1 ? "" : "s"}.
                  You'll be asked to confirm the charge on Apply.
                </p>
              </div>
            )}
          </ModalBody>
        ) : (
          <ModalBody className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/[0.06] px-3.5 py-3">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <div>
                <p className="text-base font-semibold text-foreground">No {currentTier.label.toLowerCase()} seats available</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  You currently have <strong className="text-foreground">{seatUsage[role].assigned} of {seatUsage[role].total}</strong> {currentTier.label.toLowerCase()} seats assigned.
                  Purchase <strong className="text-foreground">{seatShortfall}</strong> additional seat{seatShortfall === 1 ? "" : "s"} to apply this change.
                </p>
              </div>
            </div>
            <div className="space-y-1.5 rounded-lg border border-border bg-background px-3.5 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{seatShortfall} × {currentTier.label} seat</span>
                <span className="font-mono text-foreground">${currentTier.pricePerMonth} × {seatShortfall}</span>
              </div>
              <div className="border-t border-border/60" />
              <div className="flex items-center justify-between text-base font-bold text-foreground">
                <span>Charged on next invoice</span>
                <span className="font-mono">+ ${purchaseTotal}/mo</span>
              </div>
              <div className="mt-1.5 flex items-start gap-1.5 rounded-md border border-info/30 bg-info/5 px-2 py-1.5 text-xs text-muted-foreground">
                <Calendar className="mt-0.5 size-3 flex-shrink-0 text-info" />
                Next invoice <strong className="text-foreground">{ORG_LICENSE_INFO.nextInvoiceDate}</strong> ({ORG_LICENSE_INFO.paymentMethod})
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Manage all seats in <strong className="text-foreground">Billing & License</strong>.
            </p>
          </ModalBody>
        )}

        <ModalFooter>
          {showTransfer ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={verifyStep === "checking"}
                onClick={() => {
                  // From the code step, Back returns to the password; from there, out of the transfer.
                  if (verifyStep === "code") {
                    setVerifyStep("password");
                    setPassword("");
                    setOtp("");
                    return;
                  }
                  setShowTransfer(false);
                  if (isOwnerDemotion) setShowSuccessorPicker(true);
                }}
              >
                Back
              </Button>
              {verifyStep === "code" ? (
                <Button size="sm" variant="destructive" disabled={otp.length < OTP_LENGTH} onClick={confirmTransfer} className="gap-1.5">
                  <Crown className="size-3.5" />
                  Transfer Ownership
                </Button>
              ) : (
                <Button size="sm" disabled={!password.trim() || verifyStep === "checking"} onClick={verifyPassword} className="gap-1.5">
                  {verifyStep === "checking" ? (
                    <>
                      <LoaderCircle className="size-3.5 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              )}
            </>
          ) : showSuccessorPicker ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowSuccessorPicker(false)}>Back</Button>
              <Button
                size="sm"
                disabled={!selectedSuccessor}
                onClick={() => {
                  setShowSuccessorPicker(false);
                  openTransfer();
                }}
                className="gap-1.5"
              >
                Continue
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          ) : showPurchase ? (
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
              <Button size="sm" disabled={sameRole} onClick={handleApply}>
                Apply
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

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

  // Reset when the modal opens (or the selected users' sites change while open).
  const [prevReset, setPrevReset] = React.useState({ open, initialSitesKey });
  if (prevReset.open !== open || prevReset.initialSitesKey !== initialSitesKey) {
    setPrevReset({ open, initialSitesKey });
    if (open) { setSites(initialSites); setSiteSearch(""); }
  }

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
              <Button variant="link" onClick={() => setSites(USER_SITES.map((s) => s.value))}
                className="h-auto px-0 border-0 rounded-none font-normal gap-0 whitespace-normal text-xs text-muted-foreground underline hover:text-primary-ink">
                Select all
              </Button>
              <span className="text-muted-foreground">·</span>
              <Button variant="link" onClick={() => setSites([])}
                className="h-auto px-0 border-0 rounded-none font-normal gap-0 whitespace-normal text-xs text-muted-foreground underline hover:text-primary-ink">
                Clear
              </Button>
            </div>
          </div>
          <ToolbarSearch value={siteSearch} onChange={setSiteSearch} placeholder="Search sites…" className="sm:w-full" />
        </ModalBody>
        <ModalBody className="space-y-1.5">
          {visibleSites.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">No sites match "{siteSearch}".</p>
          ) : (
            visibleSites.map((s) => {
              const checked = sites.includes(s.value);
              return (
                <ItemButton variant="plain"
                  key={s.value}
                  onClick={() => toggle(s.value)}
                  className="text-[length:inherit] text-inherit flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40"
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
                </ItemButton>
              );
            })
          )}
        </ModalBody>
        <ModalFooter>
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

  // Load the user's details when the modal opens (or the user changes while open).
  const [prevLoad, setPrevLoad] = React.useState<{ open: boolean; user: UserData | null }>({ open: false, user: null });
  if (prevLoad.open !== open || prevLoad.user !== user) {
    setPrevLoad({ open, user });
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
  }

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
          <div data-slot="edit-user-modal-user" className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
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
                  <Input
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className={cn("py-0 shadow-none md:text-base dark:bg-background focus-visible:ring-0 focus-visible:border-primary", 
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

  // Reset the form each time the modal opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      const now = new Date();
      setPreset("7d");
      setStartDate(fmtInput(now));
      setEndDate(fmtInput(addDays(now, 7)));
      setNote("");
    }
  }

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
                <ItemButton variant="plain" selected={preset === p}
                  key={p}
                  onClick={() => setPreset(p)}
                  className={cn("w-auto text-center", 
                    "flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors",
                    preset === p
                      ? "border-primary bg-primary/5 text-primary-ink"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {p === "custom" ? <Calendar className="size-3.5" /> : p === "permanent" ? <ShieldOff className="size-3.5" /> : <Clock className="size-3.5" />}
                  {SUSPEND_DURATION_LABEL[p]}
                </ItemButton>
              ))}
            </div>
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="py-0 shadow-none md:text-base dark:bg-background focus-visible:ring-0 focus-visible:border-primary h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="py-0 shadow-none md:text-base dark:bg-background focus-visible:ring-0 focus-visible:border-primary h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
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

          <div data-slot="suspend-user-modal-warning" className="rounded-lg border border-severity-critical/25 bg-severity-critical/[0.05] px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              <Ban className="mr-1 inline-block size-3 text-severity-critical align-text-bottom" />
              Suspending blocks sign-in immediately. Active sessions revoke on next refresh.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
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
      <ModalContent size="sm">
        <ModalHeader title={isBulk ? `Reinstate Users (${users.length})` : "Reinstate User"} />
        <ModalBody>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to reinstate{" "}
            <strong className="text-foreground">{isBulk ? `${users.length} users` : users[0].fullName}</strong>? They regain access on next
            sign-in with their existing role{isBulk ? "s" : ""}.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onConfirm}>Reinstate</Button>
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

  // Reset the note each time the modal opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setNote("");
  }

  if (users.length === 0) return null;
  const isBulk = users.length > 1;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title={isBulk ? `Delete Users (${users.length})` : "Delete User"} />
        <ModalBody className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{isBulk ? `${users.length} users` : users[0].fullName}</strong>? Audit history is kept;
            re-invite {isBulk ? "them" : "them"} to restore access.
          </p>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note (Optional)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for permanent deletion — preserved in the audit log."
              rows={3}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="destructive" onClick={() => onConfirm(note)}>
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
      <ModalContent size="sm">
        <ModalHeader title={title} description={description} />
        <ModalBody>
          <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
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

type DeletedUserData = UserData & {
  deletedAtDisplay: string;
  deletedAtMs: number;
  deletedBy: string;
  deleteReason?: string;
};

function DeletedUsersPage({
  users,
  onBack,
  onRestore,
}: {
  users: DeletedUserData[];
  onBack: () => void;
  onRestore: (user: DeletedUserData) => void;
}) {
  const PAGE_STEP = 20;
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<UserFilters>(EMPTY_FILTERS);
  // Deep link from the ⌘K palette — /users?user=<id> opens that user's drawer.
  const [searchParams] = useSearchParams();
  const [drawerId, setDrawerId] = React.useState<string | null>(() => searchParams.get("user"));
  const [visibleCount, setVisibleCount] = React.useState(PAGE_STEP);
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    let list = users.filter((u) => {
      if (filters.role.length > 0 && !filters.role.includes(u.role)) return false;
      if (filters.site.length > 0 && !filters.site.some((s) => u.sitePermissions.find((p) => p.siteId === s))) return false;
      if (filters.department.length > 0 && !filters.department.some((d) => u.departments.includes(d))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [u.id, u.fullName, u.firstName, u.lastName, u.email].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name-asc") return a.fullName.localeCompare(b.fullName);
      if (sort === "last-active") return (b.lastActiveAt || "").localeCompare(a.lastActiveAt || "");
      if (sort === "oldest") return a.deletedAtMs - b.deletedAtMs;
      return b.deletedAtMs - a.deletedAtMs;
    });
    return list;
  }, [users, filters, search, sort]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0));
  const drawerUser = drawerId ? users.find((u) => u.id === drawerId) ?? null : null;
  const deletedColumns: DataTableColumn<DeletedUserData>[] = [
    {
      key: "id",
      header: "USER ID",
      cell: (u) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">{u.id}</span>
      ),
    },
    {
      key: "user",
      header: "USER",
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar user={u} size={32} />
          <div className="min-w-0">
            <TruncatedText text={u.fullName} className="font-semibold text-foreground transition-colors group-hover:text-primary-ink" />
            <TruncatedText text={u.email} className="text-xs text-muted-foreground" />
          </div>
        </div>
      ),
    },
    { key: "role", header: "ROLE", cell: (u) => <RoleBadge role={u.role} /> },
    { key: "sites", header: "SITES", cell: (u) => <SitesCell user={u} /> },
    {
      key: "deletedOn",
      header: "DELETED ON",
      className: "text-sm text-muted-foreground",
      headClassName: "",
      cell: (u) => u.deletedAtDisplay,
    },
    {
      key: "action",
      header: "ACTION",
      stopRowClick: true,
      cell: (u) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm"
              className="px-0 font-normal gap-0 text-[length:inherit] whitespace-normal dark:hover:bg-muted aria-expanded:bg-transparent flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground aria-expanded:text-muted-foreground/50"
              aria-label={`Actions for ${u.fullName}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ItemButton variant="plain"
              onClick={() => setDrawerId(u.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <CircleUser className="size-3.5 text-muted-foreground" />
              View details
            </ItemButton>
            <ItemButton variant="plain"
              onClick={() => onRestore(u)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-success hover:bg-success/10"
            >
              <RotateCcw className="size-3.5" />
              Restore User
            </ItemButton>
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  return (
    <div data-slot="deleted-users-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Deleted Users List</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onBack}>
            <ChevronLeft className="size-4" />
            Back to Users
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setVisibleCount(PAGE_STEP); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setVisibleCount(PAGE_STEP); }}
        hideStatus
      />

      <div data-slot="deleted-users-page-toolbar" className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "deleted user" : "deleted users"} match current filters
          {hasFilters && (
            <Button variant="link"
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
              className="h-auto px-0 border-0 rounded-none font-normal gap-0 text-[length:inherit] whitespace-normal ml-2 text-muted-foreground underline hover:text-primary-ink"
            >
              Clear all
            </Button>
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
              <ItemButton variant="plain"
                key={o.key}
                onClick={() => { setSort(o.key); setSortOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                  sort === o.key ? "text-primary-ink" : "text-foreground"
                )}
              >
                {o.label}
                {sort === o.key && <Check className="size-3.5" />}
              </ItemButton>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {filtered.length === 0 ? (
        <div data-slot="deleted-users-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Trash2 className="size-10 opacity-20" />
          <p className="text-sm">{users.length === 0 ? "No deleted users yet." : "No deleted users match the current filters."}</p>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div data-slot="deleted-users-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={deletedColumns}
            data={visibleItems}
            getRowId={(u) => u.id}
            onRowClick={(u) => setDrawerId(u.id)}
            getRowClassName={() => "transition-colors"}
          />
          <div data-slot="deleted-users-page-footer" className="flex flex-col items-center gap-2 border-t border-border px-4 py-3">
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + PAGE_STEP)}
                className="gap-1.5"
              >
                <ChevronDown className="size-3.5" />
                Load Older Entries
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0 ? "0 of 0" : `Showing ${visibleItems.length} of ${filtered.length}`}
            </p>
          </div>
        </div>
      )}
      <UserDrawer
        user={drawerUser}
        open={drawerId !== null}
        mode="deleted"
        deletedMeta={drawerUser ? { deletedAtDisplay: drawerUser.deletedAtDisplay, deletedBy: drawerUser.deletedBy, deleteReason: drawerUser.deleteReason } : undefined}
        onClose={() => setDrawerId(null)}
        onEdit={() => undefined}
        onChangeRole={() => undefined}
        onManageSite={() => undefined}
        onSuspend={() => undefined}
        onReinstate={() => undefined}
        onDelete={() => undefined}
        onRestore={() => {
          if (!drawerUser) return;
          onRestore(drawerUser);
          setDrawerId(null);
        }}
        onResetPassword={() => undefined}
        onReset2FA={() => undefined}
      />
    </div>
  );
}

export default function UserManagementPage({
  forcedState = "normal",
}: {
  forcedState?: "normal" | "empty";
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isDeletedUsersPage = location.pathname.endsWith("/deleted");
  const isEmptyState = forcedState === "empty";
  const [users, setUsers] = React.useState<UserData[]>(isEmptyState ? [] : MOCK_USERS);
  const [deletedUsers, setDeletedUsers] = React.useState<DeletedUserData[]>([]);
  const [seatTotals, setSeatTotals] = React.useState<Record<UserRole, number>>(
    isEmptyState
      ? { owner: 0, admin: 0, user: 0 }
      : {
          owner: 1, // exactly one Owner per workspace — always 1/1 (100%)
          admin: MOCK_SEATS.admin.total,
          user: MOCK_SEATS.user.total,
        }
  );
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<UserFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [drawerId, setDrawerId] = React.useState<string | null>(null);


  const PAGE_STEP = 20;
  const [visibleCount, setVisibleCount] = React.useState(PAGE_STEP);
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  // ⌘K quick action "Invite User" arrives as router state.
  const [dialog, setDialog] = React.useState<DialogState>(() =>
    (location.state as { openInvite?: boolean } | null)?.openInvite
      ? { kind: "invite", userIds: [] }
      : { kind: null, userIds: [] }
  );

  // Adapter so existing setToast(...) call sites route through sonner without a rewrite.
  const setToast = React.useCallback((next: { kind: "success" | "error"; message: string } | null) => {
    if (!next) return;
    if (next.kind === "success") toast.success(next.message);
    else                         toast.error(next.message);
  }, []);
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
      if (filters.department.length > 0 && !filters.department.some((d) => u.departments.includes(d))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [u.id, u.fullName, u.firstName, u.lastName, u.email].join(" ").toLowerCase();
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

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const drawerUser = drawerId ? users.find((u) => u.id === drawerId) ?? null : null;
  const dialogUsers = dialog.userIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is UserData => !!u);
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setVisibleCount(PAGE_STEP);
  }

  function openDialog(kind: Exclude<DialogKind, null | "invite">, ids: string[]) {
    setDialog({ kind, userIds: ids });
  }
  function closeDialog() { setDialog({ kind: null, userIds: [] }); }

  function handleChangeRole(role: UserRole) {
    const ids = dialog.userIds;
    setUsers((curr) =>
      curr.map((u) => {
        if (ids.includes(u.id)) return { ...u, role };
        // Ownership transfer — demote the existing Owner so there is only ever one.
        if (role === "owner" && u.role === "owner") return { ...u, role: "admin" as UserRole };
        return u;
      })
    );
    closeDialog();
    setToast({
      kind: "success",
      message:
        role === "owner"
          ? `Ownership transfer email sent to ${users.find((u) => u.id === ids[0])?.fullName ?? "the new Owner"}`
          : ids.length > 1
          ? `${ids.length} users updated to ${USER_ROLE_LABELS[role]}`
          : "Role updated successfully",
    });
  }

  function handleTransferOwnership(newOwnerId: string, previousOwnerRole: UserRole) {
    const previousOwner = users.find((user) => user.role === "owner");
    const newOwner = users.find((user) => user.id === newOwnerId);
    if (!previousOwner || !newOwner || newOwner.status !== "active") {
      setToast({ kind: "error", message: "Choose an active user to receive ownership" });
      return;
    }

    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user.id === previousOwner.id) return { ...user, role: previousOwnerRole };
        if (user.id === newOwnerId) return { ...user, role: "owner" as UserRole };
        return user;
      })
    );
    closeDialog();
    setToast({
      kind: "success",
      message: `Ownership transfer email sent to ${newOwner.fullName}`,
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

  function handleDelete(note: string) {
    const ids = dialog.userIds;
    const targets = users.filter((u) => ids.includes(u.id));
    const target = targets[0];
    const deletedAt = new Date();
    const deletedAtDate = deletedAt.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    const deletedAtTime = deletedAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const deletedAtDisplay = `${deletedAtDate} · ${deletedAtTime}`;
    setDeletedUsers((curr) => [
      ...targets.map((u) => ({ ...u, deletedAtDisplay, deletedAtMs: deletedAt.getTime(), deletedBy: "Delbin Arkar", deleteReason: note.trim() || undefined })),
      ...curr,
    ]);
    setUsers((curr) => curr.filter((u) => !ids.includes(u.id)));
    closeDialog();
    setDrawerId(null);
    setToast({
      kind: "success",
      message:
        ids.length > 1
          ? `${ids.length} users moved to Deleted Users List.`
          : `${target?.fullName ?? "User"} moved to Deleted Users List.`,
    });
  }

  function handleRestoreDeletedUser(user: DeletedUserData) {
    // Strip the deletion metadata to get back a plain UserData.
    const restoredUser: Partial<DeletedUserData> = { ...user };
    delete restoredUser.deletedAtDisplay;
    delete restoredUser.deletedAtMs;
    delete restoredUser.deletedBy;
    delete restoredUser.deleteReason;
    setDeletedUsers((curr) => curr.filter((u) => u.id !== user.id));
    setUsers((curr) => [
      { ...(restoredUser as UserData), status: "active" as UserStatus, suspension: undefined },
      ...curr,
    ]);
    setToast({ kind: "success", message: `${user.fullName} restored to User Management.` });
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

  function handleInvite(emails: string, role: UserRole, sites: string[], departments: string[]) {
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
      firstName: "—",
      lastName: "—",
      displayName: "—",
      email,
      role,
      status: "pending",
      departments,
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

  if (isDeletedUsersPage) {
    return (
      <DeletedUsersPage
        users={deletedUsers}
        onBack={() => navigate("/users")}
        onRestore={handleRestoreDeletedUser}
      />
    );
  }

  const userColumns: DataTableColumn<UserData>[] = [
    {
      key: "id",
      header: "USER ID",
      cell: (u) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
          {u.id}
        </span>
      ),
    },
    {
      key: "user",
      header: "USER",
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar user={u} size={32} />
          <div className="min-w-0">
            <TruncatedText
              title={u.isCurrentUser ? `${u.fullName} (You)` : u.fullName}
              className="font-semibold text-foreground transition-colors group-hover:text-primary-ink"
            >
              {u.fullName}
              {u.isCurrentUser && (
                <span className="ml-1.5 text-xs font-medium text-muted-foreground">(You)</span>
              )}
            </TruncatedText>
            <TruncatedText text={u.email} className="text-xs text-muted-foreground" />
          </div>
        </div>
      ),
    },
    { key: "role", header: "ROLE", cell: (u) => <RoleBadge role={u.role} /> },
    { key: "status", header: "STATUS", cell: (u) => <StatusPill status={u.status} /> },
    { key: "sites", header: "SITES", cell: (u) => <SitesCell user={u} /> },
    {
      key: "lastActive",
      header: "LAST ACTIVE",
      className: "text-sm text-muted-foreground",
      headClassName: "",
      cell: (u) => u.lastActiveDisplay,
    },
    {
      key: "action",
      header: "ACTION",
      stopRowClick: true,
      cell: (u) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="px-0 font-normal gap-0 text-[length:inherit] whitespace-normal dark:hover:bg-muted aria-expanded:bg-transparent flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground aria-expanded:text-muted-foreground/50">
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ItemButton variant="plain"
              onClick={() => setDrawerId(u.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <CircleUser className="size-3.5 text-muted-foreground" />
              View details
            </ItemButton>
            <ItemButton variant="plain"
              onClick={() => openDialog("change-role", [u.id])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <Shield className="size-3.5 text-muted-foreground" />
              Change Role
            </ItemButton>
            <ItemButton variant="plain"
              onClick={() => openDialog("manage-site", [u.id])}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <MapPin className="size-3.5 text-muted-foreground" />
              Manage Site
            </ItemButton>
            <div className="my-1 border-t border-border" />
            {u.status === "suspended" ? (
              <ItemButton variant="plain"
                onClick={() => openDialog("reinstate", [u.id])}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-success hover:bg-success/10"
              >
                <RotateCcw className="size-3.5" />
                Reinstate
              </ItemButton>
            ) : (
              <ItemButton variant="plain"
                onClick={() => openDialog("suspend", [u.id])}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-warning hover:bg-warning/10"
              >
                <ShieldOff className="size-3.5" />
                Suspend User
              </ItemButton>
            )}
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  return (
    <div data-slot="user-management-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>User Management</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setDrawerId(null);
              navigate("/users/deleted");
            }}
          >
            <Trash2 className="size-4" />
            Deleted Users List
            {deletedUsers.length > 0 && (
              <span className="rounded-full bg-primary-fill px-1.5 py-0.5 text-3xs font-bold text-primary-foreground">
                {deletedUsers.length}
              </span>
            )}
          </Button>
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
            tone={cfg.accent}
            active={cfg.key !== "all" && kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </KpiGrid>

      {/* Filter panel */}
      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setVisibleCount(PAGE_STEP); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setVisibleCount(PAGE_STEP); }}
        additionalActiveCount={kpiFilter !== "all" ? 1 : 0}
      />

      {/* Count + sort */}
      <div data-slot="user-management-page-toolbar" className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "user" : "users"} match current filters
          {hasFilters && (
            <Button variant="link"
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
              className="h-auto px-0 border-0 rounded-none font-normal gap-0 text-[length:inherit] whitespace-normal ml-2 text-muted-foreground underline hover:text-primary-ink"
            >
              Clear all
            </Button>
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
              <ItemButton variant="plain"
                key={o.key}
                onClick={() => { setSort(o.key); setSortOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                  sort === o.key ? "text-primary-ink" : "text-foreground"
                )}
              >
                {o.label}
                {sort === o.key && <Check className="size-3.5" />}
              </ItemButton>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div data-slot="user-management-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <UsersIcon className="size-10 opacity-20" />
          {users.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No team members yet</p>
              <p className="text-sm">Invite people to give them access to this workspace.</p>
              <Button size="sm" className="gap-1.5" onClick={() => setDialog({ kind: "invite", userIds: [] })}>
                <UserPlus className="size-4" />
                Invite Users
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">No users match the current filters.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div data-slot="user-management-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={userColumns}
            data={visibleItems}
            getRowId={(u) => u.id}
            onRowClick={(u) => setDrawerId(u.id)}
            getRowClassName={() => "transition-colors"}
          />

          {/* Load more — newest 20 shown first, older entries loaded on demand */}
          <div data-slot="user-management-page-footer" className="flex flex-col items-center gap-2 border-t border-border px-4 py-3">
            {hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((c) => c + PAGE_STEP)}
                className="gap-1.5"
              >
                <ChevronDown className="size-3.5" />
                Load Older Entries
              </Button>
            )}
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `Showing ${visibleItems.length} of ${filtered.length}`}
            </p>
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
        allUsers={users}
        seatUsage={seatUsage}
        onClose={closeDialog}
        onConfirm={handleChangeRole}
        onTransferOwnership={handleTransferOwnership}
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
        description="The current password stops working once the new one is set."
        confirmLabel="Send Reset Email"
        onClose={closeDialog}
        onConfirm={handleResetPassword}
        detail={
          <>
            Are you sure you want to reset the password for <strong className="text-foreground">{dialogUsers[0]?.fullName ?? "this user"}</strong>?
            They&apos;ll get a reset email and must set a new one on next sign-in.
          </>
        }
      />
      <ResetConfirmModal
        open={dialog.kind === "reset-2fa"}
        title="Reset Two-Factor Authentication"
        description="The member re-enrols an authenticator on their next sign-in."
        confirmLabel="Reset 2FA"
        onClose={closeDialog}
        onConfirm={handleReset2FA}
        detail={
          <>
            Are you sure you want to reset 2FA for <strong className="text-foreground">{dialogUsers[0]?.fullName ?? "this user"}</strong>? Their
            authenticator stops now; they re-enrol at next sign-in.
          </>
        }
      />

    </div>
  );
}
