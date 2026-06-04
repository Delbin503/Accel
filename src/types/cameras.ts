/* Camera + Recording types — mirrors PRD § 4.6 */

export type CameraStatus = "online" | "offline" | "connection-failed";

export interface BoundaryZone {
  id: string;
  label: string;
  /** Normalised coordinates [x0,y0,x1,y1] in 0..1 range. */
  box: [number, number, number, number];
}

export interface VideoStreamSpec {
  codec: "h264" | "h265" | "mjpeg";
  resolution: string; // "1920x1080"
  frameRate: number;  // fps
}

export interface RecordingConfig {
  retentionDays: number;
  bitrateKbps: number;
  schedule: "always" | "business-hours" | "off-hours" | "custom";
  /** Days of week the camera records (0=Sun … 6=Sat). Optional; defaults to all 7. */
  scheduleDays?: number[];
  /** "HH:mm" 24-hr. Defaults to "00:00". */
  scheduleStart?: string;
  /** "HH:mm" 24-hr. Defaults to "23:59". */
  scheduleEnd?: string;
}

export interface CameraData {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  status: CameraStatus;
  ipAddress: string;
  rtspPort: number;
  rtspUrl: string;
  stream: VideoStreamSpec;
  recording: RecordingConfig;
  /** Linked NVR storing this camera's footage (nullable per PRD). */
  nvrId: string | null;
  nvrName: string | null;
  channel: number | null;
  boundaryZones: BoundaryZone[];
  /** Number of detection events this camera produced in the last 24h (display only). */
  recentEventCount: number;
  /** When the camera was last seen / heard from. */
  lastSeenAt: string;
  lastSeenDisplay: string;
  activeAt: string;
  activeAtDisplay: string;
}

export interface RecordingEntry {
  id: string;
  cameraId: string;
  nvrId: string;
  startsAt: string;
  endsAt: string;
  durationSeconds: number;
  fileSizeMb: number;
}
