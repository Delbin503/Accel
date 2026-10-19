/* PROTOTYPE-ONLY. The Phase 1 modules are separate prototypes, each with its own
   MemoryRouter, but they are reviewed as one app ("Phase 1 dashboard"). This map
   says which prototype owns each app route, so a link from one module (the
   dashboard's "View feed", a detection's "Open case"…) opens the module that
   has that page, on that page. */

/** App route prefix → prototype folder. Longest prefix wins; "/" matches only itself. */
const PHASE_ONE_ROUTES: [string, string][] = [
  ["/", "PRD_Dashboard"],
  ["/live", "PRD_Live_Monitoring"],
  ["/recordings", "PRD_Recordings"],
  ["/detection-feed", "PRD_Detection_Feed"],
  ["/site", "PRD_Site_Management"],
  ["/site/cameras", "PRD_Cameras"],
  ["/site/nvr", "PRD_NVR_Devices"],
  ["/models", "PRD_Model_Management"],
  ["/rules", "PRD_Rule_Library"],
  ["/incidents", "PRD_Incident_Cases"],
  ["/analysis", "PRD_Run_Analysis"],
  ["/deployment", "PRD_Model_Deployment"],
  ["/users", "PRD_User_Management"],
  ["/device-health", "PRD_Device_Health"],
  ["/config", "PRD_System_Configuration"],
  ["/activity-logs", "PRD_Activity_Logs"],
  ["/profile", "PRD_Profile_Settings"],
  ["/settings", "PRD_Profile_Settings"],
  ["/system-info", "PRD_Profile_Settings"],
  ["/billing", "PRD_Billing"],
];

/** The prototype that owns an app route, if any. */
export function prototypeFor(pathname: string): string | undefined {
  let best: [string, string] | undefined;
  for (const route of PHASE_ONE_ROUTES) {
    const [prefix] = route;
    const match = prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(prefix + "/");
    if (match && (!best || prefix.length > best[0].length)) best = route;
  }
  return best?.[1];
}

/** The prototype folder this page was loaded from, e.g. "PRD_Dashboard". */
export function currentPrototype(): string {
  return window.location.pathname.split("/")[1] ?? "";
}

/** Where a prototype's router starts: the `?p=` route a handoff passed in, or its own default. */
export function protoStart(fallback: string): string {
  const p = new URLSearchParams(window.location.search).get("p");
  return p && p.startsWith("/") ? p : fallback;
}
