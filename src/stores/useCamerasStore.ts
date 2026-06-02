import { create } from "zustand";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import type { CameraData } from "@/types/cameras";

interface CamerasState {
  cameras: CameraData[];
  addCamera: (camera: CameraData) => void;
  updateCamera: (id: string, patch: Partial<CameraData>) => void;
  deleteCamera: (id: string) => void;
  setCameras: (cameras: CameraData[]) => void;
}

export const useCamerasStore = create<CamerasState>((set) => ({
  cameras: [...MOCK_CAMERAS],
  addCamera: (camera) => set((s) => ({ cameras: [camera, ...s.cameras] })),
  updateCamera: (id, patch) =>
    set((s) => ({ cameras: s.cameras.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  deleteCamera: (id) => set((s) => ({ cameras: s.cameras.filter((c) => c.id !== id) })),
  setCameras: (cameras) => set({ cameras }),
}));
