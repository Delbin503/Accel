import { create } from "zustand";
import { persist } from "zustand/middleware";

/* NVR defaults that other screens read. System Configuration → NVR Defaults
   sets them; Recordings uses the max. length per video to show how a recording
   is stored as files. Persisted so the choice survives a reload. */

interface NvrDefaultsState {
  /** Where an NVR cuts a recording into a new video file, in minutes. Null keeps one file per recording. */
  maxVideoMinutes: number | null;
  setMaxVideoMinutes: (minutes: number | null) => void;
}

export const useNvrDefaultsStore = create<NvrDefaultsState>()(
  persist(
    (set) => ({
      maxVideoMinutes: 180,
      setMaxVideoMinutes: (maxVideoMinutes) => set({ maxVideoMinutes }),
    }),
    { name: "accel-nvr-defaults" },
  ),
);

/** "30 min", "3 h" — a max. length as the NVR Defaults dropdown names it. */
export function formatVideoLength(minutes: number): string {
  return minutes >= 60 ? `${minutes / 60} h` : `${minutes} min`;
}
