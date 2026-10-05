import { Brain, Cpu, TriangleAlert, Video } from "lucide-react";
import { NAV_GROUPS, type NavGroup, type NavItem } from "@/components/layout/AppSidebar";
import DetectionFeedPage from "@/pages/detection-feed";
import { ReidLiveMonitoring } from "./ReidLiveMonitoring";
import { ReidModelManagement } from "./ReidModelManagement";
import { ReidModelDeployment } from "./ReidModelDeployment";

/* Model (Re-ID) Module — kept apart from the other Phase 1.3 proposals.

   Everything lives under /reid. While you're inside it the sidebar is the
   app's own, exactly as on the main dashboard, so the module reads as part of
   the product rather than a standalone demo. The four entries the module
   covers open its pages; every other entry opens a "not part of this module"
   page that stays under /reid, so nothing leaks into the Phase 1.3 proposals. */

export const REID_PATH = "/reid";
export const REID_TITLE = "Model (Re-ID) Module";

export const REID_PAGES = [
  { path: "/reid/live", title: "Live Monitoring", icon: Video, Component: ReidLiveMonitoring },
  /* The app's own Detection Feed — a live detection opens its event drawer here (?event=<id>). */
  { path: "/reid/detections", title: "Detection Feed", icon: TriangleAlert, Component: DetectionFeedPage },
  { path: "/reid/models", title: "Model Management", icon: Brain, Component: ReidModelManagement },
  { path: "/reid/deployment", title: "Model Deployment", icon: Cpu, Component: ReidModelDeployment },
] as const;

/** Where sidebar entries the module does not cover land. */
export const REID_OTHER_PATH = `${REID_PATH}/other`;

/** App routes the module has its own page for. */
const MODULE_HREFS: Record<string, string> = {
  "/live": "/reid/live",
  "/detection-feed": "/reid/detections",
  "/models": "/reid/models",
  "/deployment": "/reid/deployment",
};

function intoModule(item: NavItem): NavItem {
  return {
    ...item,
    href: MODULE_HREFS[item.href] ?? `${REID_OTHER_PATH}${item.href === "/" ? "/dashboard" : item.href}`,
    children: item.children?.map(intoModule),
  };
}

/** The app's sidebar, group for group, with every link kept inside the module. */
export const REID_NAV: NavGroup[] = NAV_GROUPS.map((group) => ({
  ...group,
  items: group.items.map(intoModule),
}));

/** The sidebar label for a path under the module, for the header and the placeholder page. */
export function reidNavLabel(pathname: string): string | undefined {
  const flat = REID_NAV.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
  return flat.find((i) => i.href === pathname)?.label;
}

export const isReidPath = (pathname: string) => pathname === REID_PATH || pathname.startsWith(`${REID_PATH}/`);
