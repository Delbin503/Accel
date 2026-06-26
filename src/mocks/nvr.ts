import type { NvrData } from "@/types/nvr";

/* Single source of truth for which channel each camera lives on. */
export const NVR_CHANNEL_MAP: Record<string, { nvrId: string; channel: number }> = {
  "Cam-01": { nvrId: "NVR-001", channel: 1 },
  "Cam-04": { nvrId: "NVR-001", channel: 2 },
  "Cam-07": { nvrId: "NVR-001", channel: 3 },
  "Cam-09": { nvrId: "NVR-002", channel: 1 },
  "Cam-12": { nvrId: "NVR-002", channel: 2 },
  "Cam-15": { nvrId: "NVR-002", channel: 3 },
  "Cam-18": { nvrId: "NVR-003", channel: 1 },
  "Cam-22": { nvrId: "NVR-003", channel: 2 },
  "Cam-24": { nvrId: "NVR-003", channel: 3 },
  // Cam-30 intentionally unlinked
  // Cam-32 intentionally unlinked
};

function genChannels(nvrId: string, total: number): NvrData["channels"] {
  const rows: NvrData["channels"] = [];
  for (let i = 1; i <= total; i++) {
    const camEntry = Object.entries(NVR_CHANNEL_MAP).find(
      ([, v]) => v.nvrId === nvrId && v.channel === i
    );
    rows.push({
      channel: i,
      cameraId: camEntry?.[0] ?? null,
      cameraName: camEntry?.[0] ?? null,
    });
  }
  return rows;
}

export const MOCK_NVRS: NvrData[] = [
  {
    id: "NVR-001",
    name: "FedEx Changi · NVR-A",
    model: "Hikvision DS-9664NI-I8",
    siteId: "fedex",
    siteName: "FedEx Changi",
    areaId: "fedex-loading-bay-3",
    areaName: "Loading Bay 3",
    status: "online",
    ipAddress: "10.20.4.21",
    httpPort: 8000,
    totalStorageGb: 8000,
    usedStorageGb: 5240,
    retentionDays: 30,
    cleanupSchedule: "auto-age",
    channels: genChannels("NVR-001", 16),
    channelsInUse: 3,
    channelCount: 16,
    lastSeenAt: "2026-05-25T10:14:00",
    lastSeenDisplay: "25 May 2026, 10:14",
    activeAt: "2026-01-12T09:30:00",
    activeAtDisplay: "12 Jan 2026, 09:30",
  },
  {
    id: "NVR-002",
    name: "Sembawang Naval · NVR-Main",
    model: "Dahua NVR5864-4KS2",
    siteId: "sembawang",
    siteName: "Sembawang Naval",
    areaId: "sembawang-armoury-a",
    areaName: "Armoury A",
    status: "online",
    ipAddress: "10.30.1.10",
    httpPort: 8000,
    totalStorageGb: 16000,
    usedStorageGb: 14820,
    retentionDays: 90,
    cleanupSchedule: "auto-age",
    channels: genChannels("NVR-002", 16),
    channelsInUse: 3,
    channelCount: 16,
    lastSeenAt: "2026-05-25T10:12:00",
    lastSeenDisplay: "25 May 2026, 10:12",
    activeAt: "2025-11-04T14:00:00",
    activeAtDisplay: "04 Nov 2025, 14:00",
  },
  {
    id: "NVR-003",
    name: "Astra HQ · NVR-Lobby",
    model: "Uniview NVR308-32E2",
    siteId: "astra",
    siteName: "Astra HQ",
    areaId: "astra-hq-lobby",
    areaName: "HQ Lobby",
    status: "online",
    ipAddress: "10.10.0.42",
    httpPort: 8000,
    totalStorageGb: 4000,
    usedStorageGb: 1850,
    retentionDays: 14,
    cleanupSchedule: "auto-channel",
    channels: genChannels("NVR-003", 8),
    channelsInUse: 3,
    channelCount: 8,
    lastSeenAt: "2026-05-25T10:11:00",
    lastSeenDisplay: "25 May 2026, 10:11",
    activeAt: "2026-02-19T11:45:00",
    activeAtDisplay: "19 Feb 2026, 11:45",
  },
  {
    id: "NVR-004",
    name: "FedEx Changi · NVR-Checkpoint",
    model: "Hikvision DS-7716NI-I4",
    siteId: "fedex",
    siteName: "FedEx Changi",
    areaId: "fedex-checkpoint-c",
    areaName: "Checkpoint C1",
    status: "degraded",
    ipAddress: "10.20.4.22",
    httpPort: 8000,
    totalStorageGb: 4000,
    usedStorageGb: 3920,
    retentionDays: 30,
    cleanupSchedule: "auto-age",
    channels: genChannels("NVR-004", 16),
    channelsInUse: 0,
    channelCount: 16,
    lastSeenAt: "2026-05-25T09:45:00",
    lastSeenDisplay: "25 May 2026, 09:45",
    activeAt: "2026-03-08T08:00:00",
    activeAtDisplay: "08 Mar 2026, 08:00",
  },
  {
    id: "NVR-005",
    name: "Astra HQ · NVR-Lab",
    model: "Dahua NVR4232-4KS2",
    siteId: "astra",
    siteName: "Astra HQ",
    areaId: "astra-lab-3",
    areaName: "Lab 3",
    status: "offline",
    ipAddress: "10.10.0.51",
    httpPort: 8000,
    totalStorageGb: 4000,
    usedStorageGb: 980,
    retentionDays: 21,
    cleanupSchedule: "auto-channel",
    channels: genChannels("NVR-005", 8),
    channelsInUse: 0,
    channelCount: 8,
    lastSeenAt: "2026-05-22T18:02:00",
    lastSeenDisplay: "22 May 2026, 18:02",
    activeAt: "2026-04-01T10:00:00",
    activeAtDisplay: "01 Apr 2026, 10:00",
  },
];

export function findNvrByCamera(cameraId: string): NvrData | null {
  const link = NVR_CHANNEL_MAP[cameraId];
  if (!link) return null;
  return MOCK_NVRS.find((n) => n.id === link.nvrId) ?? null;
}
