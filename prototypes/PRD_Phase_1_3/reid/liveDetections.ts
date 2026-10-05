import { create } from "zustand";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import type { DetectionEvent } from "@/types/detection";

/* Live detections raised on the camera wall.

   Kept in a store rather than page state so the list survives the round trip
   to the Detection Feed: clicking a card leaves Live Monitoring, and coming
   back should still show what was detected.

   Each live detection points at a real Detection Feed event, so opening one
   lands on that event's own details drawer. */

export interface LiveDetection {
  /** Unique per raise — the same feed event can be raised again later. */
  id: string;
  event: DetectionEvent;
  /** When the wall raised it (ms). */
  at: number;
}

/** The Detections tab keeps the most recent ones; older rows live in the feed. */
const MAX_KEPT = 50;

interface LiveDetectionsState {
  detections: LiveDetection[];
  /** Ids still showing as a card in the corner stack. */
  cardIds: string[];
  /** How many have been raised — walks the simulated feed forward. */
  raised: number;
  /** `quiet` lists it without a corner card — for when the Detections tab is already showing it. */
  raise: (cameraIds: string[], quiet?: boolean) => void;
  dismissCard: (id: string) => void;
  clearCards: () => void;
}

export const useLiveDetectionsStore = create<LiveDetectionsState>((set) => ({
  detections: [],
  cardIds: [],
  raised: 0,
  /** Raises the next feed event that belongs to one of the given (online) cameras. */
  raise: (cameraIds, quiet = false) =>
    set((s) => {
      const pool = MOCK_EVENTS.filter((e) => e.status !== "dismissed" && cameraIds.includes(e.camera));
      if (pool.length === 0) return s;
      const event = pool[s.raised % pool.length];
      const detection: LiveDetection = { id: `live-${s.raised + 1}`, event, at: Date.now() };
      return {
        raised: s.raised + 1,
        detections: [detection, ...s.detections].slice(0, MAX_KEPT),
        cardIds: quiet ? s.cardIds : [detection.id, ...s.cardIds],
      };
    }),
  dismissCard: (id) => set((s) => ({ cardIds: s.cardIds.filter((x) => x !== id) })),
  clearCards: () => set({ cardIds: [] }),
}));

/** Feed summaries carry inline markup ([[ref]], **bold**, !!anomaly!!) — cards show plain text. */
export const plainSummary = (summary: string) => summary.replace(/\[\[|\]\]|\*\*|!!/g, "");

/** Seconds-resolution "ago" for a live list; the shared formatter stops at minutes. */
export function agoLabel(at: number, now: number) {
  const sec = Math.max(0, Math.floor((now - at) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  return `${Math.floor(min / 60)} hr ago`;
}

/** Where the Detection Feed opens a given event's details drawer. */
export const feedDrawerPath = (eventId: string) => `/reid/detections?event=${encodeURIComponent(eventId)}`;
