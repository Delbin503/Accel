import React from "react";
import { useAppStore, useUser, useCounter } from "../../store/zustand";

// Example 1: Using individual selectors for better performance
function UserProfile() {
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <h2>User Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Example 2: Using custom hook
function CounterComponent() {
  const { count, increment, decrement, reset } = useCounter();

  return (
    <div className="p-4 border rounded">
      <h3 className="text-xl font-bold mb-4">Counter Example</h3>
      <div className="flex items-center gap-4">
        <button
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -
        </button>
        <span className="text-2xl font-bold">{count}</span>
        <button
          onClick={increment}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          +
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// Example 3: Login form using Zustand
function LoginForm() {
  const setUser = useAppStore((state) => state.setUser);
  const [formData, setFormData] = React.useState({ email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate login
    setUser({
      id: 1,
      name: "John Doe",
      email: formData.email,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold">Login</h3>
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        className="w-full px-4 py-2 border rounded"
      />
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Login
      </button>
    </form>
  );
}

// Main example component combining all examples
export default function ZustandExample() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Zustand Examples</h1>

      <div className="space-y-4">
        {!isAuthenticated ? <LoginForm /> : <UserProfile />}
      </div>

      <CounterComponent />

      <div className="p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Tips:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>State is persisted in localStorage</li>
          <li>Open Redux DevTools to see state changes</li>
          <li>No Provider needed - just import and use!</li>
          <li>
            Each component only re-renders when its selected state changes
          </li>
        </ul>
      </div>
    </div>
  );
}
