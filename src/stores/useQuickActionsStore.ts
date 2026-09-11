import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_PINNED_IDS, MAX_PINNED } from "@/lib/quickActions";

/** What a palette row points at, in a shape that survives `localStorage`. */
export interface RecentEntry {
  /** Stable key — "action:<id>" or "<entityType>:<entityId>". */
  key: string;
  label: string;
  /** Matches a `SearchResultType` or "action"; the icon is resolved at render. */
  type: string;
  sublabel?: string;
  to: string;
  state?: Record<string, unknown>;
}

const MAX_RECENTS = 5;

interface QuickActionsState {
  /** Ordered — the pinned row renders in pin order. */
  pinnedIds: string[];
  /** Most-recent-first, capped at 5. Shown as the palette's default state. */
  recents: RecentEntry[];
  /** Actions switched off in settings — hidden from the palette entirely. */
  disabledIds: string[];
  /** Pin cap. Defaults to MAX_PINNED; configurable from settings. */
  maxPins: number;
  /** Whether the palette's idle state leads with recents. */
  showRecents: boolean;

  togglePin: (id: string) => void;
  unpin: (id: string) => void;
  isPinned: (id: string) => boolean;
  /** Reorder a pin by one slot; -1 moves it up, 1 moves it down. */
  movePin: (id: string, direction: -1 | 1) => void;
  toggleEnabled: (id: string) => void;
  setMaxPins: (max: number) => void;
  setShowRecents: (show: boolean) => void;
  /** Back to shipped defaults — pins, availability, cap and recents. */
  resetPreferences: () => void;
  pushRecent: (entry: RecentEntry) => void;
  clearRecents: () => void;
}

export const useQuickActionsStore = create<QuickActionsState>()(
  persist(
    (set, get) => ({
      pinnedIds: DEFAULT_PINNED_IDS,
      recents: [],
      disabledIds: [],
      maxPins: MAX_PINNED,
      showRecents: true,

      togglePin: (id) =>
        set((s) => {
          if (s.pinnedIds.includes(id)) {
            return { pinnedIds: s.pinnedIds.filter((p) => p !== id) };
          }
          // Silently drop the oldest pin at the cap rather than refusing the pin.
          const next = [...s.pinnedIds, id];
          return { pinnedIds: next.slice(Math.max(0, next.length - s.maxPins)) };
        }),

      unpin: (id) => set((s) => ({ pinnedIds: s.pinnedIds.filter((p) => p !== id) })),

      isPinned: (id) => get().pinnedIds.includes(id),

      movePin: (id, direction) =>
        set((s) => {
          const from = s.pinnedIds.indexOf(id);
          const to = from + direction;
          if (from === -1 || to < 0 || to >= s.pinnedIds.length) return s;
          const next = [...s.pinnedIds];
          [next[from], next[to]] = [next[to], next[from]];
          return { pinnedIds: next };
        }),

      toggleEnabled: (id) =>
        set((s) =>
          s.disabledIds.includes(id)
            ? { disabledIds: s.disabledIds.filter((d) => d !== id) }
            : // A disabled action cannot stay pinned — it would render an empty slot.
              { disabledIds: [...s.disabledIds, id], pinnedIds: s.pinnedIds.filter((p) => p !== id) }
        ),

      setMaxPins: (max) =>
        set((s) => ({
          maxPins: max,
          pinnedIds: s.pinnedIds.slice(0, max),
        })),

      setShowRecents: (showRecents) => set({ showRecents }),

      resetPreferences: () =>
        set({
          pinnedIds: DEFAULT_PINNED_IDS,
          disabledIds: [],
          maxPins: MAX_PINNED,
          showRecents: true,
        }),

      pushRecent: (entry) =>
        set((s) => ({
          recents: [entry, ...s.recents.filter((r) => r.key !== entry.key)].slice(0, MAX_RECENTS),
        })),

      clearRecents: () => set({ recents: [] }),
    }),
    { name: "accel-quick-actions" }
  )
);
