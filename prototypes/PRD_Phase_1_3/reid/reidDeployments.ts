import { MOCK_CAMERAS } from "@/mocks/cameras";
import { nextDeploymentId } from "@/mocks/deployments";
import type { DeploymentData } from "@/types/deployments";
import { sceneMarkers, zoneBox } from "./calibrationGeometry";
import type { ReidMap } from "./reidMaps";

/* Deployment records behind the seeded Re-ID maps, so the module's History tab
   has a Re-ID model to open before anything has been deployed in the session. */

export function seedReidDeployments(maps: ReidMap[], modelId: string, confidence: number): DeploymentData[] {
  return maps.flatMap((map, mi) =>
    map.cameraIds.flatMap((cameraId) => {
      const cam = MOCK_CAMERAS.find((c) => c.id === cameraId);
      if (!cam) return [];
      const used = map.used[cameraId] ?? [];
      const deployedAt = new Date(Date.UTC(2026, 8, 21 + mi, 9, 30));
      return [
        {
          id: nextDeploymentId(),
          modelId,
          modelName: map.modelName,
          cameraId,
          cameraName: cam.name,
          siteId: cam.siteId,
          siteName: cam.siteName,
          areaId: cam.areaId,
          areaName: cam.areaName,
          status: cam.status === "online" ? "active" : "pending-camera",
          deployedBy: "Delbin Arkar",
          deployedAt: deployedAt.toISOString(),
          deployedAtDisplay: `${21 + mi} Sep 2026, 17:30`,
          lastValidationRunId: "ANY_001",
          stoppedAt: null,
          stoppedAtDisplay: null,
          // Kept under the 80-per-camera "overloaded" line, so the seed reads healthy.
          eventCount: 12 + ((cameraId.charCodeAt(cameraId.length - 1) * 37) % 55),
          confidence,
          zones: [
            {
              id: `${cameraId}-reid`,
              label: `Re-ID floor zone · ${used.length} markers`,
              box: zoneBox(sceneMarkers(cameraId), used),
            },
          ],
        },
      ];
    })
  );
}
