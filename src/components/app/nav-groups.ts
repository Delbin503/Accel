import type * as React from "react";
import {
  LayoutDashboard,
  Video,
  Cctv,
  Film,
  AlertTriangle,
  MapPin,
  Building2,
  Brain,
  BookOpen,
  FolderOpen,
  PlayCircle,
  Cpu,
  HardDrive,
  Users,
  HeartPulse,
  Settings,
  ScrollText,
} from "lucide-react";

/* ─── Nav data ──────────────────────────────────────────────────────────── */

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Live Monitoring", href: "/live", icon: Video },
      { label: "Recordings", href: "/recordings", icon: Film },
      { label: "Detection Feed", href: "/detection-feed", icon: AlertTriangle },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        label: "Site",
        href: "/site",
        icon: MapPin,
        children: [
          { label: "Site Management", href: "/site/overview", icon: Building2 },
          { label: "Cameras", href: "/site/cameras", icon: Cctv },
          { label: "NVR Devices", href: "/site/nvr", icon: HardDrive },
        ],
      },
      { label: "Model Management", href: "/models", icon: Brain },
      { label: "Rules Library", href: "/rules", icon: BookOpen },
      { label: "Incident Cases", href: "/incidents", icon: FolderOpen },
    ],
  },
  {
    label: "Deploy",
    items: [
      { label: "Run Analysis", href: "/analysis", icon: PlayCircle },
      { label: "Model Deployment", href: "/deployment", icon: Cpu },
    ],
  },
  {
    label: "System",
    items: [
      { label: "User Management", href: "/users", icon: Users },
      { label: "Device Health", href: "/device-health", icon: HeartPulse },
      { label: "System Configuration", href: "/config", icon: Settings },
      { label: "Activity Logs", href: "/activity-logs", icon: ScrollText },
    ],
  },
];
