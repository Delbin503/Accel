import * as React from "react";
import { toast } from "sonner";
import {
  Settings,
  Users,
  Clock,
  Brain,
  Bell,
  HardDrive,
  ShieldCheck,
  Webhook,
  Building2,
  Save,
  Check,
  X,
  AlertTriangle,
  TriangleAlert,
  Activity,
  Mail,
  Smartphone,
  MessageSquare,
  KeyRound,
  RefreshCw,
  MapPin,
  Video,
  Database,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/users";

type Section =
  | "general"
  | "user-access"
  | "sla"
  | "detection"
  | "camera-defaults"
  | "nvr-defaults"
  | "notifications"
  | "integrations"
  | "security";

const SECTIONS: { key: Section; label: string; icon: React.ElementType; description: string }[] = [
  { key: "general",          label: "General",          icon: Building2,       description: "Organization, date & time, number formats" },
  { key: "user-access",      label: "User Access",      icon: Users,           description: "Role permissions matrix" },
  { key: "sla",              label: "SLA & Escalation", icon: Clock,           description: "Response targets per severity" },
  { key: "detection",        label: "Detection Engine", icon: Brain,           description: "Confidence thresholds, models" },
  { key: "camera-defaults",  label: "Camera Defaults",  icon: Video,           description: "RTSP, codec, frame rate, recording" },
  { key: "nvr-defaults",     label: "NVR Defaults",     icon: Database,        description: "Channel cleanup, storage warnings" },
  { key: "notifications",    label: "Notifications",    icon: Bell,            description: "Default delivery channels" },
  { key: "integrations",     label: "Integrations",     icon: Webhook,         description: "Webhooks, SSO, third-party" },
  { key: "security",         label: "Security",         icon: ShieldCheck,     description: "Auth policy & audit" },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      )}
    >
      <span className={cn("inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform",
        checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="text-md font-bold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function PrefRow({ icon: Icon, title, description, control }: { icon?: React.ElementType; title: string; description?: string; control: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
      {Icon && <Icon className="mt-0.5 size-4 flex-shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{description}</p>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

/* ── General ─────────────────────────────────────────────────────────── */

/* Country/region timezones paired with their GMT offset for the selector. */
const TIMEZONE_OPTS: { value: string; label: string }[] = [
  { value: "Pacific/Midway",    label: "(GMT-11:00) Midway Island" },
  { value: "America/Anchorage", label: "(GMT-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Los Angeles" },
  { value: "America/Denver",    label: "(GMT-07:00) Denver" },
  { value: "America/Chicago",   label: "(GMT-06:00) Chicago" },
  { value: "America/New_York",  label: "(GMT-05:00) New York" },
  { value: "America/Sao_Paulo", label: "(GMT-03:00) São Paulo" },
  { value: "Europe/London",     label: "(GMT+00:00) London" },
  { value: "Europe/Paris",      label: "(GMT+01:00) Paris" },
  { value: "Europe/Istanbul",   label: "(GMT+03:00) Istanbul" },
  { value: "Asia/Dubai",        label: "(GMT+04:00) Dubai" },
  { value: "Asia/Karachi",      label: "(GMT+05:00) Karachi" },
  { value: "Asia/Kolkata",      label: "(GMT+05:30) Kolkata" },
  { value: "Asia/Bangkok",      label: "(GMT+07:00) Bangkok" },
  { value: "Asia/Singapore",    label: "(GMT+08:00) Singapore" },
  { value: "Asia/Tokyo",        label: "(GMT+09:00) Tokyo" },
  { value: "Australia/Sydney",  label: "(GMT+10:00) Sydney" },
  { value: "Pacific/Auckland",  label: "(GMT+12:00) Auckland" },
];

function GeneralSection() {
  const [orgName, setOrgName] = React.useState("Accel TRMS");
  const [orgId] = React.useState("ORG-2026-001");
  const [defaultSite, setDefaultSite] = React.useState("astra");
  const [defaultTz, setDefaultTz] = React.useState("Asia/Singapore");
  const [language, setLanguage] = React.useState("en");
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  /* Date & Time + Numbers & Units (moved here from Localization). */
  const [dateFormat, setDateFormat] = React.useState("DD MMM YYYY");
  const [timeFormat, setTimeFormat] = React.useState<"12h" | "24h">("24h");
  const [weekStart, setWeekStart] = React.useState<"sun" | "mon">("mon");
  const [numberFormat, setNumberFormat] = React.useState("1,234.56");
  const [units, setUnits] = React.useState<"metric" | "imperial">("metric");

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Organization" description="Your workspace identity.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization Name</label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-9 text-base" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization ID</label>
            <Input value={orgId} disabled className="h-9 font-mono text-base" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default Site</label>
            <Select value={defaultSite} onValueChange={(v) => setDefaultSite(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="astra">Astra HQ</SelectItem>
                <SelectItem value="fedex">FedEx Changi</SelectItem>
                <SelectItem value="sembawang">Sembawang Naval</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default Timezone</label>
            <Select value={defaultTz} onValueChange={(v) => setDefaultTz(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default Language</label>
            <Select value={language} onValueChange={(v) => setLanguage(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="ja">日本語</SelectItem>
                <SelectItem value="ko">한국어</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Date & Time" description="Format used across timestamps and exports.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date format</label>
            <Select value={dateFormat} onValueChange={(v) => setDateFormat(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time format</label>
            <div className="flex gap-1.5">
              {(["24h", "12h"] as const).map((opt) => (
                <button key={opt} onClick={() => setTimeFormat(opt)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                    timeFormat === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {opt === "24h" ? "24-hour (15:30)" : "12-hour (3:30 PM)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Week starts on</label>
            <div className="flex gap-1.5">
              {(["mon", "sun"] as const).map((opt) => (
                <button key={opt} onClick={() => setWeekStart(opt)}
                  className={cn(
                    "relative flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors",
                    weekStart === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {opt === "mon" ? "Monday" : "Sunday"}
                  {opt === "mon" && (
                    <span className="ml-1.5 inline-flex items-center rounded-full border border-success/40 bg-success/10 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-success">
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Numbers & Units" description="How numeric values and measurements are displayed.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Number format</label>
            <Select value={numberFormat} onValueChange={(v) => setNumberFormat(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1,234.56">1,234.56</SelectItem>
                <SelectItem value="1.234,56">1.234,56</SelectItem>
                <SelectItem value="1 234,56">1 234,56</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Measurement units</label>
            <div className="flex gap-1.5">
              {(["metric", "imperial"] as const).map((opt) => (
                <button key={opt} onClick={() => setUnits(opt)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-sm font-semibold capitalize transition-colors",
                    units === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Operational Mode" description="Control how the dashboard behaves system-wide.">
        <PrefRow icon={AlertTriangle} title="Maintenance mode"
          description="Block all non-admin users from signing in. Active sessions remain until refresh."
          control={<Toggle checked={maintenanceMode} onChange={setMaintenanceMode} />} />
      </SectionCard>
    </div>
  );
}

/* ── User Access (role permissions matrix) ───────────────────────────── */

const PERMISSIONS: { key: string; label: string; description: string }[] = [
  { key: "view-live",        label: "View live monitoring",       description: "Watch live camera feeds and pin favorites." },
  { key: "view-recordings",  label: "View recordings",            description: "Browse and replay recordings across sites." },
  { key: "manage-cameras",   label: "Manage cameras & NVRs",      description: "Add, edit, delete cameras and NVR devices." },
  { key: "manage-sites",     label: "Manage sites",               description: "Create / edit / delete sites and floor plans." },
  { key: "manage-rules",     label: "Manage detection rules",     description: "Author, edit, delete rules in Rules Library." },
  { key: "manage-models",    label: "Manage models",              description: "Add, train, and deploy detection models." },
  { key: "create-cases",     label: "Create incident cases",      description: "Escalate detections into cases." },
  { key: "manage-cases",     label: "Manage all cases",           description: "Edit, reassign, and close all cases." },
  { key: "manage-users",     label: "Manage users",               description: "Invite, suspend, change roles." },
  { key: "manage-billing",   label: "Manage billing & licenses",  description: "Purchase seats, update payment method." },
  { key: "manage-config",    label: "Modify system configuration",description: "Access this page and change settings." },
  { key: "view-audit-logs",  label: "View audit logs",            description: "See all activity in Activity Logs." },
];

const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  owner: Object.fromEntries(PERMISSIONS.map((p) => [p.key, true])),
  admin: {
    "view-live": true, "view-recordings": true, "manage-cameras": true, "manage-sites": true,
    "manage-rules": true, "manage-models": true, "create-cases": true, "manage-cases": true,
    "manage-users": true, "manage-billing": false, "manage-config": false, "view-audit-logs": true,
  },
  user: {
    "view-live": true, "view-recordings": true, "manage-cameras": false, "manage-sites": false,
    "manage-rules": false, "manage-models": false, "create-cases": true, "manage-cases": false,
    "manage-users": false, "manage-billing": false, "manage-config": false, "view-audit-logs": false,
  },
};

/**
 * Permissions that are NEVER available to a given role — the toggle is
 * locked off and rendered as an em-dash so admins can't grant features
 * that role tier doesn't ship with.
 */
const LOCKED_PERMISSIONS: Record<UserRole, Set<string>> = {
  owner: new Set(),
  admin: new Set(["manage-billing", "manage-config"]),
  user: new Set([
    "manage-cameras",
    "manage-sites",
    "manage-rules",
    "manage-models",
    "manage-cases",
    "manage-users",
    "manage-billing",
    "manage-config",
    "view-audit-logs",
  ]),
};

function UserAccessSection() {
  const [matrix, setMatrix] = React.useState(DEFAULT_PERMISSIONS);

  function toggle(role: UserRole, key: string) {
    if (role === "owner") return;
    if (LOCKED_PERMISSIONS[role].has(key)) return;
    setMatrix((m) => ({ ...m, [role]: { ...m[role], [key]: !m[role][key] } }));
  }

  const ROLE_STYLES: Record<UserRole, { bg: string; text: string; label: string }> = {
    owner: { bg: "bg-success/15",   text: "text-success",      label: "Owner" },
    admin: { bg: "bg-info/15",      text: "text-info",         label: "Admin" },
    user:  { bg: "bg-secondary/15", text: "text-secondary",    label: "User" },
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Role Permissions Matrix" description="Define what each role can do across all modules. Owner always has full access."
        action={<Button variant="outline" onClick={() => setMatrix(DEFAULT_PERMISSIONS)} className="gap-1.5"><RefreshCw className="size-3" />Reset</Button>}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-border text-2xs font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
                <th className="px-3 py-2.5 font-semibold">Permission</th>
                {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                  const rs = ROLE_STYLES[r];
                  return (
                    <th key={r} className="w-[120px] px-3 py-2.5 text-center font-semibold">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", rs.bg, rs.text)}>
                        {rs.label}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {PERMISSIONS.map((p) => (
                <tr key={p.key}>
                  <td className="px-3 py-3">
                    <p className="text-base font-semibold text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </td>
                  {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                    const locked = LOCKED_PERMISSIONS[r].has(p.key);
                    const checked = !locked && (matrix[r][p.key] ?? false);
                    if (locked) {
                      return (
                        <td key={r} className="px-3 py-3 text-center">
                          <span
                            title={`Not available for ${r}`}
                            className="inline-flex size-5 items-center justify-center rounded border border-dashed border-border/60 text-2xs text-muted-foreground/50"
                          >
                            —
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={r} className="px-3 py-3 text-center">
                        <button onClick={() => toggle(r, p.key)} disabled={r === "owner"}
                          className={cn("inline-flex size-5 items-center justify-center rounded border transition-colors",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                            r === "owner" && "cursor-not-allowed opacity-60")}>
                          {checked && <Check className="size-3" strokeWidth={3} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Permission changes apply on the user's next sign-in. Active sessions retain existing permissions until refresh.
        </p>
      </SectionCard>
    </div>
  );
}

/* ── SLA ─────────────────────────────────────────────────────────────── */

const SEVERITY_OPTS: { key: "critical" | "medium" | "low"; label: string; bg: string; text: string; description: string }[] = [
  { key: "critical", label: "Critical", bg: "bg-sev-critical/15", text: "text-sev-critical", description: "Highest priority — immediate escalation required" },
  { key: "medium",   label: "Medium",   bg: "bg-warning/15",      text: "text-warning",      description: "Standard review — investigate within window" },
  { key: "low",      label: "Low",      bg: "bg-info/15",         text: "text-info",         description: "Lowest priority — routine triage" },
];

/* Auto-split a response target into stage durations (minutes). Resolution
 * equals the full target; acknowledge / initial action are fractions of it. */
function computeStages(total: number): StageTimes {
  return {
    acknowledge: Math.max(1, Math.round(total * 0.2)),
    initial:     Math.max(1, Math.round(total * 0.5)),
    resolution:  Math.max(1, total),
  };
}

type SevKey = "critical" | "medium" | "low";
interface StageTimes { acknowledge: number; initial: number; resolution: number }

const STAGE_DEFS: { key: keyof StageTimes; label: string; description: string }[] = [
  { key: "acknowledge", label: "Acknowledge",    description: "Time to first acknowledgement by an operator." },
  { key: "initial",     label: "Initial Action", description: "Time to take the first substantive action (assign, dispatch, investigate)." },
  { key: "resolution",  label: "Resolution",     description: "Time until the incident is fully resolved or escalated to closure." },
];

const DEFAULT_DURATIONS: Record<SevKey, number> = { critical: 5, medium: 30, low: 240 };

function fmtDuration(min: number) {
  return min < 60 ? `${min} min` : `${Math.round((min / 60) * 10) / 10} hr`;
}

/* Min ⇆ Hour conversion — values are stored canonically in minutes. */
type Unit = "min" | "hr";
const toMinutes = (value: number, unit: Unit) => (unit === "hr" ? value * 60 : value);
const fromMinutes = (min: number, unit: Unit) =>
  unit === "hr" ? Math.round((min / 60) * 100) / 100 : min;

function UnitToggle({ value, onChange, disabled }: { value: Unit; onChange: (u: Unit) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center rounded-md border border-border bg-card p-0.5">
      {(["min", "hr"] as Unit[]).map((u) => (
        <button
          key={u}
          type="button"
          disabled={disabled}
          onClick={() => onChange(u)}
          className={cn(
            "rounded px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
            value === u ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {u === "min" ? "Mins" : "Hours"}
        </button>
      ))}
    </div>
  );
}

function SlaSection() {
  const [slaEnabled, setSlaEnabled] = React.useState(true);
  const [durations, setDurations] = React.useState<Record<SevKey, number>>(DEFAULT_DURATIONS);
  const [stages, setStages] = React.useState<Record<SevKey, StageTimes>>({
    critical: computeStages(DEFAULT_DURATIONS.critical),
    medium:   computeStages(DEFAULT_DURATIONS.medium),
    low:      computeStages(DEFAULT_DURATIONS.low),
  });
  const [expanded, setExpanded] = React.useState<SevKey | null>("critical");
  const [units, setUnits] = React.useState<Record<SevKey, Unit>>({ critical: "min", medium: "min", low: "min" });
  const [escalateOnMiss, setEscalateOnMiss] = React.useState(true);
  const [businessHoursOnly, setBusinessHoursOnly] = React.useState(false);
  const escalationChain: ("admin" | "owner")[] = ["admin", "owner"];

  function setDuration(key: SevKey, raw: number) {
    const total = Math.max(1, Math.min(1440, raw || 1));
    setDurations((d) => ({ ...d, [key]: total }));
    /* Filling the severity target auto-recalculates its stage breakdown. */
    setStages((s) => ({ ...s, [key]: computeStages(total) }));
  }

  function setStage(key: SevKey, stage: keyof StageTimes, raw: number) {
    setStages((s) => ({ ...s, [key]: { ...s[key], [stage]: Math.max(1, raw || 1) } }));
  }

  function resetAll() {
    setDurations(DEFAULT_DURATIONS);
    setStages({
      critical: computeStages(DEFAULT_DURATIONS.critical),
      medium:   computeStages(DEFAULT_DURATIONS.medium),
      low:      computeStages(DEFAULT_DURATIONS.low),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="SLA Master Switch" description="Control whether SLA tracking is enforced across all incidents.">
        <PrefRow icon={Clock} title="Enable SLA tracking"
          description="Track response times for every incident. When off, incidents are not timed."
          control={<Toggle checked={slaEnabled} onChange={setSlaEnabled} />} />
      </SectionCard>

      <SectionCard
        title="Response & SLA Targets"
        description="Set the response target per severity. Expand a severity to fine-tune its Acknowledge, Initial Action and Resolution stages."
        action={<Button variant="outline" onClick={resetAll} className="gap-1.5">
          <RefreshCw className="size-3" />Reset
        </Button>}>
        <div className="space-y-2">
          {SEVERITY_OPTS.map((opt) => {
            const isOpen = expanded === opt.key;
            return (
              <div key={opt.key} className={cn("rounded-lg border border-border bg-background", !slaEnabled && "opacity-50")}>
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <button
                    type="button"
                    disabled={!slaEnabled}
                    onClick={() => setExpanded(isOpen ? null : opt.key)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
                  >
                    <ChevronDown className={cn("size-4 flex-shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", opt.bg, opt.text)}>
                      <TriangleAlert className="size-2.5" />
                      {opt.label}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold text-foreground">{opt.label} severity</span>
                      <span className="block text-xs text-muted-foreground">{opt.description}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min={0} step={units[opt.key] === "hr" ? 0.5 : 1}
                      value={fromMinutes(durations[opt.key], units[opt.key])}
                      disabled={!slaEnabled}
                      onChange={(e) => setDuration(opt.key, toMinutes(Number(e.target.value), units[opt.key]))}
                      className="h-8 w-20 text-center font-mono text-base"
                    />
                    <UnitToggle
                      value={units[opt.key]}
                      disabled={!slaEnabled}
                      onChange={(u) => setUnits((prev) => ({ ...prev, [opt.key]: u }))}
                    />
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border px-3.5 py-3">
                    <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Stage targets · auto-calculated from {fmtDuration(durations[opt.key])}, editable
                    </p>
                    <div className="space-y-2">
                      {STAGE_DEFS.map((s) => (
                        <div key={s.key} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">{s.label}</p>
                            <p className="text-2xs leading-snug text-muted-foreground">{s.description}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Input
                              type="number" min={0} step={units[opt.key] === "hr" ? 0.5 : 1}
                              value={fromMinutes(stages[opt.key][s.key], units[opt.key])}
                              disabled={!slaEnabled}
                              onChange={(e) => setStage(opt.key, s.key, toMinutes(Number(e.target.value), units[opt.key]))}
                              className="h-8 w-20 text-center font-mono text-base"
                            />
                            <span className="w-9 text-sm font-semibold text-muted-foreground">
                              {units[opt.key] === "hr" ? "hr" : "min"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SEVERITY_OPTS.map((opt) => (
            <div key={opt.key} className="rounded-md border border-border bg-background px-2.5 py-2 text-center">
              <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{opt.label}</p>
              <p className={cn("mt-0.5 text-md font-bold", opt.text)}>{fmtDuration(durations[opt.key])}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Escalation" description="What happens when an SLA is missed.">
        <div className="space-y-2">
          <PrefRow icon={TriangleAlert} title="Auto-escalate on SLA miss"
            description="Notify the next role in the escalation chain when a target is breached."
            control={<Toggle checked={escalateOnMiss} onChange={setEscalateOnMiss} disabled={!slaEnabled} />} />
          <PrefRow icon={Building2} title="Business-hours only"
            description="Pause SLA timers outside of configured business hours."
            control={<Toggle checked={businessHoursOnly} onChange={setBusinessHoursOnly} disabled={!slaEnabled} />} />
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Escalation Chain</p>
          <div className="flex flex-wrap items-center gap-2">
            {escalationChain.map((r, i) => (
              <React.Fragment key={i}>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-sm font-semibold capitalize text-foreground">
                  {i + 1}. {r}
                </span>
                {i < escalationChain.length - 1 && <span className="text-muted-foreground">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Detection ───────────────────────────────────────────────────────── */

function DetectionSection() {
  const [globalConfidence, setGlobalConfidence] = React.useState(80);
  const [fpsTarget, setFpsTarget] = React.useState(15);
  const [duplicateWindow, setDuplicateWindow] = React.useState(30);
  const [enableLowConfidence, setEnableLowConfidence] = React.useState(false);
  const [autoLogAll, setAutoLogAll] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Detection Defaults" description="Default values applied to new rules and deployments.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Default Confidence Threshold</span>
              <span className="font-mono text-foreground">{globalConfidence}%</span>
            </label>
            <input type="range" min={50} max={99} step={1} value={globalConfidence}
              onChange={(e) => setGlobalConfidence(Number(e.target.value))}
              className="w-full accent-primary" />
            <p className="mt-1 text-xs text-muted-foreground">
              Detections below this threshold are discarded unless a rule explicitly lowers it.
            </p>
          </div>
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Default Inference FPS</span>
              <span className="font-mono text-foreground">{fpsTarget} fps</span>
            </label>
            <input type="range" min={1} max={30} step={1} value={fpsTarget}
              onChange={(e) => setFpsTarget(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Duplicate suppression window
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={3600} step={5} value={duplicateWindow}
                onChange={(e) => setDuplicateWindow(Math.max(0, Math.min(3600, Number(e.target.value))))}
                className="h-9 w-32 text-center font-mono text-base" />
              <span className="text-sm font-semibold text-muted-foreground">seconds</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Suppress repeat detections of the same event within this time window.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Detection Behavior" description="System-wide detection options.">
        <div className="space-y-2">
          <PrefRow icon={Activity} title="Capture low-confidence detections"
            description="Log detections below threshold to Activity Logs for tuning."
            control={<Toggle checked={enableLowConfidence} onChange={setEnableLowConfidence} />} />
          <PrefRow icon={HardDrive} title="Auto-log every detection"
            description="Persist every detection event to the audit log regardless of severity."
            control={<Toggle checked={autoLogAll} onChange={setAutoLogAll} />} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Notifications ───────────────────────────────────────────────────── */

function NotificationsSection() {
  const [emailEnabled, setEmailEnabled] = React.useState(true);
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [smsEnabled, setSmsEnabled] = React.useState(false);
  const [slackEnabled, setSlackEnabled] = React.useState(false);
  const [emailFrom, setEmailFrom] = React.useState("alerts@accel.ai");
  const [smsProvider, setSmsProvider] = React.useState("twilio");
  const [criticalAll, setCriticalAll] = React.useState(true);
  const [mediumAdminOnly, setMediumAdminOnly] = React.useState(true);
  const [digestDaily, setDigestDaily] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Delivery Channels" description="Which channels can the system use to reach users.">
        <div className="space-y-2">
          <PrefRow icon={Mail} title="Email"
            description={`From: ${emailFrom}`}
            control={<Toggle checked={emailEnabled} onChange={setEmailEnabled} />} />
          <PrefRow icon={Smartphone} title="Push (Mobile App)"
            description="Send push notifications to the iOS / Android app."
            control={<Toggle checked={pushEnabled} onChange={setPushEnabled} />} />
          <PrefRow icon={Smartphone} title="SMS"
            description={`Provider: ${smsProvider} · billed per message`}
            control={<Toggle checked={smsEnabled} onChange={setSmsEnabled} />} />
          <PrefRow icon={MessageSquare} title="Slack"
            description="Post incident summaries to a Slack channel."
            control={<Toggle checked={slackEnabled} onChange={setSlackEnabled} />} />
        </div>
      </SectionCard>

      <SectionCard title="Notification Rules" description="Default targeting when an incident is created.">
        <div className="space-y-2">
          <PrefRow title="Critical → notify everyone"
            description="Critical detections fan out to all roles via every enabled channel."
            control={<Toggle checked={criticalAll} onChange={setCriticalAll} />} />
          <PrefRow title="Medium → admins only"
            description="Medium severity stays within Admins and Owners."
            control={<Toggle checked={mediumAdminOnly} onChange={setMediumAdminOnly} />} />
          <PrefRow title="Daily digest"
            description="Send a once-a-day summary of all events to admins."
            control={<Toggle checked={digestDaily} onChange={setDigestDaily} />} />
        </div>
      </SectionCard>

      <SectionCard title="Email Configuration" description="Sender details for outbound mail.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">From Address</label>
            <Input value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} className="h-9 text-base" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">SMS Provider</label>
            <Select value={smsProvider} onValueChange={(v) => setSmsProvider(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="sns">AWS SNS</SelectItem>
                <SelectItem value="messagebird">MessageBird</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Camera defaults ─────────────────────────────────────────────────── */

function CameraDefaultsSection() {
  const [codec, setCodec] = React.useState<"h264" | "h265">("h264");
  const [resolution, setResolution] = React.useState("1920x1080");
  const [frameRate, setFrameRate] = React.useState(15);
  const [rtspPort, setRtspPort] = React.useState(554);
  const [defaultSchedule, setDefaultSchedule] = React.useState<"24x7" | "motion" | "scheduled">("motion");
  const [autoAssignArea, setAutoAssignArea] = React.useState(true);
  const [autoConnectNvr, setAutoConnectNvr] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Stream Defaults" description="Applied to every newly added camera.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Codec</label>
            <Select value={codec} onValueChange={(v) => setCodec(v as "h264" | "h265")}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="h264">H.264</SelectItem>
                <SelectItem value="h265">H.265 / HEVC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution</label>
            <Select value={resolution} onValueChange={(v) => setResolution(v)}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1280x720">1280x720</SelectItem>
                <SelectItem value="1920x1080">1920x1080</SelectItem>
                <SelectItem value="2560x1440">2560x1440</SelectItem>
                <SelectItem value="3840x2160">3840x2160</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Frame Rate</span>
              <span className="font-mono text-foreground">{frameRate} fps</span>
            </label>
            <input type="range" min={5} max={60} step={1} value={frameRate}
              onChange={(e) => setFrameRate(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">RTSP Port</label>
            <Input type="number" value={rtspPort} onChange={(e) => setRtspPort(Number(e.target.value) || 554)} className="h-9 text-base" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Recording Schedule" description="Default trigger pattern for newly added cameras.">
        <div className="flex gap-2">
          {(["24x7", "motion", "scheduled"] as const).map((opt) => (
            <button key={opt} onClick={() => setDefaultSchedule(opt)}
              className={cn(
                "flex-1 rounded-md border px-3 py-2 text-left transition-colors",
                defaultSchedule === opt ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
              )}>
              <p className="text-sm font-semibold capitalize text-foreground">{opt.replace(/-/g, " ")}</p>
              <p className="mt-0.5 text-2xs text-muted-foreground">
                {opt === "24x7"      && "Continuous recording, all hours"}
                {opt === "motion"    && "Record on motion or detection events only"}
                {opt === "scheduled" && "Operating-hours window from the site"}
              </p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Auto-provisioning">
        <div className="space-y-2">
          <PrefRow icon={MapPin} title="Auto-assign to area"
            description="Match cameras to areas by IP subnet on first connect."
            control={<Toggle checked={autoAssignArea} onChange={setAutoAssignArea} />} />
          <PrefRow icon={Database} title="Auto-connect available NVR channel"
            description="When a free NVR channel exists at the same site, link the camera automatically."
            control={<Toggle checked={autoConnectNvr} onChange={setAutoConnectNvr} />} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── NVR defaults ────────────────────────────────────────────────────── */

const RETENTION_PRESETS = [7, 14, 30, 60, 90];

function NvrDefaultsSection() {
  const [storageWarn, setStorageWarn] = React.useState(85);
  const [defaultChannelCount, setDefaultChannelCount] = React.useState(16);
  const [healthCheckInterval, setHealthCheckInterval] = React.useState(60);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = React.useState(true);
  const [retentionDays, setRetentionDays] = React.useState(30);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Storage Alerts" description="When to flag a NVR for attention.">
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Warning threshold</span>
            <span className="font-mono text-warning">{storageWarn}%</span>
          </label>
          <input type="range" min={50} max={99} step={1} value={storageWarn}
            onChange={(e) => setStorageWarn(Number(e.target.value))}
            className="w-full accent-warning" />
        </div>
      </SectionCard>

      <SectionCard title="Cleanup Strategy" description="How a NVR reclaims space.">
        <div className="space-y-2">
          <PrefRow icon={RefreshCw} title="Automatic cleanup"
            description="Schedule age-based cleanup when storage crosses the warning threshold."
            control={<Toggle checked={autoCleanupEnabled} onChange={setAutoCleanupEnabled} />} />

          <div className={cn("rounded-lg border border-border bg-background p-3", !autoCleanupEnabled && "pointer-events-none opacity-50")}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Remove recordings older than
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {RETENTION_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  disabled={!autoCleanupEnabled}
                  onClick={() => setRetentionDays(d)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                    retentionDays === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {d} days
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <Input
                  type="number" min={1} max={3650} step={1}
                  value={retentionDays}
                  disabled={!autoCleanupEnabled}
                  onChange={(e) => setRetentionDays(Math.max(1, Math.min(3650, Number(e.target.value) || 1)))}
                  className="h-8 w-20 text-center font-mono text-base"
                />
                <span className="text-sm font-semibold text-muted-foreground">days</span>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Age-based cleanup deletes any footage older than{" "}
              <strong className="text-foreground">{retentionDays} days</strong> on a daily schedule. This
              applies to <strong className="text-foreground">all NVR devices</strong> across every site.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Hardware Defaults">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default channel count</label>
            <Select value={String(defaultChannelCount)} onValueChange={(v) => setDefaultChannelCount(Number(v))}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[8, 16, 32, 64].map((n) => <SelectItem key={n} value={String(n)}>{n} channels</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health check every</label>
            <Select value={String(healthCheckInterval)} onValueChange={(v) => setHealthCheckInterval(Number(v))}>
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[15, 30, 60, 120, 300].map((s) => <SelectItem key={s} value={String(s)}>{s} s</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Integrations ────────────────────────────────────────────────────── */

function IntegrationsSection() {
  const integrations = [
    { id: "slack",     label: "Slack",            status: "connected",    description: "Post incident summaries to #security" },
    { id: "teams",     label: "Microsoft Teams",  status: "disconnected", description: "Channel notifications for incidents" },
    { id: "pagerduty", label: "PagerDuty",        status: "connected",    description: "Page on-call during critical events" },
    { id: "webhook",   label: "Webhooks",         status: "connected",    description: "3 active endpoints" },
    { id: "sso",       label: "SSO (SAML)",       status: "connected",    description: "Okta · acmecorp.okta.com" },
    { id: "scim",      label: "SCIM Provisioning",status: "disconnected", description: "Auto-provision users from your IDP" },
  ];

  return (
    <SectionCard title="Connected Services" description="Third-party tools the system can reach out to.">
      <div className="space-y-2">
        {integrations.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Webhook className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground">{i.label}</p>
              <p className="text-xs text-muted-foreground">{i.description}</p>
            </div>
            {i.status === "connected" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
                <Check className="size-2.5" strokeWidth={3} />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                Disconnected
              </span>
            )}
            <Button variant="outline">{i.status === "connected" ? "Configure" : "Connect"}</Button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ── Security ────────────────────────────────────────────────────────── */

function SecuritySection() {
  const [require2FA, setRequire2FA] = React.useState(false);
  const [sessionTimeout, setSessionTimeout] = React.useState(480);
  const [passwordMinLength, setPasswordMinLength] = React.useState(12);
  const [passwordExpiry, setPasswordExpiry] = React.useState(90);
  const [ipAllowlist, setIpAllowlist] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Authentication Policy" description="Rules applied to all users.">
        <div className="space-y-2">
          <PrefRow icon={KeyRound} title="Require Two-Factor Authentication"
            description="All users must enrol in 2FA on their next sign-in."
            control={<Toggle checked={require2FA} onChange={setRequire2FA} />} />
          <PrefRow icon={ShieldCheck} title="IP Allowlist"
            description="Restrict sign-in to listed IP ranges only."
            control={<Toggle checked={ipAllowlist} onChange={setIpAllowlist} />} />
        </div>
      </SectionCard>
      <SectionCard title="Session & Password" description="Account lifecycle settings.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Session Timeout (minutes)</label>
            <Input type="number" min={5} max={1440} step={5}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Math.max(5, Math.min(1440, Number(e.target.value))))}
              className="h-9 text-center font-mono text-base" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minimum Password Length</label>
            <Input type="number" min={8} max={64}
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(Math.max(8, Math.min(64, Number(e.target.value))))}
              className="h-9 text-center font-mono text-base" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password Expiry (days)</label>
            <Input type="number" min={0} max={365}
              value={passwordExpiry}
              onChange={(e) => setPasswordExpiry(Math.max(0, Math.min(365, Number(e.target.value))))}
              className="h-9 text-center font-mono text-base" />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Set password expiry to 0 to disable expiry enforcement.</p>
      </SectionCard>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function SystemConfigPage() {
  const [section, setSection] = React.useState<Section>("general");
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => { setDirty(true); }, [section]);

  function save() {
    toast.success("System configuration saved", { description: "Changes applied across the workspace." });
    setDirty(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>System Configuration</PageHeader.Title>
          <PageHeader.Description>
            Workspace-wide settings — permissions, SLAs, detection engine, integrations and security.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button variant="outline" onClick={() => { toast.message("Discarded local changes"); setDirty(false); }} className="gap-1.5">
            <X className="size-3.5" />
            Discard
          </Button>
          <Button onClick={save} className="gap-1.5">
            <Save className="size-3.5" />
            Save Changes
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        <nav className="flex flex-col gap-1 self-start rounded-xl border border-border bg-card p-1.5">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.key;
            return (
              <button key={s.key} onClick={() => setSection(s.key)}
                className={cn("flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Icon className={cn("mt-0.5 size-4 flex-shrink-0", active ? "text-primary" : "")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{s.label}</p>
                  <p className={cn("mt-0.5 text-2xs leading-snug", active ? "text-primary/70" : "text-muted-foreground/70")}>{s.description}</p>
                </div>
              </button>
            );
          })}
          {dirty && (
            <div className="mt-1 border-t border-border pt-2">
              <p className="px-2.5 py-1 text-2xs text-warning">● Unsaved changes</p>
            </div>
          )}
        </nav>

        <div className="min-w-0">
          {section === "general"          && <GeneralSection />}
          {section === "user-access"      && <UserAccessSection />}
          {section === "sla"              && <SlaSection />}
          {section === "detection"        && <DetectionSection />}
          {section === "camera-defaults"  && <CameraDefaultsSection />}
          {section === "nvr-defaults"     && <NvrDefaultsSection />}
          {section === "notifications"    && <NotificationsSection />}
          {section === "integrations"     && <IntegrationsSection />}
          {section === "security"         && <SecuritySection />}
        </div>
      </div>

      <span className="hidden"><Settings /></span>
    </div>
  );
}
