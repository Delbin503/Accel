import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Add case notes…", className: "w-80" },
};

export const WithValue: Story = {
  args: {
    className: "w-80",
    defaultValue: "Suspicious vehicle loitering near the loading dock for ~12 minutes.",
  },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true, className: "w-80" },
};

export const Invalid: Story = {
  args: { placeholder: "Required", "aria-invalid": true, className: "w-80" },
};
