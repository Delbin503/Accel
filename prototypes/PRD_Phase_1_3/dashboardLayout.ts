import {
  Activity,
  BarChart3,
  FolderOpen,
  Gauge,
  LineChart,
  MapPin,
  MapPinned,
  ScrollText,
  Users,
  type LucideIcon,
} from "lucide-react";

/* The customizable dashboard's layout model.

   A layout is just the ordered list of panels on show. Anything not in it is
   hidden and waits in the edit drawer — there is no separate "hidden" list to
   keep in sync, so a panel can never be both shown and hidden. */

export type PanelId =
  | "status"
  | "visitors"
  | "reid-map"
  | "detections"
  | "zones"
  | "recent-detections"
  | "cases"
  | "cameras-by-site"
  | "activity";

export interface PanelDef {
  id: PanelId;
  title: string;
  /** One line for the drawer, so a hidden panel is recognisable without its content. */
  description: string;
  /** Full-width panels span both columns; half-width ones pair up side by side. */
  width: "full" | "half";
  icon: LucideIcon;
}

export const PANELS: PanelDef[] = [
  { id: "status",            title: "Live Status & Period",    width: "full", icon: Gauge,      description: "Sites, cameras and NVRs online, plus events and open cases for the range." },
  { id: "visitors",          title: "Visitor Counts",          width: "full", icon: Users,      description: "Visitors inside, entries and exits, gender, age group and race." },
  { id: "reid-map",          title: "Re-ID Map",               width: "full", icon: MapPinned,  description: "The Re-ID mini map from Live Monitoring, with the people and weapons inside it." },
  { id: "detections",        title: "Detections by Site",      width: "full", icon: LineChart,  description: "Detection trend per site with a severity breakdown." },
  { id: "zones",             title: "Zone Areas",              width: "full", icon: MapPin,     description: "Incidents per zone, with the cameras that caught them." },
  { id: "recent-detections", title: "Recent Detections",       width: "half", icon: Activity,   description: "The latest AI-detected events." },
  { id: "cases",             title: "Incident Cases",          width: "half", icon: FolderOpen, description: "The newest cases and their severity." },
  { id: "cameras-by-site",   title: "Cameras by Site",         width: "half", icon: BarChart3,  description: "Online and offline cameras at each site." },
  { id: "activity",          title: "Recent Activity Log",     width: "half", icon: ScrollText, description: "Who did what across the workspace." },
];

export const DEFAULT_LAYOUT: PanelId[] = PANELS.map((p) => p.id);

export function panelDef(id: PanelId): PanelDef {
  return PANELS.find((p) => p.id === id) ?? PANELS[0];
}

export function isPanelId(v: unknown): v is PanelId {
  return typeof v === "string" && PANELS.some((p) => p.id === v);
}

/** Hidden panels, in their default order — the drawer's list. */
export function hiddenPanels(layout: PanelId[]): PanelId[] {
  return DEFAULT_LAYOUT.filter((id) => !layout.includes(id));
}

/**
 * Moves `id` next to `target`, or to the end when `target` is null. Works for a
 * panel already on the dashboard (a reorder) and one coming out of the drawer
 * (an insert) alike, because both are "take it out, put it back here".
 */
export function placePanel(
  layout: PanelId[],
  id: PanelId,
  target: PanelId | null,
  side: "before" | "after"
): PanelId[] {
  // Dropped onto itself — nothing moves.
  if (target === id) return layout;
  const without = layout.filter((p) => p !== id);
  if (target === null) return [...without, id];
  const at = without.indexOf(target);
  if (at === -1) return [...without, id];
  const index = side === "before" ? at : at + 1;
  return [...without.slice(0, index), id, ...without.slice(index)];
}

/** Nudges a panel one place, for the keyboard and the move buttons. */
export function shiftPanel(layout: PanelId[], id: PanelId, delta: -1 | 1): PanelId[] {
  const i = layout.indexOf(id);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= layout.length) return layout;
  const next = [...layout];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/* ── Persistence ─────────────────────────────────────────────────────────
   A per-viewer convenience, so it lives in browser storage. Storage can be
   unavailable (private window, blocked site data), and a stored layout can go
   stale when panels are renamed — both fall back to the default. */

const STORAGE_KEY = "accel-p13-dashboard-layout";
/** Panels the viewer's saved layout already knew about. */
const KNOWN_KEY = "accel-p13-dashboard-known";

/**
 * A panel added after a layout was saved goes in at its default place, rather
 * than waiting in the drawer as if the viewer had removed it. Layouts saved
 * before panels were tracked count as knowing all of today's panels except
 * the ones added since — currently the Re-ID map.
 */
function withNewPanels(layout: PanelId[]): PanelId[] {
  let known: PanelId[];
  try {
    const raw = window.localStorage.getItem(KNOWN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    known = Array.isArray(parsed) ? parsed.filter(isPanelId) : DEFAULT_LAYOUT.filter((id) => id !== "reid-map");
  } catch {
    known = DEFAULT_LAYOUT;
  }
  let next = layout;
  for (const id of DEFAULT_LAYOUT) {
    if (known.includes(id) || next.includes(id)) continue;
    const before = DEFAULT_LAYOUT.slice(0, DEFAULT_LAYOUT.indexOf(id)).reverse().find((p) => next.includes(p)) ?? null;
    next = before ? placePanel(next, id, before, "after") : [id, ...next];
  }
  try {
    window.localStorage.setItem(KNOWN_KEY, JSON.stringify(DEFAULT_LAYOUT));
  } catch {
    // Storage blocked — new panels are simply offered again next visit.
  }
  return next;
}

export function loadLayout(): PanelId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_LAYOUT;
    // Drop unknown or duplicated ids rather than rejecting the whole layout.
    const stored = [...new Set(parsed.filter(isPanelId))];
    const next = withNewPanels(stored);
    // Keep the added panel, or the next visit would treat it as removed.
    if (next.length !== stored.length) saveLayout(next);
    return next;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayout(layout: PanelId[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Storage blocked — the layout still works for this visit.
  }
}
