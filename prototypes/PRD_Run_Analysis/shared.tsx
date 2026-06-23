/** Dev-only forced states for the State Tester (prototype-only).
 *  Mirrors the real page's RunForcedState. A run failure is an action-triggered
 *  toast (try running an analysis), not a forced page state. */
export type ForcedState = "normal" | "loading" | "empty" | "noresults" | "error";
