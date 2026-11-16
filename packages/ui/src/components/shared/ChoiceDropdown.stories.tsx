import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChoiceDropdown, type ChoiceOption } from "./ChoiceDropdown";

const meta: Meta<typeof ChoiceDropdown> = {
  title: "Shared/ChoiceDropdown",
  component: ChoiceDropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ChoiceDropdown>;

type Reason = "false-positive" | "duplicate" | "resolved" | "escalated";

const REASONS: ChoiceOption<Reason>[] = [
  { value: "false-positive", label: "False positive", description: "Shadow or reflection triggered the detection." },
  { value: "duplicate", label: "Duplicate", description: "Already raised from a neighbouring camera." },
  { value: "resolved", label: "Resolved on site", description: "Guard attended and cleared the area." },
  { value: "escalated", label: "Escalated", description: "Handed to the site security lead." },
];

type Assignee = "u-1042" | "u-1077" | "u-1103";
const ASSIGNEES: ChoiceOption<Assignee>[] = [
  { value: "u-1042", label: "Priya Raman", hint: "U-1042" },
  { value: "u-1077", label: "Daniel Tan", hint: "U-1077" },
  { value: "u-1103", label: "Aisha Rahman", hint: "U-1103" },
];

/** Dismiss-reason picker with descriptions. */
export const Default: Story = {
  render: function DefaultStory() {
    const [value, setValue] = React.useState<Reason>("false-positive");
    return (
      <div className="w-72">
        <ChoiceDropdown value={value} onChange={setValue} options={REASONS} ariaLabel="Dismiss reason" />
      </div>
    );
  },
};

/** Options with a mono hint on the right (user IDs). */
export const WithHints: Story = {
  render: function HintsStory() {
    const [value, setValue] = React.useState<Assignee>("u-1077");
    return (
      <div className="w-72">
        <ChoiceDropdown value={value} onChange={setValue} options={ASSIGNEES} ariaLabel="Assign to" />
      </div>
    );
  },
};
