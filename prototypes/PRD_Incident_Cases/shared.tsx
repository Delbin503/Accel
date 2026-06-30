/** Dev-only forced states for the State Tester (prototype-only).
 *  Mirrors the real page's CasesForcedState. The same toggle drives both the
 *  list page AND the open case drawer (loading / error). */
export type ForcedState = "normal" | "loading" | "empty" | "error";
