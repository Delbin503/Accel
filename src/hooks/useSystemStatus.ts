import * as React from "react";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_SERVERS } from "@/mocks/systemStatus";

/** Roll-up health of one device class. */
export type SystemHealth = "healthy" | "degraded" | "critical";

export interface SystemStatusGroup {
  /** Devices reporting online. */
  online: number;
  /** Devices registered. */
  total: number;
  /** Devices in a warning state (degraded NVR, high-load server). */
  degraded: number;
  health: SystemHealth;
}

export interface SystemStatusSummary {
  cameras: SystemStatusGroup;
  nvrs: SystemStatusGroup;
  servers: SystemStatusGroup;
  /** Worst health across all groups. */
  overall: SystemHealth;
}

/**
 * Anything offline is critical; anything merely degraded is a warning.
 * A group with no registered devices reads as healthy rather than critical.
 */
function healthFor(online: number, total: number, degraded: number): SystemHealth {
  if (total === 0) return "healthy";
  if (online + degraded < total) return "critical";
  if (degraded > 0) return "degraded";
  return "healthy";
}

const HEALTH_RANK: Record<SystemHealth, number> = { healthy: 0, degraded: 1, critical: 2 };

function worst(...healths: SystemHealth[]): SystemHealth {
  return healths.reduce((a, b) => (HEALTH_RANK[b] > HEALTH_RANK[a] ? b : a), "healthy");
}

/**
 * Derives the top-bar system status roll-up from the camera, NVR and server
 * records. Memoised against the mock sources so the header does not recompute
 * on every render.
 */
export function useSystemStatus(): SystemStatusSummary {
  return React.useMemo(() => {
    const cameraTotal = MOCK_CAMERAS.length;
    const cameraOnline = MOCK_CAMERAS.filter((c) => c.status === "online").length;

    const nvrTotal = MOCK_NVRS.length;
    const nvrOnline = MOCK_NVRS.filter((n) => n.status === "online").length;
    const nvrDegraded = MOCK_NVRS.filter((n) => n.status === "degraded").length;

    const serverTotal = MOCK_SERVERS.length;
    const serverOnline = MOCK_SERVERS.filter((s) => s.status === "online").length;
    const serverDegraded = MOCK_SERVERS.filter((s) => s.status === "degraded").length;

    const cameras: SystemStatusGroup = {
      online: cameraOnline,
      total: cameraTotal,
      degraded: 0,
      health: healthFor(cameraOnline, cameraTotal, 0),
    };
    const nvrs: SystemStatusGroup = {
      online: nvrOnline,
      total: nvrTotal,
      degraded: nvrDegraded,
      health: healthFor(nvrOnline, nvrTotal, nvrDegraded),
    };
    const servers: SystemStatusGroup = {
      online: serverOnline,
      total: serverTotal,
      degraded: serverDegraded,
      health: healthFor(serverOnline, serverTotal, serverDegraded),
    };

    return {
      cameras,
      nvrs,
      servers,
      overall: worst(cameras.health, nvrs.health, servers.health),
    };
  }, []);
}
