import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

// Interaction tests for design-system components (jsdom + Testing Library).
// Design-system tests live in packages/ui/test/ (component folders hold only
// components and stories — the registry check treats .tsx there as components).
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      include: ["packages/ui/test/**/*.test.tsx"],
      setupFiles: ["packages/ui/test/setup.ts"],
      css: false,
    },
  })
);
