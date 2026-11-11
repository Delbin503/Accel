import type { AreaSummary, DeploymentData, SiteSummary } from "@/types/deployments";
import { DEVICE_TYPE_INFO, TA_AREAS, TA_CAMERAS, TA_SITES, useDevicesStore, type DeviceType, type ExternalDevice } from "./taData";

/* Model Deployment data for the Training Assessment module: the module's own
   sites and areas, and the things a deployment can run on — cameras and the
   external devices paired with them (launch monitors, bar speed sensors…). */

export type TargetKind = "camera" | "device";

export interface DeployTarget {
  kind: TargetKind;
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  unit: string;
  status: "online" | "offline" | "pairing";
  /** Camera: position and frame rate. Device: type and what it measures. */
  detail: string;
  fps?: number;
  nvrId?: string | null;
  deviceType?: DeviceType;
}

export function cameraTargets(): DeployTarget[] {
  return TA_CAMERAS.map((c) => ({
    kind: "camera", id: c.id, name: c.name, siteId: c.siteId, siteName: c.siteName, areaId: c.areaId, areaName: c.areaName,
    unit: c.unit, status: c.status, detail: `${c.position} · ${c.fps} fps`, fps: c.fps, nvrId: c.nvrId,
  }));
}

export function deviceTargets(devices: ExternalDevice[]): DeployTarget[] {
  return devices.map((d) => ({
    kind: "device", id: d.id, name: d.name, siteId: d.siteId, siteName: d.siteName, areaId: d.areaId, areaName: d.areaName,
    unit: d.unit, status: d.status, detail: `${d.type} · ${DEVICE_TYPE_INFO[d.type].measures}`, deviceType: d.type,
  }));
}

/** Cameras and devices in the given areas, unit by unit so a bay's devices sit beside its cameras. */
export function targetsIn(areaIds: string[], devices: ExternalDevice[]): DeployTarget[] {
  const all = [...cameraTargets(), ...deviceTargets(devices)].filter((t) => areaIds.includes(t.areaId));
  const unitOrder = (t: DeployTarget) => {
    const area = TA_AREAS.find((a) => a.id === t.areaId);
    return (area ? TA_AREAS.indexOf(area) * 100 : 0) + (area?.units.indexOf(t.unit) ?? 0);
  };
  return all.sort((a, b) => unitOrder(a) - unitOrder(b) || (a.kind === b.kind ? 0 : a.kind === "camera" ? -1 : 1));
}

const LIVE = (d: DeploymentData) => d.status === "active" || d.status === "paused" || d.status === "pending-camera";

export function taSiteSummaries(deployments: DeploymentData[], devices: ExternalDevice[]): SiteSummary[] {
  return TA_SITES.map((s) => {
    const cams = TA_CAMERAS.filter((c) => c.siteId === s.id);
    return {
      siteId: s.id,
      siteName: s.name,
      status: cams.some((c) => c.status === "online") ? "online" : "offline",
      areaCount: s.areas.length,
      cameraCount: cams.length + devices.filter((d) => d.siteId === s.id).length,
      deployedCount: deployments.filter((d) => d.siteId === s.id && LIVE(d)).length,
    };
  });
}

export function taAreaSummaries(siteId: string, deployments: DeploymentData[], devices: ExternalDevice[]): AreaSummary[] {
  return TA_AREAS.filter((a) => a.siteId === siteId).map((a) => {
    const cams = TA_CAMERAS.filter((c) => c.areaId === a.id);
    return {
      areaId: a.id,
      areaName: a.name,
      siteId,
      status: cams.some((c) => c.status === "online") ? "online" : "offline",
      cameraCount: cams.length + devices.filter((d) => d.areaId === a.id).length,
      deployedCount: deployments.filter((d) => d.areaId === a.id && LIVE(d)).length,
    };
  });
}

/* Seeded history: each assessment model live on its venue's cameras and devices. */
function seed(): DeploymentData[] {
  const plan: [modelId: string, modelName: string, areaIds: string[], deviceIds: string[], at: string][] = [
    ["Mdl_101", "Golf Swing Assessment", ["ma-bays"], ["LM-1", "LM-2", "LM-3", "LM-4", "LM-5"], "14 Oct 2026, 09:20"],
    ["Mdl_102", "Strength Technique Assessment", ["dt-floor"], ["BS-1", "BS-2", "BS-3"], "16 Oct 2026, 17:05"],
    ["Mdl_103", "Rehab Movement Assessment", ["ca-rehab", "ca-walk"], ["DC-1", "FP-1"], "20 Oct 2026, 08:40"],
  ];
  const out: DeploymentData[] = [];
  let n = 1;
  for (const [modelId, modelName, areaIds, deviceIds, at] of plan) {
    const cams = TA_CAMERAS.filter((c) => areaIds.includes(c.areaId));
    const rows = [
      ...cams.map((c) => ({ id: c.id, name: c.name, siteId: c.siteId, siteName: c.siteName, areaId: c.areaId, areaName: c.areaName, online: c.status === "online" })),
      ...useDevicesStore.getState().devices
        .filter((d) => deviceIds.includes(d.id))
        .map((d) => ({ id: d.id, name: d.name, siteId: d.siteId, siteName: d.siteName, areaId: d.areaId, areaName: d.areaName, online: d.status === "online" })),
    ];
    for (const r of rows) {
      out.push({
        id: `TDP-${String(n++).padStart(3, "0")}`,
        modelId, modelName,
        cameraId: r.id, cameraName: r.name,
        siteId: r.siteId, siteName: r.siteName, areaId: r.areaId, areaName: r.areaName,
        status: r.online ? "active" : "pending-camera",
        deployedBy: "Daniel Lim",
        deployedAt: "2026-10-14T09:20:00",
        deployedAtDisplay: at,
        lastValidationRunId: null,
        stoppedAt: null,
        stoppedAtDisplay: null,
        /* Assessment attempts analysed — well under the overload threshold of 80 per camera. */
        eventCount: r.online ? 12 + ((n * 37) % 48) : 0,
        confidence: 70,
        zones: [],
      });
    }
  }
  return out;
}

export const SEED_TA_DEPLOYMENTS: DeploymentData[] = seed();
