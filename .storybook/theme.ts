/** Puts the theme class on <html>, as the app does. */
export function applyTheme(theme: string) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}
