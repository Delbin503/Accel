import { create } from "zustand";

export interface Site {
  id: string;
  name: string;
}

export const MOCK_SITES: Site[] = [
  { id: "all", name: "All Sites" },
  { id: "site-001", name: "HQ — Tower A" },
  { id: "site-002", name: "Warehouse B" },
  { id: "site-003", name: "Data Center C" },
  { id: "site-004", name: "Retail Outlet D" },
];

interface SiteFilterState {
  activeSiteId: string;
  setActiveSiteId: (id: string) => void;
  activeSite: () => Site;
}

export const useSiteFilterStore = create<SiteFilterState>()((set, get) => ({
  activeSiteId: "all",
  setActiveSiteId: (id) => set({ activeSiteId: id }),
  activeSite: () =>
    MOCK_SITES.find((s) => s.id === get().activeSiteId) ?? MOCK_SITES[0],
}));
