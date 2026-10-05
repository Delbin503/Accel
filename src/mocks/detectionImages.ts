import armouryAssetRemoval from "@/assets/detection-feed/armoury-asset-removal.webp";
import serverRoomEntry from "@/assets/detection-feed/server-room-entry.webp";
import checkpointPatdown from "@/assets/detection-feed/checkpoint-patdown.webp";

/* Captured frames for detection events.

   Each frame already carries the detection overlay burned in — the box, the
   label and the reason — so a card or drawer showing one hides its own
   synthetic bounding boxes rather than drawing a second set on top.

   Events without a frame fall back to the gradient placeholder. */

export const EVENT_IMAGES: Record<string, string> = {
  "EVT-2026-0519-001": armouryAssetRemoval, // Armoury-B — asset removed without a matching access record
  "EVT-2026-0519-002": serverRoomEntry,     // Server-Room-3 — entry with no clearance on file
  "EVT-2026-0519-003": checkpointPatdown,   // Checkpoint — pat-down missing torso and ankle checks
};

/**
 * The frame for an event, if one exists.
 *
 * The Detection Feed prototype clones the mock events to fill a longer list,
 * suffixing their ids (`EVT-…-001-c7`). A clone stands for the same detection,
 * so it shows the same frame.
 */
export function eventImage(id: string): string | undefined {
  return EVENT_IMAGES[id.replace(/-c\d+$/, "")];
}
