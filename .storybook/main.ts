import type { StorybookConfig } from "@storybook/react-vite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
  ],
  framework: "@storybook/react-vite",
  viteFinal(config) {
    config.resolve = {
      ...config.resolve,
      alias: {
        "@": path.resolve(__dirname, "../src"),
        "@/components": path.resolve(__dirname, "../src/components"),
        "@/lib": path.resolve(__dirname, "../src/lib"),
        "@/hooks": path.resolve(__dirname, "../src/hooks"),
        "@/stores": path.resolve(__dirname, "../src/stores"),
        "@/types": path.resolve(__dirname, "../src/types"),
        "@/pages": path.resolve(__dirname, "../src/pages"),
      },
    };
    return config;
  },
};

export default config;
