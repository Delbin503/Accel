export const createUserSlice = (set, get) => ({
  user: {
    fullName: "Delbin Designer",
    email: "delbin@bluesilo.com",
    role: "Admin",
  },
  isAuthenticated: true,
  loading: false,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      error: null,
    }),

  logout: () =>
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
});
