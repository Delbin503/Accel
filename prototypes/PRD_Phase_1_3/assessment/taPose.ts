import { create } from "zustand";
import { TA_AREAS, TA_CAMERAS, USE_CASES, USE_CASE_KEYS, type PoseMode, type TaCamera, type UseCaseKey } from "./taData";

/* Pose settings per use case — set in System Configuration › Camera Defaults.
   The camera requirements follow from them: 3D needs two views per unit, 2D
   one, and every camera must run at the pose frame rate. Model Deployment
   reads the same settings to flag cameras that fall short. */

export type Smoothing = "Light" | "Medium" | "Strong";
export type FewerCameras = "reduced" | "block";

export interface PoseSettings {
  mode: PoseMode;
  fps: number;
  smoothing: Smoothing;
  /** Blur faces in stored clips. Locked on for clinical use. */
  faceBlur: boolean;
  fewer: FewerCameras;
}

export function defaultPose(k: UseCaseKey): PoseSettings {
  const uc = USE_CASES[k];
  return { mode: uc.pose.mode, fps: uc.pose.fps, smoothing: uc.pose.smoothing, faceBlur: k === "physio", fewer: uc.fewer.def };
}

interface PoseState {
  settings: Record<UseCaseKey, PoseSettings>;
  patch: (k: UseCaseKey, p: Partial<PoseSettings>) => void;
  reset: (k: UseCaseKey) => void;
}

export const usePoseStore = create<PoseState>((set) => ({
  settings: Object.fromEntries(USE_CASE_KEYS.map((k) => [k, defaultPose(k)])) as Record<UseCaseKey, PoseSettings>,
  patch: (k, p) => set((s) => ({ settings: { ...s.settings, [k]: { ...s.settings[k], ...p } } })),
  reset: (k) => set((s) => ({ settings: { ...s.settings, [k]: defaultPose(k) } })),
}));

/** Cameras a unit needs under these settings. */
export function requiredCameras(k: UseCaseKey, mode: PoseMode): number {
  return USE_CASES[k].positions[mode].required;
}

export interface UnitReadiness {
  areaId: string;
  areaName: string;
  siteName: string;
  unit: string;
  cameras: TaCamera[];
  ok: boolean;
  issue?: string;
}

/** Each unit's cameras checked against the pose settings: count, frame rate, online. */
export function unitReadiness(k: UseCaseKey, s: PoseSettings): UnitReadiness[] {
  const need = requiredCameras(k, s.mode);
  const out: UnitReadiness[] = [];
  for (const area of TA_AREAS.filter((a) => a.useCase === k)) {
    for (const unit of area.units) {
      const cameras = TA_CAMERAS.filter((c) => c.areaId === area.id && c.unit === unit);
      const slow = cameras.find((c) => c.fps < s.fps);
      const offline = cameras.find((c) => c.status === "offline");
      let issue: string | undefined;
      if (cameras.length < need) issue = `${cameras.length} of ${need} cameras`;
      else if (slow) issue = `${slow.position} runs ${slow.fps} fps, needs ${s.fps}`;
      else if (offline) issue = `${offline.position} camera offline`;
      out.push({ areaId: area.id, areaName: area.name, siteName: cameras[0]?.siteName ?? "", unit, cameras, ok: !issue, issue });
    }
  }
  return out;
}

/** Why one camera falls short of the pose settings, or null when it meets them. */
export function cameraShortfall(c: TaCamera, k: UseCaseKey, s: PoseSettings): string | null {
  if (c.fps < s.fps) return `Runs ${c.fps} fps · ${USE_CASES[k].label} pose needs ${s.fps}`;
  return null;
}
