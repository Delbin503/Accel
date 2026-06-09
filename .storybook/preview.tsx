import type { Preview } from "@storybook/react-vite";
import React from "react";
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
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "dark";
      return (
        <div className={theme}>
          <div className="min-h-screen bg-background p-6 text-foreground">
            <Story />
          </div>
        </div>
      );
    },
  ],
  parameters: {
    options: {
      storySort: {
        order: ["Introduction", "Foundations", "UI", "Shared", "Charts"],
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
