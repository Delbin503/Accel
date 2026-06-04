export type ActivityKind =
  | "auth"           // sign-in / sign-out / 2FA
  | "user"           // user CRUD, role changes
  | "config"         // system config / billing
  | "site"           // sites / floor plans / areas
  | "camera"         // cameras / NVRs / zones
  | "rule"           // rules library / templates
  | "model"          // model management
  | "deployment"     // deployments
  | "case"           // incident cases
  | "event"          // detection events (dismiss/escalate)
  | "analysis"       // run analysis
  | "license"        // billing / license
  | "data-access";   // viewing recordings / exports

export type ActivityStatus = "success" | "failed";

export type ActivityActor = {
  id: string;
  name: string;
  initials: string;
  role: "owner" | "admin" | "user" | "system";
};

export interface ActivityLog {
  id: string;
  whenAt: string;          // ISO
  whenDisplay: string;     // "01 Jun 2026, 14:32"
  whenRelative: string;    // "5 min ago"
  actor: ActivityActor;
  kind: ActivityKind;
  text: string;
  module: string;
  ipAddress?: string;
  status: ActivityStatus;
  siteName?: string;       // site association (or undefined / "System" for workspace-wide)
}

const PEOPLE: ActivityActor[] = [
  { id: "USR-001", name: "Delbin Arkar",   initials: "DA", role: "owner" },
  { id: "USR-004", name: "Henyf Hilan",    initials: "HH", role: "admin" },
  { id: "USR-010", name: "Jordan Kim",     initials: "JK", role: "admin" },
  { id: "USR-009", name: "Priya Raman",    initials: "PR", role: "user" },
  { id: "USR-008", name: "Marcus Tan",     initials: "MT", role: "user" },
  { id: "USR-011", name: "Sze Hui",        initials: "SH", role: "admin" },
  { id: "system",  name: "System",         initials: "·",  role: "system" },
];

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  { id: "L-1024", whenAt: "2026-06-01T14:32:00", whenDisplay: "01 Jun 2026, 14:32", whenRelative: "5 min ago",
    actor: PEOPLE[0], kind: "auth", module: "User Management", ipAddress: "10.0.0.42",
    text: "Signed in via SSO (Okta)", status: "success", siteName: "System" },
  { id: "L-1023", whenAt: "2026-06-01T14:28:00", whenDisplay: "01 Jun 2026, 14:28", whenRelative: "9 min ago",
    actor: PEOPLE[1], kind: "case", module: "Incident Cases", ipAddress: "10.0.0.51",
    text: "Created case CASE-2026-038 — Loitering · Loading Bay 3 (3 incidents linked)", status: "success", siteName: "FedEx Changi" },
  { id: "L-1022", whenAt: "2026-06-01T14:24:00", whenDisplay: "01 Jun 2026, 14:24", whenRelative: "13 min ago",
    actor: PEOPLE[6], kind: "deployment", module: "Model Deployment", ipAddress: "system",
    text: "Auto-paused deployment DEP_003 — camera Cam-24 offline > 15 minutes", status: "failed", siteName: "Astra Jakarta" },
  { id: "L-1021", whenAt: "2026-06-01T14:18:00", whenDisplay: "01 Jun 2026, 14:18", whenRelative: "19 min ago",
    actor: PEOPLE[2], kind: "rule", module: "Rules Library", ipAddress: "10.0.0.78",
    text: "Updated rule \"Helmet Detection\" — confidence threshold 75% → 80%", status: "success", siteName: "System" },
  { id: "L-1020", whenAt: "2026-06-01T14:10:00", whenDisplay: "01 Jun 2026, 14:10", whenRelative: "27 min ago",
    actor: PEOPLE[0], kind: "config", module: "System Config", ipAddress: "10.0.0.42",
    text: "Updated SLA Critical response target: 10 min → 5 min", status: "success", siteName: "System" },
  { id: "L-1019", whenAt: "2026-06-01T13:55:00", whenDisplay: "01 Jun 2026, 13:55", whenRelative: "42 min ago",
    actor: PEOPLE[3], kind: "data-access", module: "Recordings", ipAddress: "10.0.0.92",
    text: "Downloaded recording REC-2026-118 (Bay 3 Dock, 06h 20m, 1.43 GB)", status: "success", siteName: "FedEx Changi" },
  { id: "L-1018", whenAt: "2026-06-01T13:42:00", whenDisplay: "01 Jun 2026, 13:42", whenRelative: "55 min ago",
    actor: PEOPLE[1], kind: "site", module: "Site Management", ipAddress: "10.0.0.51",
    text: "Created site \"FedEx Changi\" with 2 areas (Loading Bay 3, Checkpoint C1)", status: "success", siteName: "FedEx Changi" },
  { id: "L-1017", whenAt: "2026-06-01T13:35:00", whenDisplay: "01 Jun 2026, 13:35", whenRelative: "1 hr ago",
    actor: PEOPLE[2], kind: "camera", module: "Cameras", ipAddress: "10.0.0.78",
    text: "Added camera Cam-32 (Parking P1 — Gate) to site Astra HQ", status: "success", siteName: "Astra HQ" },
  { id: "L-1016", whenAt: "2026-06-01T13:14:00", whenDisplay: "01 Jun 2026, 13:14", whenRelative: "1 hr ago",
    actor: PEOPLE[0], kind: "user", module: "User Management", ipAddress: "10.0.0.42",
    text: "Invited 3 users · sjsj343@gmail.com, nsngs83@gmail.com, henyf@bluesilo.studio · role: Admin", status: "success", siteName: "System" },
  { id: "L-1015", whenAt: "2026-06-01T12:58:00", whenDisplay: "01 Jun 2026, 12:58", whenRelative: "1 hr ago",
    actor: PEOPLE[6], kind: "analysis", module: "Run Analysis", ipAddress: "system",
    text: "Analysis ANY_008 completed — SOP Compliance · score 60% (warning)", status: "success", siteName: "FedEx Changi" },
  { id: "L-1014", whenAt: "2026-06-01T12:42:00", whenDisplay: "01 Jun 2026, 12:42", whenRelative: "2 hr ago",
    actor: PEOPLE[1], kind: "model", module: "Model Management", ipAddress: "10.0.0.51",
    text: "Updated SOP Compliance sequence — reordered steps 3 and 4", status: "success", siteName: "System" },
  { id: "L-1013", whenAt: "2026-06-01T12:31:00", whenDisplay: "01 Jun 2026, 12:31", whenRelative: "2 hr ago",
    actor: PEOPLE[5], kind: "case", module: "Incident Cases", ipAddress: "10.0.0.65",
    text: "Closed case CASE-2026-035 — \"Unauthorized access · Armoury\" (SLA met)", status: "success", siteName: "Sembawang Naval" },
  { id: "L-1012", whenAt: "2026-06-01T12:18:00", whenDisplay: "01 Jun 2026, 12:18", whenRelative: "2 hr ago",
    actor: PEOPLE[0], kind: "config", module: "System Config", ipAddress: "10.0.0.42",
    text: "Updated role permissions — Admin permission 'manage-billing' set to ALLOW", status: "success", siteName: "System" },
  { id: "L-1011", whenAt: "2026-06-01T11:55:00", whenDisplay: "01 Jun 2026, 11:55", whenRelative: "3 hr ago",
    actor: PEOPLE[6], kind: "camera", module: "Device Health", ipAddress: "system",
    text: "Camera Cam-24 transitioned to FAILED — connection unreachable", status: "failed", siteName: "Astra Jakarta" },
  { id: "L-1010", whenAt: "2026-06-01T11:42:00", whenDisplay: "01 Jun 2026, 11:42", whenRelative: "3 hr ago",
    actor: PEOPLE[2], kind: "deployment", module: "Model Deployment", ipAddress: "10.0.0.78",
    text: "Deployed Helmet Detection V1 → 3 cameras at FedEx Changi", status: "success", siteName: "FedEx Changi" },
  { id: "L-1009", whenAt: "2026-06-01T11:28:00", whenDisplay: "01 Jun 2026, 11:28", whenRelative: "3 hr ago",
    actor: PEOPLE[0], kind: "auth", module: "Security", ipAddress: "10.0.0.42",
    text: "Two-factor authentication enabled for account", status: "success", siteName: "System" },
  { id: "L-1008", whenAt: "2026-06-01T11:12:00", whenDisplay: "01 Jun 2026, 11:12", whenRelative: "3 hr ago",
    actor: PEOPLE[4], kind: "data-access", module: "Detection Feed", ipAddress: "10.0.0.88",
    text: "Exported 142 detection events to CSV (May 25 – Jun 1)", status: "success", siteName: "Sembawang Naval" },
  { id: "L-1007", whenAt: "2026-06-01T10:58:00", whenDisplay: "01 Jun 2026, 10:58", whenRelative: "4 hr ago",
    actor: PEOPLE[0], kind: "user", module: "User Management", ipAddress: "10.0.0.42",
    text: "Suspended user Priya Raman (USR-009) for 30 days · reason: Pending HR review", status: "success", siteName: "System" },
  { id: "L-1006", whenAt: "2026-06-01T10:42:00", whenDisplay: "01 Jun 2026, 10:42", whenRelative: "4 hr ago",
    actor: PEOPLE[1], kind: "site", module: "Site Management", ipAddress: "10.0.0.51",
    text: "Uploaded floor plan for site Astra HQ (Level 1 — Main Floor)", status: "success", siteName: "Astra HQ" },
  { id: "L-1005", whenAt: "2026-06-01T10:14:00", whenDisplay: "01 Jun 2026, 10:14", whenRelative: "4 hr ago",
    actor: PEOPLE[6], kind: "case", module: "Incident Cases", ipAddress: "system",
    text: "Auto-escalated case CASE-2026-031 — SLA breached (Critical · 8m 14s overdue)", status: "failed", siteName: "Sembawang Naval" },
  { id: "L-1004", whenAt: "2026-06-01T09:51:00", whenDisplay: "01 Jun 2026, 09:51", whenRelative: "5 hr ago",
    actor: PEOPLE[2], kind: "config", module: "System Config", ipAddress: "10.0.0.78",
    text: "Enabled integration: PagerDuty (account: oncall-security@accel.ai)", status: "success", siteName: "System" },
  { id: "L-1003", whenAt: "2026-06-01T09:32:00", whenDisplay: "01 Jun 2026, 09:32", whenRelative: "5 hr ago",
    actor: PEOPLE[1], kind: "rule", module: "Rules Library", ipAddress: "10.0.0.51",
    text: "Saved \"Perimeter Intrusion\" as a template (Object Detection, Zone, Intrusion)", status: "success", siteName: "System" },
  { id: "L-1002", whenAt: "2026-06-01T09:14:00", whenDisplay: "01 Jun 2026, 09:14", whenRelative: "5 hr ago",
    actor: PEOPLE[0], kind: "license", module: "Billing & License", ipAddress: "10.0.0.42",
    text: "Purchased 2 Admin seats — +$50/mo charged on next invoice (01 Jul 2026)", status: "success", siteName: "System" },
  { id: "L-1001", whenAt: "2026-06-01T08:58:00", whenDisplay: "01 Jun 2026, 08:58", whenRelative: "6 hr ago",
    actor: PEOPLE[0], kind: "auth", module: "User Management", ipAddress: "10.0.0.42",
    text: "Reset password for Henyf Hilan (USR-004) — emailed reset link", status: "success", siteName: "System" },
  { id: "L-1000", whenAt: "2026-05-31T18:42:00", whenDisplay: "31 May 2026, 18:42", whenRelative: "Yesterday",
    actor: PEOPLE[3], kind: "auth", module: "User Management", ipAddress: "10.0.0.92",
    text: "Sign-in attempt blocked — too many failed attempts", status: "failed", siteName: "System" },
  { id: "L-0999", whenAt: "2026-05-31T16:24:00", whenDisplay: "31 May 2026, 16:24", whenRelative: "Yesterday",
    actor: PEOPLE[1], kind: "event", module: "Detection Feed", ipAddress: "10.0.0.51",
    text: "Dismissed EVT-2026-0531-014 — false positive · wrong class", status: "success", siteName: "FedEx Changi" },
  { id: "L-0998", whenAt: "2026-05-30T11:18:00", whenDisplay: "30 May 2026, 11:18", whenRelative: "2 days ago",
    actor: PEOPLE[0], kind: "license", module: "Billing & License", ipAddress: "10.0.0.42",
    text: "Renewal alert sent — 90-day notice for Sembawang Naval Base", status: "success", siteName: "Sembawang Naval" },
];

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  auth:          "Authentication",
  user:          "User",
  config:        "Configuration",
  site:          "Site",
  camera:        "Camera/NVR",
  rule:          "Rule",
  model:         "Model",
  deployment:    "Deployment",
  case:          "Case",
  event:         "Event",
  analysis:      "Analysis",
  license:       "License",
  "data-access": "Data Access",
};

export const ACTIVITY_KIND_STYLES: Record<ActivityKind, { bg: string; text: string }> = {
  auth:          { bg: "bg-info/15",      text: "text-info" },
  user:          { bg: "bg-success/15",   text: "text-success" },
  config:        { bg: "bg-purple-soft",  text: "text-purple" },
  site:          { bg: "bg-info/15",      text: "text-info" },
  camera:        { bg: "bg-info/15",      text: "text-info" },
  rule:          { bg: "bg-purple-soft",  text: "text-purple" },
  model:         { bg: "bg-info/15",      text: "text-info" },
  deployment:    { bg: "bg-secondary/15", text: "text-secondary" },
  case:          { bg: "bg-warning/15",   text: "text-warning" },
  event:         { bg: "bg-warning/15",   text: "text-warning" },
  analysis:      { bg: "bg-info/15",      text: "text-info" },
  license:       { bg: "bg-success/15",   text: "text-success" },
  "data-access": { bg: "bg-muted",        text: "text-muted-foreground" },
};
