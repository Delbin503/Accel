export type SiteStatus = "active" | "setup" | "inactive";

export interface AreaShape {
  id: string;
  name: string;
  color: string;
  /** Normalized polygon points in 0..1 range relative to floor plan. Empty = not yet drawn. */
  points: [number, number][];
}

export interface CameraPlacement {
  /** Normalized position in 0..1 range. */
  x: number;
  y: number;
  /** Facing rotation in degrees, 0 = up. */
  rotation: number;
}

export interface FloorPlan {
  imageUrl: string | null;
  label?: string;
  width: number;
  height: number;
}

export interface SiteData {
  id: string;
  name: string;
  address: string;
  timezone: string;
  description?: string;
  status: SiteStatus;
  floorPlan: FloorPlan | null;
  areas: AreaShape[];
  /** Camera placements keyed by camera ID (refers to useCamerasStore.cameras). */
  cameraPlacements: Record<string, CameraPlacement>;
  createdAt: string;
  createdAtDisplay: string;
  accent: string;
}
