import { Brain, Cpu, Video } from "lucide-react";
import type { NavGroup } from "@/components/layout/AppSidebar";
import { ReidLiveMonitoring } from "./ReidLiveMonitoring";
import { ReidModelManagement } from "./ReidModelManagement";
import { ReidModelDeployment } from "./ReidModelDeployment";

/* Model (Re-ID) Module — kept apart from the other Phase 1.3 proposals.

   Everything lives under /reid. While you're inside it the sidebar swaps to
   the module's own navigation below, so the three pages link to each other
   and never back into the Phase 1.3 pages. The Phase 1.3 breadcrumb is the
   way out. */

export const REID_PATH = "/reid";
export const REID_TITLE = "Model (Re-ID) Module";

export const REID_PAGES = [
  { path: "/reid/live", title: "Live Monitoring", icon: Video, Component: ReidLiveMonitoring },
  { path: "/reid/models", title: "Model Management", icon: Brain, Component: ReidModelManagement },
  { path: "/reid/deployment", title: "Model Deployment", icon: Cpu, Component: ReidModelDeployment },
] as const;

export const REID_NAV: NavGroup[] = [
  {
    label: "Model (Re-ID)",
    items: REID_PAGES.map((p) => ({ label: p.title, href: p.path, icon: p.icon })),
  },
];

export const isReidPath = (pathname: string) => pathname === REID_PATH || pathname.startsWith(`${REID_PATH}/`);
