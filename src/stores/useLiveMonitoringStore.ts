import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LiveLayout = "auto" | "1x1" | "2x2" | "3x3" | "4x4";

interface LiveMonitoringState {
  pinned: string[];
  layout: LiveLayout;
  togglePin: (cameraId: string) => void;
  setLayout: (layout: LiveLayout) => void;
  clearPins: () => void;
}

export const useLiveMonitoringStore = create<LiveMonitoringState>()(
  persist(
    (set) => ({
      pinned: [],
      layout: "auto",
      togglePin: (cameraId) =>
        set((s) => ({
          pinned: s.pinned.includes(cameraId)
            ? s.pinned.filter((id) => id !== cameraId)
            : [...s.pinned, cameraId],
        })),
      setLayout: (layout) => set({ layout }),
      clearPins: () => set({ pinned: [] }),
    }),
    { name: "trms.live-monitoring" }
  )
);
