import { create } from "zustand";
import { autoPlace, mapGroups, sceneMarkers } from "./calibrationGeometry";

/* Re-ID maps — one per linked camera group of a Re-ID deployment.

   Deploying a Re-ID model (the calibration screen's Deploy → Confirm) adds a
   map here for each linked group of cameras; Live Monitoring reads them for
   the Tracking panel. A camera sits on one Re-ID map at a time, so a new
   deployment takes its cameras off whatever map had them before.

   Weapon tracks are simulated: each carries a route through its map's
   cameras, and weaponTracks.ts walks it in real time. */

export interface WeaponTrack {
  /** Re-ID track id, e.g. "W-01". */
  id: string;
  /** Registered weapon, or null when the track matched nothing on the register. */
  weapon: string | null;
  /** Cameras the track walks through, in order — it loops back to the first. */
  route: string[];
  /** Start offset (s) so tracks sharing a map don't move in step. */
  phase: number;
}

export interface ReidMap {
  id: string;
  name: string;
  siteName: string;
  modelName: string;
  cameraIds: string[];
  /** Marker ids each camera's zone was built from (its saved calibration). */
  used: Record<string, string[]>;
  tracks: WeaponTrack[];
}

/** A camera's first non-poor auto-place — stands in for a saved calibration. */
function seedUsed(cameraId: string): string[] {
  const markers = sceneMarkers(cameraId);
  for (let run = 1; run <= 8; run++) {
    const p = autoPlace(cameraId, markers, run);
    if (p.verdict !== "poor") return p.used;
  }
  return markers.map((m) => m.id);
}

function seedMap(id: string, name: string, siteName: string, cameraIds: string[], tracks: WeaponTrack[]): ReidMap {
  return {
    id,
    name,
    siteName,
    modelName: "Person Re-ID",
    cameraIds,
    used: Object.fromEntries(cameraIds.map((c) => [c, seedUsed(c)])),
    tracks,
  };
}

const SEED: ReidMap[] = [
  seedMap("map-lobby", "Lobby map", "Astra HQ", ["Cam-01", "Cam-18", "Cam-22"], [
    { id: "W-01", weapon: "SAR21 #A-0421", route: ["Cam-01", "Cam-18", "Cam-22"], phase: 0 },
    { id: "W-03", weapon: null, route: ["Cam-22", "Cam-18"], phase: 17 },
  ]),
  seedMap("map-loading", "Loading map", "FedEx Changi", ["Cam-04", "Cam-07"], [
    { id: "W-02", weapon: "SAR21 #A-0417", route: ["Cam-04", "Cam-07"], phase: 6 },
  ]),
  seedMap("map-armoury", "Armoury map", "Sembawang Naval", ["Cam-09", "Cam-12"], []),
];

interface ReidMapsState {
  maps: ReidMap[];
  /** Adds the maps a Re-ID deployment produced — one per linked camera group. */
  addDeployment: (input: { siteName: string; modelName: string; usedByCamera: Record<string, string[]> }) => ReidMap[];
}

export const useReidMapsStore = create<ReidMapsState>((set, get) => ({
  maps: SEED,
  addDeployment: ({ siteName, modelName, usedByCamera }) => {
    const groups = mapGroups(usedByCamera);
    const deployed = new Set(Object.keys(usedByCamera));
    const prev = get().maps;
    const nextTrackNo = () =>
      Math.max(0, ...prev.flatMap((m) => m.tracks.map((t) => Number(t.id.slice(2)) || 0))) + 1;

    const added: ReidMap[] = groups.map((cameraIds, i) => {
      const inGroup = new Set(cameraIds);
      // Tracks from replaced maps carry over when their whole route is in this group.
      const inherited = prev
        .flatMap((m) => m.tracks)
        .filter((t) => t.route.every((c) => inGroup.has(c)));
      const tracks: WeaponTrack[] = inherited.length
        ? inherited
        : cameraIds.length > 1
          ? [{ id: `W-${String(nextTrackNo() + i).padStart(2, "0")}`, weapon: null, route: cameraIds, phase: 0 }]
          : [];
      return {
        id: `map-${Date.now().toString(36)}-${i}`,
        name: groups.length > 1 ? `${modelName} map ${i + 1}` : `${modelName} map`,
        siteName,
        modelName,
        cameraIds,
        used: Object.fromEntries(cameraIds.map((c) => [c, usedByCamera[c]])),
        tracks,
      };
    });

    // One map per camera: drop the deployed cameras (and tracks through them) from older maps.
    const kept = prev
      .map((m) => {
        const cameraIds = m.cameraIds.filter((c) => !deployed.has(c));
        return {
          ...m,
          cameraIds,
          used: Object.fromEntries(cameraIds.map((c) => [c, m.used[c]])),
          tracks: m.tracks.filter((t) => t.route.every((c) => cameraIds.includes(c))),
        };
      })
      .filter((m) => m.cameraIds.length > 0);

    set({ maps: [...added, ...kept] });
    return added;
  },
}));

export const mapLabel = (m: ReidMap) => `${m.siteName} · ${m.name}`;

export function mapForCamera(maps: ReidMap[], cameraId: string): ReidMap | null {
  return maps.find((m) => m.cameraIds.includes(cameraId)) ?? null;
}
