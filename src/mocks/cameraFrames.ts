import warehouseAisle from "@/assets/live-monitoring/warehouse-aisle.webp";
import loadingDock from "@/assets/live-monitoring/loading-dock.webp";
import productionLine from "@/assets/live-monitoring/production-line.webp";
import packingConveyor from "@/assets/live-monitoring/packing-conveyor.webp";
import corridorDoors from "@/assets/live-monitoring/corridor-doors.webp";
import plantRoom from "@/assets/live-monitoring/plant-room.webp";
import warehouseYardDoor from "@/assets/live-monitoring/warehouse-yard-door.webp";
import controlRoom from "@/assets/live-monitoring/control-room.webp";
import offlineDock from "@/assets/live-monitoring/offline-dock.webp";

/* Still frames standing in for the live streams.

   One per online camera, picked so the scene suits what the camera watches —
   the dock camera shows a dock, the yard camera shows the roller door. A camera
   with no frame falls back to the gradient placeholder. */

const CAMERA_FRAMES: Record<string, string> = {
  "Cam-01": warehouseAisle,      // Checkpoint C1 — Entry
  "Cam-04": loadingDock,         // Loading Bay 3 — Dock
  "Cam-07": warehouseYardDoor,   // Loading Bay 3 — Yard
  "Cam-09": packingConveyor,     // Armoury A — Door
  "Cam-12": plantRoom,           // Armoury A — Interior
  "Cam-15": productionLine,      // Medical Bay 2
  "Cam-18": controlRoom,         // HQ Lobby — Reception
  "Cam-22": corridorDoors,       // HQ Lobby — Atrium
};

/** Shown for a camera that is offline or unreachable. */
export const OFFLINE_FRAME = offlineDock;

/** The frame for a camera, or undefined when it has none. */
export function cameraFrame(cameraId: string): string | undefined {
  return CAMERA_FRAMES[cameraId];
}
