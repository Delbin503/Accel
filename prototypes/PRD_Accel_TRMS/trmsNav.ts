import { BellRing, Cctv, LayoutDashboard, Video } from "lucide-react";
import type { NavGroup } from "@/components/layout/AppSidebar";

/* TRMS's own nav — the four screens the product has, not the site-security
   app's menu. Paths are this prototype's routes. */

export const TRMS_NAV: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Live Monitoring", href: "/live", icon: Video },
      { label: "Alert Log", href: "/alerts", icon: BellRing },
    ],
  },
  {
    label: "Manage",
    items: [{ label: "Devices", href: "/devices", icon: Cctv }],
  },
];

/** Breadcrumb trail per route. */
export const TRMS_TRAILS: Record<string, string[]> = {
  "/": ["Accel", "Dashboard"],
  "/live": ["Accel", "Live Monitoring"],
  "/alerts": ["Accel", "Alert Log"],
  "/devices": ["Accel", "Devices"],
};
