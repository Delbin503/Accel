import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Ban,
  BookOpen,
  Brain,
  Building2,
  Cctv,
  Cpu,
  CreditCard,
  FolderOpen,
  HardDrive,
  HeartPulse,
  Info,
  LayoutDashboard,
  MapPin,
  PlayCircle,
  Plus,
  ScrollText,
  Settings,
  Shapes,
  UserPlus,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import type { UserRole } from "@/stores/useAuthStore";

/**
 * Single source of truth for everything the ⌘K palette can *do* (as opposed to
 * find). The palette, the pinned Quick Actions row and role-gating all read
 * this one list.
 *
 * `kind` splits the registry by cost:
 *  - "navigate" — a route change, nothing else needed.
 *  - "command"  — owns a form/modal. Until those modals are lifted to app level
 *    these land on the page that owns them; the destination page opens the
 *    modal itself where it already supports a deep link (see `state`/query).
 */
export type QuickActionKind = "navigate" | "command";

export type QuickActionGroup = "Monitor" | "Manage" | "Deploy" | "System" | "Account";

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  group: QuickActionGroup;
  kind: QuickActionKind;
  /** Route to push. Query params are how deep links are carried. */
  to: string;
  /** Router location state, for pages that open a drawer/modal from it. */
  state?: Record<string, unknown>;
  /** Extra match terms — the label alone is often not what people type. */
  keywords?: string[];
  /** Roles allowed to see this action. Omitted = everyone. */
  roles?: UserRole[];
}

const ADMIN: UserRole[] = ["owner", "admin"];

export const QUICK_ACTIONS: QuickAction[] = [
  /* ── Monitor ─────────────────────────────────────────────────────────── */
  { id: "go-dashboard", label: "Go to Dashboard", icon: LayoutDashboard, group: "Monitor", kind: "navigate", to: "/", keywords: ["home", "overview"] },
  { id: "go-live", label: "Open Live Monitoring", icon: Video, group: "Monitor", kind: "navigate", to: "/live", keywords: ["stream", "wall", "cameras live"] },
  { id: "go-recordings", label: "Browse Recordings", icon: PlayCircle, group: "Monitor", kind: "navigate", to: "/recordings", keywords: ["playback", "footage", "video"] },
  { id: "go-detections", label: "Open Detection Feed", icon: AlertTriangle, group: "Monitor", kind: "navigate", to: "/detection-feed", keywords: ["events", "alerts"] },
  { id: "go-dismissed", label: "Review Dismissed Events", icon: Ban, group: "Monitor", kind: "navigate", to: "/detection-feed/dismissed", keywords: ["false positive", "ignored"] },

  /* ── Manage ──────────────────────────────────────────────────────────── */
  { id: "go-sites", label: "Go to Site Management", icon: MapPin, group: "Manage", kind: "navigate", to: "/site/overview", keywords: ["locations", "floor plan"] },
  { id: "go-cameras", label: "Go to Cameras", icon: Cctv, group: "Manage", kind: "navigate", to: "/site/cameras", keywords: ["devices", "rtsp"] },
  { id: "go-nvr", label: "Go to NVR Devices", icon: HardDrive, group: "Manage", kind: "navigate", to: "/site/nvr", keywords: ["recorder", "storage"] },
  { id: "go-zones", label: "Go to Zones", icon: Shapes, group: "Manage", kind: "navigate", to: "/site/zones", keywords: ["areas", "boundaries"] },
  { id: "go-models", label: "Go to Model Management", icon: Brain, group: "Manage", kind: "navigate", to: "/models", keywords: ["ai", "cv", "inference"] },
  { id: "go-rules", label: "Go to Rules Library", icon: BookOpen, group: "Manage", kind: "navigate", to: "/rules", keywords: ["logic", "conditions"] },
  { id: "go-incidents", label: "Go to Incident Cases", icon: FolderOpen, group: "Manage", kind: "navigate", to: "/incidents", keywords: ["tickets", "escalations"] },

  { id: "new-rule", label: "Create Rule", icon: Plus, group: "Manage", kind: "command", to: "/rules?new=true", roles: ADMIN, keywords: ["new rule", "add rule", "builder"] },
  // Cases are only ever born from an escalated detection, so this lands on the feed.
  { id: "new-case", label: "Escalate an Event to a Case", icon: Plus, group: "Manage", kind: "command", to: "/detection-feed", keywords: ["new case", "create case", "escalate", "incident", "report"] },
  { id: "add-camera", label: "Add Camera", icon: Plus, group: "Manage", kind: "command", to: "/site/cameras", state: { openAddCamera: true }, roles: ADMIN, keywords: ["new camera", "register device", "onboard"] },

  /* ── Deploy ──────────────────────────────────────────────────────────── */
  { id: "go-analysis", label: "Go to Run Analysis", icon: PlayCircle, group: "Deploy", kind: "navigate", to: "/analysis", keywords: ["batch", "process"] },
  { id: "go-deployment", label: "Go to Model Deployment", icon: Cpu, group: "Deploy", kind: "navigate", to: "/deployment", keywords: ["assign model", "rollout"] },

  /* ── System ──────────────────────────────────────────────────────────── */
  { id: "go-users", label: "Go to User Management", icon: Users, group: "System", kind: "navigate", to: "/users", roles: ADMIN, keywords: ["team", "seats", "permissions"] },
  { id: "invite-user", label: "Invite User", icon: UserPlus, group: "System", kind: "command", to: "/users", state: { openInvite: true }, roles: ADMIN, keywords: ["add user", "new member", "seat"] },
  { id: "go-device-health", label: "Go to Device Health", icon: HeartPulse, group: "System", kind: "navigate", to: "/device-health", keywords: ["status", "offline", "uptime"] },
  { id: "go-config", label: "Go to System Configuration", icon: Settings, group: "System", kind: "navigate", to: "/config", roles: ADMIN, keywords: ["detection settings", "notifications"] },
  { id: "go-activity-logs", label: "Go to Activity Logs", icon: ScrollText, group: "System", kind: "navigate", to: "/activity-logs", roles: ADMIN, keywords: ["audit", "history"] },

  /* ── Account ─────────────────────────────────────────────────────────── */
  { id: "go-profile", label: "Open My Profile", icon: UserRound, group: "Account", kind: "navigate", to: "/profile", keywords: ["account", "me"] },
  { id: "go-settings", label: "Open Settings", icon: Settings, group: "Account", kind: "navigate", to: "/settings", keywords: ["preferences", "theme", "language"] },
  { id: "go-billing", label: "Open Billing & License", icon: CreditCard, group: "Account", kind: "navigate", to: "/billing", roles: ADMIN, keywords: ["invoice", "plan", "subscription"] },
  { id: "go-system-info", label: "Open System Info", icon: Info, group: "Account", kind: "navigate", to: "/system-info", keywords: ["version", "services", "build"] },
  { id: "go-org", label: "Go to Organization", icon: Building2, group: "Account", kind: "navigate", to: "/settings", roles: ADMIN, keywords: ["workspace", "company"] },
];

/** Defaults for a first-run user — never show an empty pinned row. */
export const DEFAULT_PINNED_IDS = ["go-detections", "go-live", "new-case", "go-device-health"];

/** Hard cap. Past ~6 a shortcut row stops being a shortcut and becomes nav. */
export const MAX_PINNED = 6;

export function actionById(id: string): QuickAction | undefined {
  return QUICK_ACTIONS.find((a) => a.id === id);
}

/** Actions the given role is allowed to see. Hidden, not see-and-fail. */
export function actionsForRole(role: UserRole | undefined): QuickAction[] {
  return QUICK_ACTIONS.filter((a) => !a.roles || (role !== undefined && a.roles.includes(role)));
}
