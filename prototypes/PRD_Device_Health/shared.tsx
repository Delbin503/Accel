/** Dev-only forced states for the State Tester (prototype-only).
 *  Mirrors the real page's DeviceHealthForcedState. Device Health has no detail
 *  drawer — rows link out to the Cameras / NVR pages. */
export type ForcedState = "normal" | "loading" | "empty" | "error";
