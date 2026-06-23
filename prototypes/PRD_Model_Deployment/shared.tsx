/** Dev-only forced states for the State Tester (prototype-only).
 *  Mirrors the real page's DeployForcedState. Deploy failures are an
 *  action-triggered toast, not a forced page state. */
export type ForcedState = "normal" | "loading" | "empty" | "error";
