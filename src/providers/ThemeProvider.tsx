import * as React from "react";

import { ThemeContext, type Theme } from "./theme-context";

// ThemeContext and useTheme live in ./theme-context.ts so this file only exports
// components (React Fast Refresh).

// Must match the key used in the anti-FOUC script in index.html.
const STORAGE_KEY = "dashboard-theme";

function isValidTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : defaultTheme;
  });

  // Sync class on <html> and persist whenever theme changes.
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = React.useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
