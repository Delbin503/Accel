import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@" covers all sub-paths (@/components, @/lib, etc.)
      // The named entries below are explicit for clarity and IDE support.
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/lib":        path.resolve(__dirname, "./src/lib"),
      "@/hooks":      path.resolve(__dirname, "./src/hooks"),
      "@/stores":     path.resolve(__dirname, "./src/stores"),
      "@/types":      path.resolve(__dirname, "./src/types"),
      "@/pages":      path.resolve(__dirname, "./src/pages"),
    },
  },
});
