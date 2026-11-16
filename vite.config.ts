import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { aliases } from "./aliases";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // @accel/ui (packages/ui) + the app's "@" — see aliases.ts.
    alias: aliases,
  },
});
