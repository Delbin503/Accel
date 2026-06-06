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
  LayoutDashboard,
  MapPin,
  CircleAlert,
  Video,
  Globe,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/users";

type Section =
  | "general"
  | "user-access"
  | "sla"
  | "dashboard"
  | "detection"
  | "camera-defaults"
  | "nvr-defaults"
  | "notifications"
  | "localization"
  | "integrations"
  | "security";

const SECTIONS: { key: Section; label: string; icon: React.ElementType; description: string }[] = [
  { key: "general",          label: "General",          icon: Building2,       description: "Organization, defaults, timezone" },
  { key: "user-access",      label: "User Access",      icon: Users,           description: "Role permissions matrix" },
  { key: "sla",              label: "SLA & Escalation", icon: Clock,           description: "Response targets per severity" },
  { key: "dashboard",        label: "Dashboard",        icon: LayoutDashboard, description: "Zone thresholds & default widgets" },
  { key: "detection",        label: "Detection Engine", icon: Brain,           description: "Confidence thresholds, models" },
  { key: "camera-defaults",  label: "Camera Defaults",  icon: Video,           description: "RTSP, codec, frame rate, recording" },
  { key: "nvr-defaults",     label: "NVR Defaults",     icon: Database,        description: "Channel cleanup, storage warnings" },
  { key: "notifications",    label: "Notifications",    icon: Bell,            description: "Default delivery channels" },
  { key: "localization",     label: "Localization",     icon: Globe,           description: "Date, time and number formats" },
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
          <h3 className="text-[14px] font-bold text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>}
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
        <p className="text-[13px] font-semibold text-foreground">{title}</p>
        {description && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{description}</p>}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  );
}

/* ── General ─────────────────────────────────────────────────────────── */

function GeneralSection() {
  const [orgName, setOrgName] = React.useState("Accel TRMS");
  const [orgId] = React.useState("ORG-2026-001");
  const [defaultSite, setDefaultSite] = React.useState("astra");
  const [defaultTz, setDefaultTz] = React.useState("Asia/Singapore");
  const [language, setLanguage] = React.useState("en");
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Organization" description="Your workspace identity.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organization Name</label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organization ID</label>
            <Input value={orgId} disabled className="h-9 font-mono text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Default Site</label>
            <select value={defaultSite} onChange={(e) => setDefaultSite(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none">
              <option value="astra">Astra HQ</option>
              <option value="fedex">FedEx Changi</option>
              <option value="sembawang">Sembawang Naval</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Default Timezone</label>
            <select value={defaultTz} onChange={(e) => setDefaultTz(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none">
              <option>Asia/Singapore</option>
              <option>Asia/Tokyo</option>
              <option>Asia/Bangkok</option>
              <option>Europe/London</option>
              <option>America/New_York</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Default Language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none">
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
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
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60">
                <th className="px-3 py-2.5 font-semibold">Permission</th>
                {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                  const rs = ROLE_STYLES[r];
                  return (
                    <th key={r} className="w-[120px] px-3 py-2.5 text-center font-semibold">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", rs.bg, rs.text)}>
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
                    <p className="text-[13px] font-semibold text-foreground">{p.label}</p>
                    <p className="text-[11px] text-muted-foreground">{p.description}</p>
                  </td>
                  {(["owner", "admin", "user"] as UserRole[]).map((r) => {
                    const locked = LOCKED_PERMISSIONS[r].has(p.key);
                    const checked = !locked && (matrix[r][p.key] ?? false);
                    if (locked) {
                      return (
                        <td key={r} className="px-3 py-3 text-center">
                          <span
                            title={`Not available for ${r}`}
                            className="inline-flex size-5 items-center justify-center rounded border border-dashed border-border/60 text-[10px] text-muted-foreground/50"
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
        <p className="mt-3 text-[11px] text-muted-foreground">
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

function SlaSection() {
  const [slaEnabled, setSlaEnabled] = React.useState(true);
  const [durations, setDurations] = React.useState<Record<string, number>>({ critical: 5, medium: 30, low: 240 });
  const [escalateOnMiss, setEscalateOnMiss] = React.useState(true);
  const [businessHoursOnly, setBusinessHoursOnly] = React.useState(false);
  const escalationChain: ("admin" | "owner")[] = ["admin", "owner"];

  /* New SLA stage targets — Acknowledge / Initial Action / Resolution */
  type Unit = "min" | "hr";
  interface Stage { value: number; unit: Unit }
  const [stages, setStages] = React.useState<Record<"acknowledge" | "initial" | "resolution", Stage>>({
    acknowledge: { value: 5,  unit: "min" },
    initial:     { value: 30, unit: "min" },
    resolution:  { value: 4,  unit: "hr"  },
  });
  const STAGE_DEFS: { key: "acknowledge" | "initial" | "resolution"; label: string; description: string }[] = [
    { key: "acknowledge", label: "Acknowledge",    description: "Time to first acknowledgement by an operator." },
    { key: "initial",     label: "Initial Action", description: "Time to take the first substantive action (assign, dispatch, investigate)." },
    { key: "resolution",  label: "Resolution",     description: "Time until the incident is fully resolved or escalated to closure." },
  ];

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="SLA Master Switch" description="Control whether SLA tracking is enforced across all incidents.">
        <PrefRow icon={Clock} title="Enable SLA tracking"
          description="Track response times for every incident. When off, incidents are not timed."
          control={<Toggle checked={slaEnabled} onChange={setSlaEnabled} />} />
      </SectionCard>

      <SectionCard title="Response Targets" description="Maximum time (in minutes) to first response, per severity."
        action={<Button variant="outline" onClick={() => setDurations({ critical: 5, medium: 30, low: 240 })} className="gap-1.5">
          <RefreshCw className="size-3" />Reset
        </Button>}>
        <div className="space-y-2">
          {SEVERITY_OPTS.map((opt) => (
            <div key={opt.key} className={cn("flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3", !slaEnabled && "opacity-50")}>
              <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", opt.bg, opt.text)}>
                <TriangleAlert className="size-2.5" />
                {opt.label}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-foreground">{opt.label} severity</p>
                <p className="text-[11px] text-muted-foreground">{opt.description}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number" min={1} max={1440} step={1}
                  value={durations[opt.key]}
                  disabled={!slaEnabled}
                  onChange={(e) => setDurations((d) => ({ ...d, [opt.key]: Math.max(1, Math.min(1440, Number(e.target.value))) }))}
                  className="h-8 w-20 text-center font-mono text-[13px]"
                />
                <span className="text-[12px] font-semibold text-muted-foreground">min</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SEVERITY_OPTS.map((opt) => (
            <div key={opt.key} className="rounded-md border border-border bg-background px-2.5 py-2 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{opt.label}</p>
              <p className={cn("mt-0.5 text-[14px] font-bold", opt.text)}>
                {durations[opt.key] < 60 ? `${durations[opt.key]} min` : `${Math.round(durations[opt.key] / 60 * 10) / 10} hr`}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="SLA Stage Targets" description="Maximum time allowed at each stage of the incident lifecycle.">
        <div className="space-y-2">
          {STAGE_DEFS.map((s) => {
            const stage = stages[s.key];
            return (
              <div key={s.key} className={cn("flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3", !slaEnabled && "opacity-50")}>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.description}</p>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={stage.unit === "min" ? 1440 : 168}
                  step={1}
                  value={stage.value}
                  disabled={!slaEnabled}
                  onChange={(e) =>
                    setStages((curr) => ({
                      ...curr,
                      [s.key]: { ...curr[s.key], value: Math.max(1, Number(e.target.value) || 1) },
                    }))
                  }
                  className="h-8 w-20 text-center font-mono text-[13px]"
                />
                <div className="flex items-center rounded-md border border-border bg-card p-0.5">
                  {(["min", "hr"] as Unit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      disabled={!slaEnabled}
                      onClick={() =>
                        setStages((curr) => ({
                          ...curr,
                          [s.key]: { ...curr[s.key], unit: u },
                        }))
                      }
                      className={cn(
                        "rounded px-2 py-1 text-[11px] font-semibold transition-colors",
                        stage.unit === u
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {u === "min" ? "Mins" : "Hours"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Escalation Chain</p>
          <div className="flex flex-wrap items-center gap-2">
            {escalationChain.map((r, i) => (
              <React.Fragment key={i}>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[12px] font-semibold capitalize text-foreground">
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

/* ── Detection Engine ────────────────────────────────────────────────── */

/* ── Dashboard ───────────────────────────────────────────────────────── */

function DashboardSection() {
  const [showSystemStatus, setShowSystemStatus] = React.useState(true);
  const [showTopModels, setShowTopModels] = React.useState(true);
  const [showRecentActivity, setShowRecentActivity] = React.useState(true);
  const [showZoneAreas, setShowZoneAreas] = React.useState(true);
  const [defaultLanding, setDefaultLanding] = React.useState<"dashboard" | "detection-feed" | "incidents">("dashboard");

  return (
    <div className="flex flex-col gap-4">

      <SectionCard title="Default Widgets" description="Show or hide sections on the Dashboard.">
        <div className="space-y-2">
          <PrefRow icon={MapPin} title="Zone Areas"
            description="Incident counts per area, coloured by severity threshold."
            control={<Toggle checked={showZoneAreas} onChange={setShowZoneAreas} />} />
          <PrefRow icon={Activity} title="System Status"
            description="CPU, memory, disk and service health tiles."
            control={<Toggle checked={showSystemStatus} onChange={setShowSystemStatus} />} />
          <PrefRow icon={Brain} title="Top Deployed Models"
            description="Ranking of deployments by event volume."
            control={<Toggle checked={showTopModels} onChange={setShowTopModels} />} />
          <PrefRow icon={CircleAlert} title="Recent Activity Log"
            description="Compact feed of the latest workspace activity."
            control={<Toggle checked={showRecentActivity} onChange={setShowRecentActivity} />} />
        </div>
      </SectionCard>

      <SectionCard title="Landing Page" description="Where users are taken after signing in.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {([
            { value: "dashboard",      label: "Dashboard",       desc: "Workspace overview" },
            { value: "detection-feed", label: "Detection Feed",  desc: "Live event stream" },
            { value: "incidents",      label: "Incident Cases",  desc: "Open & in-review cases" },
          ] as const).map((o) => (
            <button key={o.value} onClick={() => setDefaultLanding(o.value)}
              className={cn("rounded-lg border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary",
                defaultLanding === o.value ? "border-primary bg-primary/5" : "border-border")}>
              <div className="flex items-center gap-2">
                <div className={cn("size-3 rounded-full border transition-colors",
                  defaultLanding === o.value ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                  {defaultLanding === o.value && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                </div>
                <p className="text-[12px] font-semibold text-foreground">{o.label}</p>
              </div>
              <p className="ml-5 mt-0.5 text-[10px] text-muted-foreground">{o.desc}</p>
            </button>
          ))}
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
            <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Default Confidence Threshold</span>
              <span className="font-mono text-foreground">{globalConfidence}%</span>
            </label>
            <input type="range" min={50} max={99} step={1} value={globalConfidence}
              onChange={(e) => setGlobalConfidence(Number(e.target.value))}
              className="w-full accent-primary" />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Detections below this threshold are discarded unless a rule explicitly lowers it.
            </p>
          </div>
          <div>
            <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Default Inference FPS</span>
              <span className="font-mono text-foreground">{fpsTarget} fps</span>
            </label>
            <input type="range" min={1} max={30} step={1} value={fpsTarget}
              onChange={(e) => setFpsTarget(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duplicate suppression window
            </label>
            <div className="flex items-center gap-2">
              <Input type="number" min={0} max={3600} step={5} value={duplicateWindow}
                onChange={(e) => setDuplicateWindow(Math.max(0, Math.min(3600, Number(e.target.value))))}
                className="h-9 w-32 text-center font-mono text-[13px]" />
              <span className="text-[12px] font-semibold text-muted-foreground">seconds</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
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
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">From Address</label>
            <Input value={emailFrom} onChange={(e) => setEmailFrom(e.target.value)} className="h-9 text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SMS Provider</label>
            <select value={smsProvider} onChange={(e) => setSmsProvider(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none">
              <option value="twilio">Twilio</option>
              <option value="sns">AWS SNS</option>
              <option value="messagebird">MessageBird</option>
            </select>
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
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Codec</label>
            <select value={codec} onChange={(e) => setCodec(e.target.value as "h264" | "h265")}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              <option value="h264">H.264</option>
              <option value="h265">H.265 / HEVC</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Resolution</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              <option>1280x720</option>
              <option>1920x1080</option>
              <option>2560x1440</option>
              <option>3840x2160</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Frame Rate</span>
              <span className="font-mono text-foreground">{frameRate} fps</span>
            </label>
            <input type="range" min={5} max={60} step={1} value={frameRate}
              onChange={(e) => setFrameRate(Number(e.target.value))}
              className="w-full accent-primary" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RTSP Port</label>
            <Input type="number" value={rtspPort} onChange={(e) => setRtspPort(Number(e.target.value) || 554)} className="h-9 text-[13px]" />
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
              <p className="text-[12px] font-semibold capitalize text-foreground">{opt.replace(/-/g, " ")}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
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

function NvrDefaultsSection() {
  const [storageWarn, setStorageWarn] = React.useState(85);
  const [storageCrit, setStorageCrit] = React.useState(95);
  const [cleanupMethod, setCleanupMethod] = React.useState<"auto-age" | "manual" | "oldest-first">("auto-age");
  const [defaultChannelCount, setDefaultChannelCount] = React.useState(16);
  const [healthCheckInterval, setHealthCheckInterval] = React.useState(60);
  const [autoCleanupEnabled, setAutoCleanupEnabled] = React.useState(true);

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Storage Alerts" description="When to flag a NVR for attention.">
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Warning threshold</span>
              <span className="font-mono text-warning">{storageWarn}%</span>
            </label>
            <input type="range" min={50} max={99} step={1} value={storageWarn}
              onChange={(e) => setStorageWarn(Number(e.target.value))}
              className="w-full accent-warning" />
          </div>
          <div>
            <label className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Critical threshold</span>
              <span className="font-mono text-sev-critical">{storageCrit}%</span>
            </label>
            <input type="range" min={Math.max(storageWarn, 60)} max={100} step={1} value={storageCrit}
              onChange={(e) => setStorageCrit(Math.max(storageWarn + 1, Number(e.target.value)))}
              className="w-full accent-primary" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Cleanup Strategy" description="How a NVR reclaims space.">
        <div className="space-y-2">
          <PrefRow icon={RefreshCw} title="Automatic cleanup"
            description="Schedule cleanup when storage crosses the warning threshold."
            control={<Toggle checked={autoCleanupEnabled} onChange={setAutoCleanupEnabled} />} />
          <div className="rounded-lg border border-border bg-background p-3">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Method</label>
            <select value={cleanupMethod} onChange={(e) => setCleanupMethod(e.target.value as typeof cleanupMethod)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              <option value="auto-age">Auto-age (delete past retention)</option>
              <option value="oldest-first">Oldest first (free target % of disk)</option>
              <option value="manual">Manual only (operator-triggered)</option>
            </select>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {cleanupMethod === "auto-age" && (
                <><strong className="text-foreground">Auto-age:</strong> any footage older than the configured retention window is deleted on a daily schedule. Predictable storage usage, no manual review.</>
              )}
              {cleanupMethod === "oldest-first" && (
                <><strong className="text-foreground">Oldest first:</strong> when storage crosses the warning threshold, the oldest recordings are removed first until disk usage drops to a safe target. Best for bursty workloads.</>
              )}
              {cleanupMethod === "manual" && (
                <><strong className="text-foreground">Manual only:</strong> nothing is deleted automatically. An operator must trigger cleanup from the NVR detail drawer. Use when retention is governed by an external policy.</>
              )}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Hardware Defaults">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Default channel count</label>
            <select value={defaultChannelCount} onChange={(e) => setDefaultChannelCount(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              {[8, 16, 32, 64].map((n) => <option key={n} value={n}>{n} channels</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Health check every</label>
            <select value={healthCheckInterval} onChange={(e) => setHealthCheckInterval(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              {[15, 30, 60, 120, 300].map((s) => <option key={s} value={s}>{s} s</option>)}
            </select>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Localization ────────────────────────────────────────────────────── */

function LocalizationSection() {
  const [dateFormat, setDateFormat] = React.useState("DD MMM YYYY");
  const [timeFormat, setTimeFormat] = React.useState<"12h" | "24h">("24h");
  const [weekStart, setWeekStart] = React.useState<"sun" | "mon">("mon");
  const [numberFormat, setNumberFormat] = React.useState("1,234.56");
  const [currency, setCurrency] = React.useState("USD");
  const [units, setUnits] = React.useState<"metric" | "imperial">("metric");

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Date & Time" description="Format used across timestamps and exports.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date format</label>
            <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              <option>DD MMM YYYY</option>
              <option>YYYY-MM-DD</option>
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Time format</label>
            <div className="flex gap-1.5">
              {(["24h", "12h"] as const).map((opt) => (
                <button key={opt} onClick={() => setTimeFormat(opt)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-[12px] font-semibold transition-colors",
                    timeFormat === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {opt === "24h" ? "24-hour (15:30)" : "12-hour (3:30 PM)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Week starts on</label>
            <div className="flex gap-1.5">
              {(["mon", "sun"] as const).map((opt) => (
                <button key={opt} onClick={() => setWeekStart(opt)}
                  className={cn(
                    "relative flex-1 rounded-md border px-3 py-2 text-[12px] font-semibold transition-colors",
                    weekStart === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {opt === "mon" ? "Monday" : "Sunday"}
                  {opt === "mon" && (
                    <span className="ml-1.5 inline-flex items-center rounded-full border border-success/40 bg-success/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-success">
                      Default
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Numbers & Units">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Number format</label>
            <select value={numberFormat} onChange={(e) => setNumberFormat(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              <option>1,234.56</option>
              <option>1.234,56</option>
              <option>1 234,56</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px]">
              {["USD", "SGD", "EUR", "GBP", "JPY", "AUD"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Measurement units</label>
            <div className="flex gap-1.5">
              {(["metric", "imperial"] as const).map((opt) => (
                <button key={opt} onClick={() => setUnits(opt)}
                  className={cn(
                    "flex-1 rounded-md border px-3 py-2 text-[12px] font-semibold capitalize transition-colors",
                    units === opt ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}>
                  {opt}
                </button>
              ))}
            </div>
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
              <p className="text-[13px] font-semibold text-foreground">{i.label}</p>
              <p className="text-[11px] text-muted-foreground">{i.description}</p>
            </div>
            {i.status === "connected" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                <Check className="size-2.5" strokeWidth={3} />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Session Timeout (minutes)</label>
            <Input type="number" min={5} max={1440} step={5}
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(Math.max(5, Math.min(1440, Number(e.target.value))))}
              className="h-9 text-center font-mono text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Minimum Password Length</label>
            <Input type="number" min={8} max={64}
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(Math.max(8, Math.min(64, Number(e.target.value))))}
              className="h-9 text-center font-mono text-[13px]" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Password Expiry (days)</label>
            <Input type="number" min={0} max={365}
              value={passwordExpiry}
              onChange={(e) => setPasswordExpiry(Math.max(0, Math.min(365, Number(e.target.value))))}
              className="h-9 text-center font-mono text-[13px]" />
          </div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Set password expiry to 0 to disable expiry enforcement.</p>
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
          <PageHeader.Title>System Config</PageHeader.Title>
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
                  <p className="text-[12px] font-semibold leading-tight">{s.label}</p>
                  <p className={cn("mt-0.5 text-[10px] leading-snug", active ? "text-primary/70" : "text-muted-foreground/70")}>{s.description}</p>
                </div>
              </button>
            );
          })}
          {dirty && (
            <div className="mt-1 border-t border-border pt-2">
              <p className="px-2.5 py-1 text-[10px] text-warning">● Unsaved changes</p>
            </div>
          )}
        </nav>

        <div className="min-w-0">
          {section === "general"          && <GeneralSection />}
          {section === "user-access"      && <UserAccessSection />}
          {section === "sla"              && <SlaSection />}
          {section === "dashboard"        && <DashboardSection />}
          {section === "detection"        && <DetectionSection />}
          {section === "camera-defaults"  && <CameraDefaultsSection />}
          {section === "nvr-defaults"     && <NvrDefaultsSection />}
          {section === "notifications"    && <NotificationsSection />}
          {section === "localization"     && <LocalizationSection />}
          {section === "integrations"     && <IntegrationsSection />}
          {section === "security"         && <SecuritySection />}
        </div>
      </div>

      <span className="hidden"><Settings /></span>
    </div>
  );
}
