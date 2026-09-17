/* The recording types behind the Phase 1.3 proposals. Shared by the schedule,
   the coverage strip and the recordings list so they all describe the same
   four things. */

export type RecordingTypeId = "continuous" | "standby" | "motion" | "training";

export interface RecordingTypeDef {
  id: RecordingTypeId;
  label: string;
  /** What the type is — not how it happens to be configured. */
  description: string;
  /**
   * Motion runs inside standby: it is a switch on the standby recording, not a
   * schedule of its own, so it has no window and follows its parent's.
   */
  parent?: RecordingTypeId;
  /** Minimum the spec mandates — going below it warns rather than blocks. */
  minResolution: string;
  minFps: number;
  /** Whether the type is fixed to 24/7, so its window is not editable. */
  alwaysOn: boolean;
  /** Open question carried from the requirements sheet. */
  note?: string;
  /** Colour token suffix — drives chips, bars and dots. */
  tone: "info" | "purple" | "warning" | "success";
}

export const RECORDING_TYPES: RecordingTypeDef[] = [
  {
    id: "continuous",
    label: "Continuous",
    description: "Records without interruption, so nothing on this camera is ever missed.",
    minResolution: "1280x720",
    minFps: 24,
    alwaysOn: true,
    tone: "info",
  },
  {
    id: "standby",
    label: "Standby",
    description: "The camera's resting recording — what it captures while nothing is happening.",
    minResolution: "1280x720",
    minFps: 24,
    alwaysOn: false,
    note: "Timebound or manual trigger — the window below is the timebound case.",
    tone: "purple",
  },
  {
    id: "motion",
    label: "Motion-Based",
    description:
      "Triggered when motion is detected, and reverts to standby once motion stops.",
    parent: "standby",
    minResolution: "1920x1080",
    minFps: 60,
    alwaysOn: false,
    note: "Applied via CV model — research feasibility before committing.",
    tone: "warning",
  },
  {
    id: "training",
    label: "Training",
    description: "Captures a training session so it can be reviewed and labelled afterwards.",
    minResolution: "1920x1080",
    minFps: 60,
    alwaysOn: false,
    note: "Hardware must sustain the higher frame rate.",
    tone: "success",
  },
];

/** Types that own a schedule. Motion is nested under standby instead. */
export const TOP_LEVEL_TYPES = RECORDING_TYPES.filter((t) => !t.parent);

export function childrenOf(id: RecordingTypeId): RecordingTypeDef[] {
  return RECORDING_TYPES.filter((t) => t.parent === id);
}

export const RESOLUTIONS = ["1280x720", "1920x1080", "2560x1440", "3840x2160"] as const;
export const FPS_OPTIONS = [24, 30, 60] as const;
/** How long the camera waits without motion before dropping back to standby. */
export const REVERT_OPTIONS = [10, 30, 50, 90, 120] as const;

/** Resolutions ordered by pixel count, so a minimum can be enforced. */
export function resolutionRank(value: string): number {
  return RESOLUTIONS.indexOf(value as (typeof RESOLUTIONS)[number]);
}

export interface RecordingTypeConfig {
  enabled: boolean;
  startTime: string;
  endTime: string;
  resolution: string;
  fps: number;
  /** Motion only — seconds of stillness before reverting to standby. */
  revertSeconds?: number;
}

export const DEFAULT_CONFIG: Record<RecordingTypeId, RecordingTypeConfig> = {
  continuous: { enabled: true,  startTime: "00:00", endTime: "23:59", resolution: "1280x720",  fps: 24 },
  standby:    { enabled: true,  startTime: "18:00", endTime: "06:00", resolution: "1280x720",  fps: 24 },
  // Window mirrors standby's — motion only records inside its parent's hours.
  motion:     { enabled: true,  startTime: "18:00", endTime: "06:00", resolution: "1920x1080", fps: 60, revertSeconds: 50 },
  training:   { enabled: false, startTime: "09:00", endTime: "17:00", resolution: "1920x1080", fps: 60 },
};

export const TONE_CLASSES: Record<RecordingTypeDef["tone"], { chip: string; bar: string; dot: string }> = {
  info:    { chip: "border-info/30 bg-info/10 text-info",          bar: "bg-info",    dot: "bg-info" },
  purple:  { chip: "border-purple/30 bg-purple/10 text-purple",    bar: "bg-purple",  dot: "bg-purple" },
  warning: { chip: "border-warning/30 bg-warning/10 text-warning", bar: "bg-warning", dot: "bg-warning" },
  success: { chip: "border-success/30 bg-success/10 text-success", bar: "bg-success", dot: "bg-success" },
};

export function typeById(id: RecordingTypeId): RecordingTypeDef {
  return RECORDING_TYPES.find((t) => t.id === id) ?? RECORDING_TYPES[0];
}
