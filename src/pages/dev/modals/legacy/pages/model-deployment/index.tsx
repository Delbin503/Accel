/**
 * Frozen copy of src/pages/model-deployment/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/model-deployment/index.tsx.
 */
import { Rocket, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import type { ModelData } from "@/types/modelManagement";
import type { CameraData } from "@/types/cameras";
import type { SiteSummary, AreaSummary } from "@/types/deployments";

/* ─── Deployment confirm modal ───────────────────────────────────────────── */

/**
 * Final review before deployment records are written. Extracted from the
 * wizard so it can be mounted on its own (the modal gallery does exactly that).
 */
export function DeployConfirmModal({
  open,
  model,
  site,
  areas,
  cameras,
  camerasWithZones,
  zoneCount = camerasWithZones,
  onClose,
  onConfirm,
}: {
  open: boolean;
  model: ModelData | null;
  site: SiteSummary | null;
  areas: AreaSummary[];
  cameras: CameraData[];
  camerasWithZones: number;
  /** Zones drawn across all selected cameras — a camera can carry several. */
  zoneCount?: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const selectedModel = model;
  const selectedSite = site;
  const selectedAreas = areas;
  const selectedCameras = cameras;

  return (
      <Modal open={open} onOpenChange={(v) => !v && onClose()}>
        <ModalContent size="lg">
          <ModalHeader
            title="Confirm Deployment"
            description={<>Creating {selectedCameras.length} deployment record{selectedCameras.length === 1 ? "" : "s"}.</>}
            icon={Rocket}
          />
          {selectedModel && selectedSite && (
            <ModalBody className="space-y-3">
              <KvRow label="Model" value={selectedModel.name} />
              <KvRow label="Site" value={selectedSite.siteName} />
              <KvRow label="Areas" value={`${selectedAreas.length} (${selectedAreas.map((a) => a.areaName).join(", ")})`} />
              <KvRow label="Cameras" value={`${selectedCameras.length} selected`} />
              <KvRow
                label="Detection zones"
                value={
                  camerasWithZones === 0
                    ? "Whole frame (no zones drawn)"
                    : `${zoneCount} zone${zoneCount === 1 ? "" : "s"} across ${camerasWithZones} camera${camerasWithZones === 1 ? "" : "s"}`
                }
              />
              {selectedCameras.some((c) => c.status !== "online") && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2 text-xs text-muted-foreground">
                  <AlertTriangle className="size-3.5 flex-shrink-0 text-warning" />
                  Some cameras are offline. Those deployments will queue as "Pending" and auto-resume on reconnect.
                </div>
              )}
            </ModalBody>
          )}
          <ModalFooter>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onConfirm} className="gap-1.5">
              <Rocket className="size-3.5" />
              Deploy {selectedCameras.length} Camera{selectedCameras.length === 1 ? "" : "s"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
}

function KvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="font-mono text-3xs uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
