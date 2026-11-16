import type { Preview } from "@storybook/react-vite";
import { ThemeRoot } from "./ThemeRoot";
import { applyTheme } from "./theme";
import "../src/index.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Color scheme",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  // Theme <html> before the story renders, so nothing paints (or animates
  // via transition-colors) from the wrong theme first.
  beforeEach: ({ globals }) => {
    applyTheme(globals.theme ?? "dark");
  },
  decorators: [
    (Story, context) => (
      <ThemeRoot theme={context.globals.theme ?? "dark"}>
        <Story />
      </ThemeRoot>
    ),
  ],
  parameters: {
    options: {
      storySort: {
        order: ["Introduction", "Foundations", "Guidelines", "UI", "Shared", "Charts"],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
  },
};

export default preview;
