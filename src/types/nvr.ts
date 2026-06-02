/* NVR types — mirrors PRD § 4.6 */

export type NvrStatus = "online" | "offline" | "degraded";

export type StorageBand = "healthy" | "warning" | "critical";

export interface NvrChannel {
  channel: number;
  cameraId: string | null;
  cameraName: string | null;
}

export interface NvrData {
  id: string;
  name: string;
  model: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  status: NvrStatus;
  ipAddress: string;
  httpPort: number;
  totalStorageGb: number;
  usedStorageGb: number;
  retentionDays: number;
  cleanupSchedule: "auto-age" | "auto-channel" | "manual";
  channels: NvrChannel[];
  /** Number of channels with a linked camera. */
  channelsInUse: number;
  /** Total channels. */
  channelCount: number;
  lastSeenAt: string;
  lastSeenDisplay: string;
  activeAt: string;
  activeAtDisplay: string;
}

/** Derive storage band from used/total. */
export function storageBandFor(used: number, total: number): StorageBand {
  const pct = total === 0 ? 0 : (used / total) * 100;
  if (pct >= 90) return "critical";
  if (pct >= 75) return "warning";
  return "healthy";
}
