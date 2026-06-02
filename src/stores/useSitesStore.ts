import { create } from "zustand";
import { MOCK_SITES_FULL } from "@/mocks/sites";
import type { SiteData, AreaShape, CameraPlacement, FloorPlan } from "@/types/sites";

interface SitesState {
  sites: SiteData[];
  addSite: (site: SiteData) => void;
  updateSite: (id: string, patch: Partial<SiteData>) => void;
  deleteSite: (id: string) => void;

  setFloorPlan: (siteId: string, floorPlan: FloorPlan | null) => void;

  addArea: (siteId: string, area: AreaShape) => void;
  updateArea: (siteId: string, areaId: string, patch: Partial<AreaShape>) => void;
  deleteArea: (siteId: string, areaId: string) => void;

  placeCamera: (siteId: string, cameraId: string, placement: CameraPlacement) => void;
  updatePlacement: (siteId: string, cameraId: string, patch: Partial<CameraPlacement>) => void;
  removePlacement: (siteId: string, cameraId: string) => void;
}

export const useSitesStore = create<SitesState>((set) => ({
  sites: MOCK_SITES_FULL,

  addSite: (site) => set((s) => ({ sites: [site, ...s.sites] })),
  updateSite: (id, patch) =>
    set((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  deleteSite: (id) => set((s) => ({ sites: s.sites.filter((x) => x.id !== id) })),

  setFloorPlan: (siteId, floorPlan) =>
    set((s) => ({ sites: s.sites.map((x) => (x.id === siteId ? { ...x, floorPlan } : x)) })),

  addArea: (siteId, area) =>
    set((s) => ({
      sites: s.sites.map((x) => (x.id === siteId ? { ...x, areas: [...x.areas, area] } : x)),
    })),
  updateArea: (siteId, areaId, patch) =>
    set((s) => ({
      sites: s.sites.map((x) =>
        x.id === siteId
          ? { ...x, areas: x.areas.map((a) => (a.id === areaId ? { ...a, ...patch } : a)) }
          : x
      ),
    })),
  deleteArea: (siteId, areaId) =>
    set((s) => ({
      sites: s.sites.map((x) =>
        x.id === siteId ? { ...x, areas: x.areas.filter((a) => a.id !== areaId) } : x
      ),
    })),

  placeCamera: (siteId, cameraId, placement) =>
    set((s) => ({
      sites: s.sites.map((x) =>
        x.id === siteId
          ? { ...x, cameraPlacements: { ...x.cameraPlacements, [cameraId]: placement } }
          : x
      ),
    })),
  updatePlacement: (siteId, cameraId, patch) =>
    set((s) => ({
      sites: s.sites.map((x) => {
        if (x.id !== siteId) return x;
        const curr = x.cameraPlacements[cameraId];
        if (!curr) return x;
        return { ...x, cameraPlacements: { ...x.cameraPlacements, [cameraId]: { ...curr, ...patch } } };
      }),
    })),
  removePlacement: (siteId, cameraId) =>
    set((s) => ({
      sites: s.sites.map((x) => {
        if (x.id !== siteId) return x;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [cameraId]: _, ...rest } = x.cameraPlacements;
        return { ...x, cameraPlacements: rest };
      }),
    })),
}));
