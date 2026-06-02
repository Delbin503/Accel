import type { DeploymentData, SiteSummary, AreaSummary } from "@/types/deployments";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "./cameras";

/* ── Mock past deployments (across all statuses) ─────────────────────────── */

export const MOCK_DEPLOYMENTS: DeploymentData[] = [
  {
    id: "DEP_001",
    modelId: "Mdl_001",
    modelName: "SOP Compliance",
    cameraId: "Cam-04",
    cameraName: "Loading Bay 3 — Dock",
    siteId: "fedex",
    siteName: "FedEx Changi",
    areaId: "fedex-loading-bay-3",
    areaName: "Loading Bay 3",
    status: "active",
    deployedBy: "Delbin Arkar",
    deployedAt: "2026-05-20T09:14:00",
    deployedAtDisplay: "20 May 2026, 09:14",
    lastValidationRunId: "ANY_001",
    stoppedAt: null,
    stoppedAtDisplay: null,
    eventCount: 47,
  },
  {
    id: "DEP_002",
    modelId: "Mdl_001",
    modelName: "SOP Compliance",
    cameraId: "Cam-07",
    cameraName: "Loading Bay 3 — Yard",
    siteId: "fedex",
    siteName: "FedEx Changi",
    areaId: "fedex-loading-bay-3",
    areaName: "Loading Bay 3",
    status: "active",
    deployedBy: "Delbin Arkar",
    deployedAt: "2026-05-20T09:18:00",
    deployedAtDisplay: "20 May 2026, 09:18",
    lastValidationRunId: "ANY_001",
    stoppedAt: null,
    stoppedAtDisplay: null,
    eventCount: 31,
  },
  {
    id: "DEP_003",
    modelId: "Mdl_002",
    modelName: "Muzzle Detection Protocol",
    cameraId: "Cam-09",
    cameraName: "Armoury A — Door",
    siteId: "sembawang",
    siteName: "Sembawang Naval",
    areaId: "sembawang-armoury-a",
    areaName: "Armoury A",
    status: "active",
    deployedBy: "Sze Hui",
    deployedAt: "2026-05-18T11:02:00",
    deployedAtDisplay: "18 May 2026, 11:02",
    lastValidationRunId: "ANY_005",
    stoppedAt: null,
    stoppedAtDisplay: null,
    eventCount: 124,
  },
  {
    id: "DEP_004",
    modelId: "Mdl_002",
    modelName: "Muzzle Detection Protocol",
    cameraId: "Cam-12",
    cameraName: "Armoury A — Interior",
    siteId: "sembawang",
    siteName: "Sembawang Naval",
    areaId: "sembawang-armoury-a",
    areaName: "Armoury A",
    status: "paused",
    deployedBy: "Sze Hui",
    deployedAt: "2026-05-18T11:05:00",
    deployedAtDisplay: "18 May 2026, 11:05",
    lastValidationRunId: "ANY_005",
    stoppedAt: null,
    stoppedAtDisplay: null,
    eventCount: 89,
  },
  {
    id: "DEP_005",
    modelId: "Mdl_003",
    modelName: "Helmet Detection V1",
    cameraId: "Cam-24",
    cameraName: "HQ Lobby — Side Entry",
    siteId: "astra",
    siteName: "Astra HQ",
    areaId: "astra-hq-lobby",
    areaName: "HQ Lobby",
    status: "pending-camera",
    deployedBy: "Delbin Arkar",
    deployedAt: "2026-05-25T08:00:00",
    deployedAtDisplay: "25 May 2026, 08:00",
    lastValidationRunId: "ANY_002",
    stoppedAt: null,
    stoppedAtDisplay: null,
    eventCount: 0,
  },
  {
    id: "DEP_006",
    modelId: "Mdl_001",
    modelName: "SOP Compliance",
    cameraId: "Cam-01",
    cameraName: "Checkpoint C1 — Entry",
    siteId: "astra",
    siteName: "Astra HQ",
    areaId: "astra-hq-lobby",
    areaName: "HQ Lobby",
    status: "stopped",
    deployedBy: "Delbin Arkar",
    deployedAt: "2026-04-12T14:00:00",
    deployedAtDisplay: "12 Apr 2026, 14:00",
    lastValidationRunId: "ANY_007",
    stoppedAt: "2026-05-18T16:23:00",
    stoppedAtDisplay: "18 May 2026, 16:23",
    eventCount: 412,
  },
  {
    id: "DEP_007",
    modelId: "Mdl_003",
    modelName: "Helmet Detection V1",
    cameraId: "Cam-15",
    cameraName: "Medical Bay 2",
    siteId: "sembawang",
    siteName: "Sembawang Naval",
    areaId: "sembawang-medical",
    areaName: "Medical Bay 2",
    status: "failed",
    deployedBy: "Sze Hui",
    deployedAt: "2026-05-24T10:15:00",
    deployedAtDisplay: "24 May 2026, 10:15",
    lastValidationRunId: "ANY_002",
    stoppedAt: null,
    stoppedAtDisplay: null,
    eventCount: 0,
    failureReason: "Model resolution (1920x1080) exceeds camera capability (1280x720). Re-validate against a compatible footage clip.",
  },
];

/* ── Derived: Sites with their cameras + areas + deployed count ──────────── */

export function getSiteSummaries(deployments: DeploymentData[] = MOCK_DEPLOYMENTS): SiteSummary[] {
  return CAMERA_SITES.map((s) => {
    const camsInSite = MOCK_CAMERAS.filter((c) => c.siteId === s.value);
    const areasInSite = new Set(camsInSite.map((c) => c.areaId));
    const deployedHere = deployments.filter(
      (d) => d.siteId === s.value && (d.status === "active" || d.status === "paused" || d.status === "pending-camera")
    ).length;
    const onlineCount = camsInSite.filter((c) => c.status === "online").length;
    return {
      siteId: s.value,
      siteName: s.label,
      status: onlineCount > 0 ? "online" : "offline",
      areaCount: areasInSite.size,
      cameraCount: camsInSite.length,
      deployedCount: deployedHere,
    };
  });
}

/* ── Derived: Areas for a chosen site ────────────────────────────────────── */

export function getAreaSummaries(
  siteId: string,
  deployments: DeploymentData[] = MOCK_DEPLOYMENTS
): AreaSummary[] {
  const areasInSite = CAMERA_AREAS.filter((a) => a.value.startsWith(siteId + "-"));
  return areasInSite.map((a) => {
    const camsInArea = MOCK_CAMERAS.filter((c) => c.areaId === a.value);
    const deployedHere = deployments.filter(
      (d) => d.areaId === a.value && (d.status === "active" || d.status === "paused" || d.status === "pending-camera")
    ).length;
    const onlineCount = camsInArea.filter((c) => c.status === "online").length;
    return {
      areaId: a.value,
      areaName: a.label,
      siteId,
      status: onlineCount > 0 ? "online" : "offline",
      cameraCount: camsInArea.length,
      deployedCount: deployedHere,
    };
  });
}

let _depCtr = MOCK_DEPLOYMENTS.length;
export function nextDeploymentId(): string {
  _depCtr += 1;
  return `DEP_${String(_depCtr).padStart(3, "0")}`;
}
