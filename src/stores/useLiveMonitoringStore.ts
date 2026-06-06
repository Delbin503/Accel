import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LiveLayout = "auto" | "1x1" | "2x2" | "3x3" | "4x4";

export type CustomTile = {
  id: string;
  cameraId: string;
  col: number;
  row: number;
  cols: number;
  rows: number;
};

export type CustomLayout = {
  id: string;
  name: string;
  tiles: CustomTile[];
  /** User-configurable grid dimensions. Defaults backfilled to 12×8. */
  cols?: number;
  rows?: number;
};

interface LiveMonitoringState {
  pinned: string[];
  layout: LiveLayout;
  customLayouts: CustomLayout[];
  activeLayoutId: string | null;

  togglePin: (cameraId: string) => void;
  setLayout: (layout: LiveLayout) => void;
  clearPins: () => void;

  createLayout: (name: string) => string;             // returns new layout id
  renameLayout: (id: string, name: string) => void;
  deleteLayout: (id: string) => void;
  setActiveLayout: (id: string | null) => void;
  setLayoutTiles: (id: string, tiles: CustomTile[]) => void;
  setLayoutGrid:  (id: string, cols: number, rows: number) => void;
  duplicateLayout: (id: string, newName: string) => string;
}

const STARTER_LAYOUT: CustomLayout = {
  id: "layout-default",
  name: "Default View",
  tiles: [],
};

export const useLiveMonitoringStore = create<LiveMonitoringState>()(
  persist(
    (set, get) => ({
      pinned: [],
      layout: "auto",
      customLayouts: [STARTER_LAYOUT],
      activeLayoutId: STARTER_LAYOUT.id,

      togglePin: (cameraId) =>
        set((s) => ({
          pinned: s.pinned.includes(cameraId)
            ? s.pinned.filter((id) => id !== cameraId)
            : [...s.pinned, cameraId],
        })),
      setLayout: (layout) => set({ layout }),
      clearPins: () => set({ pinned: [] }),

      createLayout: (name) => {
        const id = `layout-${Math.random().toString(36).slice(2, 8)}`;
        set((s) => ({
          customLayouts: [...s.customLayouts, { id, name, tiles: [] }],
          activeLayoutId: id,
        }));
        return id;
      },
      renameLayout: (id, name) =>
        set((s) => ({
          customLayouts: s.customLayouts.map((l) => (l.id === id ? { ...l, name } : l)),
        })),
      deleteLayout: (id) =>
        set((s) => {
          const next = s.customLayouts.filter((l) => l.id !== id);
          // If nothing remains, recreate a default; otherwise switch active if needed.
          if (next.length === 0) {
            const fresh = { ...STARTER_LAYOUT, id: `layout-${Math.random().toString(36).slice(2, 8)}` };
            return { customLayouts: [fresh], activeLayoutId: fresh.id };
          }
          return {
            customLayouts: next,
            activeLayoutId: s.activeLayoutId === id ? next[0].id : s.activeLayoutId,
          };
        }),
      setActiveLayout: (id) => set({ activeLayoutId: id }),
      setLayoutTiles: (id, tiles) =>
        set((s) => ({
          customLayouts: s.customLayouts.map((l) => (l.id === id ? { ...l, tiles } : l)),
        })),
      setLayoutGrid: (id, cols, rows) =>
        set((s) => ({
          customLayouts: s.customLayouts.map((l) => {
            if (l.id !== id) return l;
            // Clamp existing tiles so they fit the new grid bounds.
            const tiles = l.tiles.map((t) => ({
              ...t,
              col:  Math.min(t.col,  cols - t.cols + 1),
              row:  Math.min(t.row,  rows - t.rows + 1),
              cols: Math.min(t.cols, cols),
              rows: Math.min(t.rows, rows),
            }));
            return { ...l, cols, rows, tiles };
          }),
        })),
      duplicateLayout: (id, newName) => {
        const source = get().customLayouts.find((l) => l.id === id);
        if (!source) return id;
        const newId = `layout-${Math.random().toString(36).slice(2, 8)}`;
        set((s) => ({
          customLayouts: [...s.customLayouts, { id: newId, name: newName, tiles: source.tiles.map((t) => ({ ...t, id: `tile-${Math.random().toString(36).slice(2, 7)}` })) }],
          activeLayoutId: newId,
        }));
        return newId;
      },
    }),
    { name: "trms.live-monitoring" }
  )
);
