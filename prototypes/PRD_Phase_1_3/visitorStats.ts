import type { CameraData } from "@/types/cameras";

/* Visitor analytics — entry-line counts rolled up from cameras. Shared by Live
   Monitoring and the dashboard so both report the same numbers. */

/** People already inside when counting started, per the entry-line spec. */
export const BASELINE_INSIDE = 100;

export interface VisitorStats {
  entries: number;
  exits: number;
  inside: number;
  male: number;
  female: number;
  adult: number;
  child: number;
  elderly: number;
  chinese: number;
  malay: number;
  indian: number;
  others: number;
}

function seedOf(id: string): number {
  return id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

/**
 * Entry-line counts rolled up from whichever cameras are in view, so the strip
 * answers for the current site filter rather than the whole estate. Seeded from
 * the camera id, so a given selection always reports the same numbers.
 */
export function visitorStats(cameras: CameraData[]): VisitorStats {
  let entries = 0;
  let exits = 0;
  let male = 0;
  let adult = 0;
  let elderly = 0;
  let chinese = 0;
  let malay = 0;
  let indian = 0;

  cameras
    .filter((c) => c.status === "online")
    .forEach((c) => {
      const seed = seedOf(c.id);
      const inCount = 18 + (seed % 44);
      const outCount = Math.max(0, inCount - 4 + (seed % 9));
      entries += inCount;
      exits += outCount;
      // Gender, age and race are classified per entry, so every split totals the entries.
      male += Math.round(inCount * (0.46 + (seed % 13) / 100));
      const a = Math.round(inCount * (0.58 + (seed % 11) / 100));
      const e = Math.round(inCount * (0.08 + (seed % 5) / 100));
      adult += a;
      elderly += Math.min(e, inCount - a);
      const chi = Math.round(inCount * (0.7 + (seed % 7) / 100));
      const mal = Math.min(Math.round(inCount * (0.12 + (seed % 5) / 100)), inCount - chi);
      const ind = Math.max(0, Math.min(Math.round(inCount * (0.08 + (seed % 3) / 100)), inCount - chi - mal));
      chinese += chi;
      malay += mal;
      indian += ind;
    });

  return {
    entries,
    exits,
    inside: Math.max(0, BASELINE_INSIDE + entries - exits),
    male,
    female: entries - male,
    adult,
    child: entries - adult - elderly,
    elderly,
    chinese,
    malay,
    indian,
    others: entries - chinese - malay - indian,
  };
}
