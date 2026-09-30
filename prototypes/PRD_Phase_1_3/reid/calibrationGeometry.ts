/* Re-ID camera calibration — prototype geometry.

   Stands in for the calibration service. The site has one marker map: every
   ArUco marker sits at a fixed floor position (metres from the site origin),
   shared by every camera. Each camera stands somewhere on the floor looking
   in, and sees the markers inside its field of view — so cameras that look at
   the same patch of floor share markers, and those shared markers are what
   link their zones into one map.

   Auto-place fits the markers a camera sees; every run is a fresh fit, so
   re-running changes which markers come out as outliers. Everything is seeded
   from ids (and the run number), so results are stable and reproducible. */

export const MARKER_IDS = Array.from({ length: 20 }, (_, i) => `A${String(i).padStart(2, "0")}`);

/** A marker whose fit error is above this is an outlier and is dropped. */
export const OUTLIER_CM = 12;

/** Cameras sharing at least this many used markers join one map frame. */
export const LINK_MARKERS = 2;

export interface SiteMarker {
  id: string;
  /** Floor position, metres from the site origin. */
  x: number;
  y: number;
  /** 4×4 ArUco-style bit pattern. */
  bits: boolean[];
}

export interface SceneMarker extends SiteMarker {
  /** Position in this camera's frame, 0..1. */
  u: number;
  v: number;
  /** Printed size in the frame (viewBox px) — nearer markers read bigger. */
  size: number;
  rot: number;
}

export interface CameraPose {
  /** Floor position of the camera, metres. */
  x: number;
  y: number;
  /** Unit vector the camera looks along, on the floor. */
  dx: number;
  dy: number;
}

export type Verdict = "good" | "usable" | "poor";

export interface Placement {
  run: number;
  /** Marker id → fit error (cm). */
  errors: Record<string, number>;
  used: string[];
  dropped: string[];
  /** Zone outline in the camera frame — the markers the boundary passes through. */
  boundary: string[];
  rmse: number;
  worst: number;
  verdict: Verdict;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small seeded PRNG, 0..1. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp;

/* ── Site marker map ─────────────────────────────────────────────────── */

/** The site's markers, spread over roughly 10 × 9 m around the origin. */
export const SITE_MARKERS: SiteMarker[] = (() => {
  const r = rng(hash("site-marker-map"));
  const out: SiteMarker[] = [];
  for (const id of MARKER_IDS) {
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 60; attempt++) {
      x = (r() * 2 - 1) * 5;
      y = -2.5 + r() * 9;
      if (out.every((m) => Math.hypot(m.x - x, m.y - y) > 1.3)) break;
    }
    const bitsRng = rng(hash(id));
    out.push({ id, x: round(x, 3), y: round(y, 3), bits: Array.from({ length: 16 }, () => bitsRng() > 0.5) });
  }
  return out;
})();

const SITE_CENTRE = { x: 0, y: 2 };

/* ── Cameras ─────────────────────────────────────────────────────────── */

/** Where a camera stands and which way it looks — on the site's edge, facing its own side. */
export function cameraPose(cameraId: string): CameraPose {
  const r = rng(hash(`pose:${cameraId}`));
  const angle = r() * Math.PI * 2;
  const x = SITE_CENTRE.x + Math.cos(angle) * 6.5;
  const y = SITE_CENTRE.y + Math.sin(angle) * 5.5;
  // Look at the floor on this camera's own side of the site, not its centre —
  // neighbours overlap at the edges (enough to link) instead of piling up.
  const tx = SITE_CENTRE.x + (x - SITE_CENTRE.x) * 0.4;
  const ty = SITE_CENTRE.y + (y - SITE_CENTRE.y) * 0.4;
  const look = Math.atan2(ty - y, tx - x) + (r() * 2 - 1) * 0.35;
  return { x: round(x, 2), y: round(y, 2), dx: Math.cos(look), dy: Math.sin(look) };
}

const NEAR_M = 1;
const FAR_M = 7;

/** The markers a camera sees, projected into its frame. Widens the view until at least 5 are in. */
export function sceneMarkers(cameraId: string): SceneMarker[] {
  const pose = cameraPose(cameraId);
  const r = rng(hash(`frame:${cameraId}`));
  for (const halfFov of [0.62, 0.8, 1.0, 1.25]) {
    const tan = Math.tan(halfFov);
    const seen: SceneMarker[] = [];
    for (const m of SITE_MARKERS) {
      const ox = m.x - pose.x;
      const oy = m.y - pose.y;
      const d = ox * pose.dx + oy * pose.dy; // forward
      const l = ox * -pose.dy + oy * pose.dx; // left of centre
      if (d < NEAR_M || d > FAR_M || Math.abs(l) > d * tan) continue;
      const depth = (d - NEAR_M) / (FAR_M - NEAR_M); // 0 near … 1 far
      seen.push({
        ...m,
        u: 0.5 - (l / (d * tan)) * 0.44,
        v: 0.94 - Math.pow(depth, 0.7) * 0.52,
        size: 56 - depth * 32,
        rot: (r() * 2 - 1) * 18,
      });
    }
    if (seen.length >= 5 || halfFov === 1.25) return seen;
  }
  return [];
}

/* ── Fit ─────────────────────────────────────────────────────────────── */

interface Pt {
  id: string;
  px: number;
  py: number;
}

/* Andrew's monotone chain. */
function hull(points: Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.px - b.px || a.py - b.py);
  if (pts.length < 3) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) => (a.px - o.px) * (b.py - o.py) - (a.py - o.py) * (b.px - o.px);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** One auto-place run: fit every marker, drop outliers, outline the zone. */
export function autoPlace(cameraId: string, markers: SceneMarker[], run: number): Placement {
  const r = rng(hash(`${cameraId}:${run}`));
  const errors: Record<string, number> = {};
  for (const m of markers) {
    const outlier = r() < 0.17;
    errors[m.id] = round(outlier ? 15 + r() * 180 : 0.3 + r() * r() * 6.5, 1);
  }
  const usedMarkers = markers.filter((m) => errors[m.id] < OUTLIER_CM);
  const used = usedMarkers.map((m) => m.id);
  const dropped = markers.filter((m) => errors[m.id] >= OUTLIER_CM).map((m) => m.id);
  const usedErrors = used.map((id) => errors[id]);
  const rmse = usedErrors.length ? round(Math.sqrt(usedErrors.reduce((s, e) => s + e * e, 0) / usedErrors.length), 1) : 0;
  const worst = usedErrors.length ? Math.max(...usedErrors) : 0;
  const verdict: Verdict =
    used.length < 3 ? "poor" : rmse < 3 && worst < 6 ? "good" : rmse < 10 ? "usable" : "poor";
  const boundary = hull(usedMarkers.map((m) => ({ id: m.id, px: m.u, py: m.v }))).map((p) => p.id);
  return { run, errors, used, dropped, boundary, rmse, worst, verdict };
}

/** Bounding box of the zone in the frame, normalised — what a deployment stores. */
export function zoneBox(markers: SceneMarker[], ids: string[]): [number, number, number, number] {
  const pts = markers.filter((m) => ids.includes(m.id));
  const us = pts.map((p) => p.u);
  const vs = pts.map((p) => p.v);
  return [round(Math.min(...us), 3), round(Math.min(...vs), 3), round(Math.max(...us), 3), round(Math.max(...vs), 3)];
}

/* ── Site map ────────────────────────────────────────────────────────── */

/** A camera's zone on the floor plan — the used markers' hull, in metres. */
export function floorZone(used: string[]): SiteMarker[] {
  const byId = new Map(SITE_MARKERS.map((m) => [m.id, m]));
  const pts = used.map((id) => byId.get(id)).filter((m): m is SiteMarker => !!m);
  const order = hull(pts.map((m) => ({ id: m.id, px: m.x, py: m.y }))).map((p) => p.id);
  return order.map((id) => byId.get(id)).filter((m): m is SiteMarker => !!m);
}

/** Cameras linked through ≥ LINK_MARKERS shared markers form one map frame. */
export function mapGroups(usedByCamera: Record<string, string[]>): string[][] {
  const ids = Object.keys(usedByCamera);
  const parent = new Map(ids.map((id) => [id, id]));
  const find = (id: string): string => {
    const p = parent.get(id) ?? id;
    return p === id ? id : find(p);
  };
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const shared = usedByCamera[ids[i]].filter((m) => usedByCamera[ids[j]].includes(m)).length;
      if (shared >= LINK_MARKERS) parent.set(find(ids[i]), find(ids[j]));
    }
  }
  const groups = new Map<string, string[]>();
  for (const id of ids) {
    const root = find(id);
    groups.set(root, [...(groups.get(root) ?? []), id]);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length);
}
