/* Filter shape for the Recordings proposal. Kept beside the panel that edits
   it rather than inside it, so the panel file only exports components. */

export interface RecordingFilters {
  site: string[];
  area: string[];
  camera: string[];
  type: string[];
}

export const EMPTY_FILTERS: RecordingFilters = { site: [], area: [], camera: [], type: [] };
