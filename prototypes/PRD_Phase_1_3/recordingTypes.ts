/* The four recording types from the Phase 1.3 requirements (VMS-VR-001..004).
   Shared by all three tabs so the config, the playback timeline and the
   recordings list all describe the same four things. */

export type RecordingTypeId = "continuous" | "standby" | "motion" | "training";

export interface RecordingTypeDef {
  id: RecordingTypeId;
  /** Requirement ID from the VMS spec. */
  ref: string;
  label: string;
  /** The requirement, verbatim enough to check the build against. */
  requirement: string;
  /** Minimum the spec mandates — the config cannot be set below this. */
  minResolution: string;
  minFps: number;
  /** Whether the spec fixes this type to 24/7, so its window is not editable. */
  alwaysOn: boolean;
  /** Open question carried from the requirements sheet. */
  note?: string;
  /** Print/chart colour token suffix — drives chips and the timeline. */
  tone: "info" | "purple" | "warning" | "success";
}

export const RECORDING_TYPES: RecordingTypeDef[] = [
  {
    id: "continuous",
    ref: "VMS-VR-001",
    label: "Continuous",
    requirement: "Provide continuous 24/7 video recording.",
    minResolution: "1280x720",
    minFps: 24,
    alwaysOn: true,
    tone: "info",
  },
  {
    id: "standby",
    ref: "VMS-VR-002",
    label: "Standby",
    requirement: "Record at a minimum of 720p at 24 fps during standby mode.",
    minResolution: "1280x720",
    minFps: 24,
    alwaysOn: false,
    note: "Timebound or manual trigger — the window below is the timebound case.",
    tone: "purple",
  },
  {
    id: "motion",
    ref: "VMS-VR-003",
    label: "Motion-Based",
    requirement: "Switch to a minimum of 1080p at 60 fps when motion is detected.",
    minResolution: "1920x1080",
    minFps: 60,
    alwaysOn: false,
    note: "Applied via CV model — research feasibility before committing.",
    tone: "warning",
  },
  {
    id: "training",
    ref: "VMS-VR-004",
    label: "Training",
    requirement: "Record at a minimum of 1080p at 60 fps during training sessions.",
    minResolution: "1920x1080",
    minFps: 60,
    alwaysOn: false,
    note: "Hardware must sustain 60 fps.",
    tone: "success",
  },
];

export const RESOLUTIONS = ["1280x720", "1920x1080", "2560x1440", "3840x2160"] as const;
export const FPS_OPTIONS = [24, 30, 60] as const;

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
}

export const DEFAULT_CONFIG: Record<RecordingTypeId, RecordingTypeConfig> = {
  continuous: { enabled: true,  startTime: "00:00", endTime: "23:59", resolution: "1280x720",  fps: 24 },
  standby:    { enabled: true,  startTime: "18:00", endTime: "06:00", resolution: "1280x720",  fps: 24 },
  motion:     { enabled: true,  startTime: "00:00", endTime: "23:59", resolution: "1920x1080", fps: 60 },
  training:   { enabled: false, startTime: "09:00", endTime: "17:00", resolution: "1920x1080", fps: 60 },
};

export const TONE_CLASSES: Record<RecordingTypeDef["tone"], { chip: string; bar: string; dot: string }> = {
  info:    { chip: "border-info/30 bg-info/10 text-info",                   bar: "bg-info",         dot: "bg-info" },
  purple:  { chip: "border-purple/30 bg-purple/10 text-purple",             bar: "bg-purple",       dot: "bg-purple" },
  warning: { chip: "border-warning/30 bg-warning/10 text-warning",          bar: "bg-warning",      dot: "bg-warning" },
  success: { chip: "border-success/30 bg-success/10 text-success",          bar: "bg-success",      dot: "bg-success" },
};

export function typeById(id: RecordingTypeId): RecordingTypeDef {
  return RECORDING_TYPES.find((t) => t.id === id) ?? RECORDING_TYPES[0];
}
