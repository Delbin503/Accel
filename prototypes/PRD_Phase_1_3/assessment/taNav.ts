import { ClipboardCheck, Radio } from "lucide-react";
import { NAV_GROUPS, type NavGroup, type NavItem } from "@/components/layout/AppSidebar";

/* Training Assessment module — kept apart from the other Phase 1.3 proposals
   and from the Re-ID module, the same way the Re-ID module is.

   Everything lives under /assessment. While you're inside it the sidebar is
   the app's own, plus two entries the module adds: Site › External Devices
   and Assessment › Assessment Sessions. The entries the module covers open
   its pages; every other entry opens a "not part of this module" page that
   stays under /assessment. Pages are registered in index.tsx (TA_PAGES there
   would import every page into this file, and the pages import from here). */

export const TA_PATH = "/assessment";
export const TA_TITLE = "Training Assessment Module";

export const TA_ROUTES = {
  dashboard: "/assessment/dashboard",
  sessions: "/assessment/sessions",
  models: "/assessment/models",
  deployment: "/assessment/deployment",
  devices: "/assessment/site/external-devices",
  config: "/assessment/config",
} as const;

/** A session's result details — the group view — opened from Results or a live session (?session=). */
export const TA_RESULT_PATH = "/assessment/sessions/result";

/** One golfer's full swing analysis (the Phase 1.3 golf dashboard), opened from Results. */
export const TA_GOLF_ANALYSIS_PATH = "/assessment/sessions/swing-analysis";
/** One lifter's full lift analysis, opened from Results. */
export const TA_GYM_ANALYSIS_PATH = "/assessment/sessions/lift-analysis";
/** One patient's full rehab analysis, opened from Results. */
export const TA_PHYSIO_ANALYSIS_PATH = "/assessment/sessions/rehab-analysis";

/** Each use case's individual result dashboard, and what the breadcrumb calls it. */
export const TA_ANALYSIS = {
  golf: { path: TA_GOLF_ANALYSIS_PATH, label: "Swing Analysis" },
  gym: { path: TA_GYM_ANALYSIS_PATH, label: "Lift Analysis" },
  physio: { path: TA_PHYSIO_ANALYSIS_PATH, label: "Rehab Analysis" },
} as const;

/** Where sidebar entries the module does not cover land. */
export const TA_OTHER_PATH = `${TA_PATH}/other`;

/** App routes the module has its own page for. */
const MODULE_HREFS: Record<string, string> = {
  "/": TA_ROUTES.dashboard,
  "/models": TA_ROUTES.models,
  "/deployment": TA_ROUTES.deployment,
  "/config": TA_ROUTES.config,
};

/** An app link, kept inside the module: its own page where it has one, the placeholder otherwise. */
export function intoTa(href: string): string {
  const [path, query] = href.split("?");
  if (path === TA_PATH || path.startsWith(`${TA_PATH}/`)) return href;
  const target = MODULE_HREFS[path] ?? `${TA_OTHER_PATH}${path === "/" ? "/dashboard" : path}`;
  return query ? `${target}?${query}` : target;
}

function intoModule(item: NavItem): NavItem {
  const children = item.children?.map(intoModule);
  /* Site gains External Devices, after NVR Devices. */
  if (item.href === "/site" && children) {
    children.push({ label: "External Devices", href: TA_ROUTES.devices, icon: Radio });
  }
  return { ...item, href: item.children ? `${TA_OTHER_PATH}${item.href}` : intoTa(item.href), children };
}

/** The app's sidebar with the module's two additions, every link kept inside the module. */
export const TA_NAV: NavGroup[] = (() => {
  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.map(intoModule) }));
  /* Performance & Posture sits under Manage, right after Incident Cases. */
  const manage = groups.find((g) => g.label === "Manage");
  if (manage) {
    const at = manage.items.findIndex((i) => i.label === "Incident Cases") + 1 || manage.items.length;
    manage.items.splice(at, 0, { label: "Performance & Posture", href: TA_ROUTES.sessions, icon: ClipboardCheck });
  }
  return groups;
})();

/** The sidebar label for a path under the module, for the header and the placeholder page. */
export function taNavLabel(pathname: string): string | undefined {
  const flat = TA_NAV.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
  return flat.find((i) => i.href === pathname)?.label;
}

export const isTaPath = (pathname: string) => pathname === TA_PATH || pathname.startsWith(`${TA_PATH}/`);
