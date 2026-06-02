import type { CameraData } from "@/types/cameras";
import { NVR_CHANNEL_MAP, MOCK_NVRS } from "./nvr";

interface CameraSeed {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  status: CameraData["status"];
  ip: string;
  rtspPort?: number;
  zones?: number;
  events24h?: number;
  lastSeen: string;
  lastSeenDisplay: string;
  activeAt: string;
  activeAtDisplay: string;
}

function camera(seed: CameraSeed): CameraData {
  const link = NVR_CHANNEL_MAP[seed.id];
  const nvr = link ? MOCK_NVRS.find((n) => n.id === link.nvrId) ?? null : null;
  const zones: CameraData["boundaryZones"] = [];
  const zoneCount = seed.zones ?? 0;
  for (let i = 0; i < zoneCount; i++) {
    zones.push({
      id: `${seed.id}-z${i + 1}`,
      label: `Zone ${i + 1}`,
      box: [0.1 + i * 0.15, 0.15, 0.35 + i * 0.15, 0.6],
    });
  }
  return {
    id: seed.id,
    name: seed.name,
    siteId: seed.siteId,
    siteName: seed.siteName,
    areaId: seed.areaId,
    areaName: seed.areaName,
    status: seed.status,
    ipAddress: seed.ip,
    rtspPort: seed.rtspPort ?? 554,
    rtspUrl: `rtsp://${seed.ip}:${seed.rtspPort ?? 554}/Streaming/Channels/${link?.channel ?? 1}01`,
    stream: { codec: "h264", resolution: "1920x1080", frameRate: 25 },
    recording: { retentionDays: 30, bitrateKbps: 4096, schedule: "always" },
    nvrId: nvr?.id ?? null,
    nvrName: nvr?.name ?? null,
    channel: link?.channel ?? null,
    boundaryZones: zones,
    recentEventCount: seed.events24h ?? 0,
    lastSeenAt: seed.lastSeen,
    lastSeenDisplay: seed.lastSeenDisplay,
    activeAt: seed.activeAt,
    activeAtDisplay: seed.activeAtDisplay,
  };
}

export const MOCK_CAMERAS: CameraData[] = [
  camera({
    id: "Cam-01", name: "Checkpoint C1 — Entry",
    siteId: "astra", siteName: "Astra HQ",
    areaId: "astra-hq-lobby", areaName: "HQ Lobby",
    status: "online", ip: "10.10.0.101", zones: 2, events24h: 14,
    lastSeen: "2026-05-25T10:14:00", lastSeenDisplay: "25 May 2026, 10:14",
    activeAt: "2026-02-19T11:45:00", activeAtDisplay: "19 Feb 2026, 11:45",
  }),
  camera({
    id: "Cam-04", name: "Loading Bay 3 — Dock",
    siteId: "fedex", siteName: "FedEx Changi",
    areaId: "fedex-loading-bay-3", areaName: "Loading Bay 3",
    status: "online", ip: "10.20.4.104", zones: 3, events24h: 22,
    lastSeen: "2026-05-25T10:13:00", lastSeenDisplay: "25 May 2026, 10:13",
    activeAt: "2026-01-12T09:30:00", activeAtDisplay: "12 Jan 2026, 09:30",
  }),
  camera({
    id: "Cam-07", name: "Loading Bay 3 — Yard",
    siteId: "fedex", siteName: "FedEx Changi",
    areaId: "fedex-loading-bay-3", areaName: "Loading Bay 3",
    status: "online", ip: "10.20.4.107", zones: 1, events24h: 6,
    lastSeen: "2026-05-25T10:13:00", lastSeenDisplay: "25 May 2026, 10:13",
    activeAt: "2026-01-12T09:30:00", activeAtDisplay: "12 Jan 2026, 09:30",
  }),
  camera({
    id: "Cam-09", name: "Armoury A — Door",
    siteId: "sembawang", siteName: "Sembawang Naval",
    areaId: "sembawang-armoury-a", areaName: "Armoury A",
    status: "online", ip: "10.30.1.109", zones: 4, events24h: 31,
    lastSeen: "2026-05-25T10:12:00", lastSeenDisplay: "25 May 2026, 10:12",
    activeAt: "2025-11-04T14:00:00", activeAtDisplay: "04 Nov 2025, 14:00",
  }),
  camera({
    id: "Cam-12", name: "Armoury A — Interior",
    siteId: "sembawang", siteName: "Sembawang Naval",
    areaId: "sembawang-armoury-a", areaName: "Armoury A",
    status: "online", ip: "10.30.1.112", zones: 3, events24h: 18,
    lastSeen: "2026-05-25T10:12:00", lastSeenDisplay: "25 May 2026, 10:12",
    activeAt: "2025-11-04T14:00:00", activeAtDisplay: "04 Nov 2025, 14:00",
  }),
  camera({
    id: "Cam-15", name: "Medical Bay 2",
    siteId: "sembawang", siteName: "Sembawang Naval",
    areaId: "sembawang-medical", areaName: "Medical Bay 2",
    status: "online", ip: "10.30.1.115", zones: 2, events24h: 5,
    lastSeen: "2026-05-25T10:11:00", lastSeenDisplay: "25 May 2026, 10:11",
    activeAt: "2025-11-04T14:00:00", activeAtDisplay: "04 Nov 2025, 14:00",
  }),
  camera({
    id: "Cam-18", name: "HQ Lobby — Reception",
    siteId: "astra", siteName: "Astra HQ",
    areaId: "astra-hq-lobby", areaName: "HQ Lobby",
    status: "online", ip: "10.10.0.118", zones: 1, events24h: 9,
    lastSeen: "2026-05-25T10:11:00", lastSeenDisplay: "25 May 2026, 10:11",
    activeAt: "2026-02-19T11:45:00", activeAtDisplay: "19 Feb 2026, 11:45",
  }),
  camera({
    id: "Cam-22", name: "HQ Lobby — Atrium",
    siteId: "astra", siteName: "Astra HQ",
    areaId: "astra-hq-lobby", areaName: "HQ Lobby",
    status: "online", ip: "10.10.0.122", zones: 2, events24h: 12,
    lastSeen: "2026-05-25T10:10:00", lastSeenDisplay: "25 May 2026, 10:10",
    activeAt: "2026-02-19T11:45:00", activeAtDisplay: "19 Feb 2026, 11:45",
  }),
  camera({
    id: "Cam-24", name: "HQ Lobby — Side Entry",
    siteId: "astra", siteName: "Astra HQ",
    areaId: "astra-hq-lobby", areaName: "HQ Lobby",
    status: "connection-failed", ip: "10.10.0.124", zones: 0, events24h: 0,
    lastSeen: "2026-05-25T07:30:00", lastSeenDisplay: "25 May 2026, 07:30",
    activeAt: "2026-02-19T11:45:00", activeAtDisplay: "19 Feb 2026, 11:45",
  }),
  camera({
    id: "Cam-30", name: "Lab 3 — Entry",
    siteId: "astra", siteName: "Astra HQ",
    areaId: "astra-lab-3", areaName: "Lab 3",
    status: "offline", ip: "10.10.0.130", zones: 0, events24h: 0,
    lastSeen: "2026-05-22T18:02:00", lastSeenDisplay: "22 May 2026, 18:02",
    activeAt: "2026-04-01T10:00:00", activeAtDisplay: "01 Apr 2026, 10:00",
  }),
  camera({
    id: "Cam-32", name: "Parking P1 — Gate",
    siteId: "astra", siteName: "Astra HQ",
    areaId: "astra-parking-p1", areaName: "Parking P1",
    status: "pending", ip: "10.10.0.132", zones: 0, events24h: 0,
    lastSeen: "2026-05-24T16:00:00", lastSeenDisplay: "24 May 2026, 16:00",
    activeAt: "2026-05-24T16:00:00", activeAtDisplay: "24 May 2026, 16:00",
  }),
];

export const CAMERA_SITES = [
  { value: "astra",     label: "Astra HQ" },
  { value: "sembawang", label: "Sembawang Naval" },
  { value: "fedex",     label: "FedEx Changi" },
];

export const CAMERA_AREAS = [
  { value: "astra-hq-lobby",     label: "HQ Lobby" },
  { value: "astra-lab-3",        label: "Lab 3" },
  { value: "astra-parking-p1",   label: "Parking P1" },
  { value: "sembawang-medical",  label: "Medical Bay 2" },
  { value: "sembawang-armoury-a",label: "Armoury A" },
  { value: "fedex-loading-bay-3",label: "Loading Bay 3" },
  { value: "fedex-checkpoint-c", label: "Checkpoint C1" },
];

export function findCameraById(id: string) {
  return MOCK_CAMERAS.find((c) => c.id === id) ?? null;
}
