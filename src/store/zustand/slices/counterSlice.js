// Counter slice - example of a simple slice
export const createCounterSlice = (set) => ({
  count: 0,

  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  incrementByAmount: (amount) =>
    set((state) => ({ count: state.count + amount })),
  reset: () => set({ count: 0 }),
});
