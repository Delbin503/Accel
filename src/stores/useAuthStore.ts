import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "operator" | "viewer";

export interface AuthUser {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  email: string;
  notificationCount: number;
  /** Organization name picked at signup. */
  orgName?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** True once user has created at least one site AND purchased a subscription. */
  hasCompletedOnboarding: boolean;
  /** True after at least one site has been created during onboarding. */
  hasCreatedSite: boolean;
  /** True after at least one subscription has been activated. */
  hasActiveSubscription: boolean;
  signIn: (user: AuthUser) => void;
  signUp: (user: AuthUser) => void;
  signOut: () => void;
  setHasCreatedSite: (v: boolean) => void;
  setHasActiveSubscription: (v: boolean) => void;
  completeOnboarding: () => void;
  setUser: (user: AuthUser | null) => void;
}

const DEFAULT_USER: AuthUser = {
  id: "usr-001",
  name: "Delbin Arkar",
  initials: "DA",
  role: "admin",
  email: "delbin@accel.ai",
  notificationCount: 4,
  orgName: "Accel TRMS",
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: DEFAULT_USER,
      // Returning user with a seeded workspace — already onboarded by default.
      // Cleared by signOut and re-seeded after signIn/signUp.
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      hasCreatedSite: true,
      hasActiveSubscription: true,
      signIn: (user) =>
        set({
          user,
          isAuthenticated: true,
          // Returning sign-in assumes the account is already set up.
          hasCompletedOnboarding: true,
          hasCreatedSite: true,
          hasActiveSubscription: true,
        }),
      signUp: (user) =>
        set({
          user,
          isAuthenticated: true,
          // Fresh sign-up: forced through onboarding before reaching the dashboard.
          hasCompletedOnboarding: false,
          hasCreatedSite: false,
          hasActiveSubscription: false,
        }),
      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          hasCreatedSite: false,
          hasActiveSubscription: false,
        }),
      setHasCreatedSite: (v) => set({ hasCreatedSite: v }),
      setHasActiveSubscription: (v) => set({ hasActiveSubscription: v }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setUser: (user) => set({ user }),
    }),
    { name: "accel-auth" }
  )
);
