import type { StorybookConfig } from "@storybook/react-vite";
import { aliases } from "../aliases";


const config: StorybookConfig = {
  stories: [
    "../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
  ],
  framework: "@storybook/react-vite",
  viteFinal(config) {
    // @accel/ui (packages/ui) + the app's "@" — see aliases.ts.
    config.resolve = { ...config.resolve, alias: aliases };
    return config;
  },
};

export default config;
