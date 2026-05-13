# Zustand Store Configuration

This directory contains the Zustand state management setup for the application.

## Structure

```
zustand/
├── index.js              # Main store export with combined slices
├── useStore.js           # Simple standalone store (alternative approach)
└── slices/
    ├── userSlice.js      # User state and actions
    └── counterSlice.js   # Counter example slice
```

## Usage Examples

### Basic Usage

```javascript
import { useAppStore } from "@/store/zustand";

function MyComponent() {
  // Subscribe to specific state
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  // Or use the custom hook
  const { user, setUser, logout } = useUser();

  return (
    <div>
      <p>User: {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Optimized Performance (Selective Subscription)

```javascript
// Only re-renders when count changes
const count = useAppStore((state) => state.count);

// Multiple values with shallow comparison
import { shallow } from "zustand/shallow";

const { count, increment } = useAppStore(
  (state) => ({ count: state.count, increment: state.increment }),
  shallow
);
```

### Actions Outside Components

```javascript
import { useAppStore } from "@/store/zustand";

// Can be called from anywhere
export const handleLogout = () => {
  useAppStore.getState().logout();
};

export const incrementCounter = () => {
  useAppStore.getState().increment();
};
```

### Async Actions

```javascript
// In your slice
export const createUserSlice = (set, get) => ({
  user: null,
  loading: false,

  fetchUser: async (userId) => {
    set({ loading: true });
    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();
      set({ user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
});
```

## Features

- ✅ **Persistence**: User data automatically saved to localStorage
- ✅ **DevTools**: Redux DevTools integration for debugging
- ✅ **Slices**: Modular state management with separate slices
- ✅ **TypeScript Ready**: Easy to add TypeScript types
- ✅ **No Providers**: No need for context providers like Redux

## Adding New Slices

1. Create a new file in `slices/` directory:

```javascript
// slices/cartSlice.js
export const createCartSlice = (set, get) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),
  clearCart: () => set({ items: [] }),
});
```

2. Import and combine in `index.js`:

```javascript
import { createCartSlice } from "./slices/cartSlice";

export const useAppStore = create(
  persist(
    (...args) => ({
      ...createUserSlice(...args),
      ...createCounterSlice(...args),
      ...createCartSlice(...args), // Add new slice
    })
    // ... rest of config
  )
);
```

## Migration from Redux

Zustand is much simpler than Redux:

**Redux:**

```javascript
// Need action types, action creators, reducers
const INCREMENT = 'INCREMENT';
const increment = () => ({ type: INCREMENT });
const reducer = (state, action) => { ... };
```

**Zustand:**

```javascript
// Just define state and actions together
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
```

## Best Practices

1. **Selective Subscriptions**: Only subscribe to state you need
2. **Separate Concerns**: Use slices for different features
3. **Avoid Derived State**: Compute values in components or use selectors
4. **Name Actions Clearly**: Use verbs like `setUser`, `fetchData`, `updateCart`
5. **Handle Errors**: Include error states in your slices
