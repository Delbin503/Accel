import { create } from "zustand";
import { persist, createJSONStorage, devtools } from "zustand/middleware";
import { createUserSlice } from "./slices/userSlice";
import { createCounterSlice } from "./slices/counterSlice";
import { createAuthSlice } from "./slices/authSlice";

// Combined store with multiple slices
export const useAppStore = create(
  devtools(
    persist(
      (...args) => ({
        ...createUserSlice(...args),
        ...createCounterSlice(...args),
        ...createAuthSlice(...args),
      }),
      {
        name: "app-storage",
        storage: createJSONStorage(() => localStorage),
        // Only persist user data and auth state, not counter
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          token: state.token,
        }),
      }
    ),
    {
      name: "AppStore", // Name shown in Redux DevTools
    }
  )
);

// Export individual hooks for better code splitting (optional)
export const useUser = () =>
  useAppStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    setUser: state.setUser,
    logout: state.logout,
    updateUser: state.updateUser,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
  }));

export const useCounter = () =>
  useAppStore((state) => ({
    count: state.count,
    increment: state.increment,
    decrement: state.decrement,
    incrementByAmount: state.incrementByAmount,
    reset: state.reset,
  }));
