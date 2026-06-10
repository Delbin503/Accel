import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, existsSync } from "fs";
import { resolve } from "path";

const prototypeRoot = __dirname;

// Auto-discover prototype slugs (any subfolder with an index.tsx)
const slugs = readdirSync(prototypeRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(resolve(prototypeRoot, d.name, "index.tsx")))
  .map((d) => d.name);

const input: Record<string, string> = {
  main: resolve(prototypeRoot, "index.html"),
};
slugs.forEach((slug) => {
  input[slug] = resolve(prototypeRoot, slug, "index.html");
});

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: prototypeRoot,
  base: "/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "../src"),
    },
  },
  build: {
    rollupOptions: { input },
    outDir: resolve(__dirname, "../dist-prototypes"),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
  },
});
