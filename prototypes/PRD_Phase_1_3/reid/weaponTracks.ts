import { floorZone, type SiteMarker } from "./calibrationGeometry";
import type { ReidMap, WeaponTrack } from "./reidMaps";

/* Weapon tracks — prototype simulation.

   A track walks its route at a steady pace: from the middle of one camera's
   floor zone to the next, looping. Which camera "has" the weapon is whichever
   zone it's standing in; where two zones overlap, the one whose middle is
   nearest wins, so a handoff happens once, not back and forth. Everything is
   a function of the clock, so every view agrees on where a weapon is. */

/** Walking pace, metres per second. */
const SPEED = 0.18;
/** How much trail to keep, seconds. */
export const TRAIL_SEC = 30;
/** A weapon must stay in a camera this long before the main camera follows it. */
export const HOLD_SEC = 1.5;

export interface Point {
  x: number;
  y: number;
}

export interface TrackState {
  track: WeaponTrack;
  mapId: string;
  pos: Point;
  /** The camera whose zone the weapon is in now — null between zones. */
  cameraId: string | null;
  /** The camera it was last in (same as cameraId while it's in one). */
  lastCameraId: string | null;
  /** Seconds in the current camera, or since it left the last one. */
  sinceSec: number;
  trail: Point[];
}

export function zonesFor(map: ReidMap): Record<string, SiteMarker[]> {
  return Object.fromEntries(map.cameraIds.map((c) => [c, floorZone(map.used[c] ?? [])]));
}

const centroid = (pts: Point[]): Point => ({
  x: pts.reduce((s, p) => s + p.x, 0) / Math.max(1, pts.length),
  y: pts.reduce((s, p) => s + p.y, 0) / Math.max(1, pts.length),
});

function inside(p: Point, poly: Point[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
}

interface Walk {
  points: Point[];
  lengths: number[];
  total: number;
}

function walkFor(track: WeaponTrack, zones: Record<string, SiteMarker[]>): Walk | null {
  const stops = track.route.map((c) => zones[c]).filter((z) => z && z.length >= 3).map(centroid);
  if (stops.length < 2) return null;
  const points = [...stops, stops[0]];
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  return { points, lengths, total: lengths.reduce((s, l) => s + l, 0) };
}

function positionAt(walk: Walk, t: number): Point {
  let d = ((t * SPEED) % walk.total + walk.total) % walk.total;
  for (let i = 0; i < walk.lengths.length; i++) {
    if (d <= walk.lengths[i]) {
      const f = walk.lengths[i] === 0 ? 0 : d / walk.lengths[i];
      const a = walk.points[i];
      const b = walk.points[i + 1];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    d -= walk.lengths[i];
  }
  return walk.points[0];
}

function cameraAt(p: Point, zones: Record<string, SiteMarker[]>): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const [cam, zone] of Object.entries(zones)) {
    if (zone.length < 3 || !inside(p, zone)) continue;
    const c = centroid(zone);
    const d = Math.hypot(c.x - p.x, c.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = cam;
    }
  }
  return best;
}

/** Where every track on a map is at time `nowSec` (Unix seconds). */
export function mapTrackStates(map: ReidMap, nowSec: number): TrackState[] {
  const zones = zonesFor(map);
  const out: TrackState[] = [];
  for (const track of map.tracks) {
    const walk = walkFor(track, zones);
    if (!walk) continue;
    const t = nowSec + track.phase;
    const pos = positionAt(walk, t);
    const cameraId = cameraAt(pos, zones);

    // Step back in time to find how long it's been here, and where it was last.
    let lastCameraId = cameraId;
    let sinceSec = 0;
    for (let back = 0.5; back <= 120; back += 0.5) {
      const cam = cameraAt(positionAt(walk, t - back), zones);
      if (cameraId ? cam !== cameraId : cam !== null) {
        if (!cameraId) lastCameraId = cam;
        break;
      }
      sinceSec = back;
    }

    const trail: Point[] = [];
    for (let back = TRAIL_SEC; back >= 0; back -= 1) trail.push(positionAt(walk, t - back));
    out.push({ track, mapId: map.id, pos, cameraId, lastCameraId, sinceSec, trail });
  }
  return out;
}

export function allTrackStates(maps: ReidMap[], nowSec: number): TrackState[] {
  return maps.flatMap((m) => mapTrackStates(m, nowSec));
}

const fmtAgo = (s: number) => (s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min`);

/** "Cam-18 · 12 s in view" / "Last seen Cam-22 · 18 s ago". */
export function trackWhere(st: TrackState): string {
  if (st.cameraId) return `${st.cameraId} · ${fmtAgo(st.sinceSec)} in view`;
  return st.lastCameraId ? `Last seen ${st.lastCameraId} · ${fmtAgo(st.sinceSec)} ago` : "Not seen yet";
}
