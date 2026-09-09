import * as React from "react";
import { DrawZoneModal } from "@/components/shared/DrawZoneModal";
import { FloorPlanModal, type Tool } from "@/pages/site/overview/SiteDetailDrawer";
import { MOCK_SITES_FULL } from "@/mocks/sites";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import type { BoundaryZone } from "@/types/cameras";

/**
 * Wrappers for modals that are driven entirely by their host page's state —
 * the gallery has to stand in as that host.
 */

const site = MOCK_SITES_FULL[0];

/** DrawZoneModal owns no zone state of its own — the host page does. */
export function DrawZonePreview({ onClose, withPicker }: { onClose: () => void; withPicker?: boolean }) {
  const [zones, setZones] = React.useState<BoundaryZone[]>([
    { id: "z1", label: "Loading Bay", box: [0.12, 0.22, 0.48, 0.62] },
  ]);
  const [activeId, setActiveId] = React.useState("Cam-01");

  return (
    <DrawZoneModal
      open
      cameraName={activeId === "Cam-01" ? "Loading Bay Cam" : "Yard Cam"}
      existingZones={zones}
      onClose={onClose}
      onSave={(label, box) =>
        setZones((z) => [...z, { id: `z${z.length + 1}`, label, box }])
      }
      onUpdateZone={(id, label) =>
        setZones((z) => z.map((zone) => (zone.id === id ? { ...zone, label } : zone)))
      }
      onRemoveZone={(id) => setZones((z) => z.filter((zone) => zone.id !== id))}
      onUpdateZoneBox={(id, box) =>
        setZones((z) => z.map((zone) => (zone.id === id ? { ...zone, box } : zone)))
      }
      primaryAction={withPicker ? { label: "Next", onClick: onClose } : undefined}
      skipAction={withPicker ? { label: "Skip zones", onClick: onClose } : undefined}
      cameraPicker={
        withPicker
          ? {
              cameras: [
                { id: "Cam-01", name: "Loading Bay Cam", zoneCount: zones.length },
                { id: "Cam-02", name: "Yard Cam", zoneCount: 0 },
              ],
              activeId,
              onChange: setActiveId,
            }
          : undefined
      }
      applyToAll={withPicker ? { onClick: () => undefined } : undefined}
    />
  );
}

/** The floor-plan editor is driven entirely by the host page's state. */
export function FloorPlanPreview({ onClose }: { onClose: () => void }) {
  const [tool, setTool] = React.useState<Tool>("select");
  const [drafting, setDrafting] = React.useState<{ points: [number, number][]; color: string } | null>(null);
  const [pendingCameraId, setPendingCameraId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<{ type: "area" | "camera"; id: string } | null>(null);
  const siteCameras = MOCK_CAMERAS.filter((c) => c.siteId === site.id);

  return (
    <FloorPlanModal
      open
      onClose={onClose}
      site={site}
      siteCameras={siteCameras}
      unplacedCameras={siteCameras.filter((c) => !site.cameraPlacements[c.id])}
      tool={tool}
      setTool={setTool}
      drafting={drafting}
      setDrafting={setDrafting}
      pendingCameraId={pendingCameraId}
      setPendingCameraId={setPendingCameraId}
      selected={selected}
      setSelected={setSelected}
      onStartNewArea={() => setTool("draw-area")}
      onPlaceCamera={setPendingCameraId}
      onCommitArea={() => setDrafting(null)}
      onMovePlacement={() => undefined}
      onRotatePlacement={() => undefined}
      onSelectArea={(id) => setSelected({ type: "area", id })}
      onEditArea={() => undefined}
      onDeleteArea={() => undefined}
      onRemovePlacement={() => undefined}
      onFloorPlanUpload={() => undefined}
      onSampleFloorPlan={() => undefined}
      onDeleteFloorPlan={() => undefined}
    />
  );
}
