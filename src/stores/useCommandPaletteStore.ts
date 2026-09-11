import { create } from "zustand";

/** Which face of the palette opens first. Typing searches everything either way. */
export type PaletteMode = "search" | "actions";

interface CommandPaletteState {
  open: boolean;
  mode: PaletteMode;
  /** Lives here rather than in the palette so opening can reset it in one go. */
  query: string;
  openPalette: (mode?: PaletteMode) => void;
  closePalette: () => void;
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
}

export const useCommandPaletteStore = create<CommandPaletteState>()((set) => ({
  open: false,
  mode: "search",
  query: "",
  openPalette: (mode = "search") => set({ open: true, mode, query: "" }),
  // The query is reset on open, never on close — clearing it while the dialog
  // plays its exit animation flashes the idle list at the user.
  closePalette: () => set({ open: false }),
  setOpen: (open) => set({ open }),
  setQuery: (query) => set({ query }),
}));
