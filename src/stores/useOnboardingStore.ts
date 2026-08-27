import { create } from "zustand";
import { persist } from "zustand/middleware";

/** One-time coach marks / first-run guides. Persisted so they don't nag. */
interface OnboardingState {
  floorPlanGuideSeen: boolean;
  dismissFloorPlanGuide: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      floorPlanGuideSeen: false,
      dismissFloorPlanGuide: () => set({ floorPlanGuideSeen: true }),
    }),
    { name: "accel-onboarding" }
  )
);
