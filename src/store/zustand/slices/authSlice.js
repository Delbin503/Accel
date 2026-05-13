export const createAuthSlice = (set) => ({
  // Auth state
  token: localStorage.getItem("accessToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),

  // Set authentication token
  setToken: (token) => {
    if (token) {
      localStorage.setItem("accessToken", token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem("accessToken");
      set({ token: null, isAuthenticated: false });
    }
  },

  // Logout function
  logout: () => {
    localStorage.removeItem("accessToken");
    set({
      token: null,
      isAuthenticated: false,
      user: null,
    });
  },

  // Check if token is expired (optional - implement based on your token structure)
  checkTokenExpiry: () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      set({ token: null, isAuthenticated: false });
      return false;
    }

    try {
      // Decode JWT token and check expiry
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        localStorage.removeItem("accessToken");
        set({ token: null, isAuthenticated: false, user: null });
        return false;
      }

      return true;
    } catch (error) {
      // If token is invalid, clear it
      localStorage.removeItem("accessToken");
      set({ token: null, isAuthenticated: false, user: null });
      return false;
    }
  },
});
