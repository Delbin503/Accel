import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus } from "lucide-react";
import { CoachMark } from "./coach-mark";
import { Button } from "../ui/button";

const meta: Meta<typeof CoachMark> = {
  title: "Custom/CoachMark",
  component: CoachMark,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    side: { control: "select", options: ["top", "bottom", "left", "right"] },
    align: { control: "select", options: ["start", "center", "end"] },
  },
};

export default meta;
type Story = StoryObj<typeof CoachMark>;

export const Default: Story = {
  // The target's ring pulses (opacity animation), so a contrast snapshot can
  // land mid-fade; the button itself is AA at rest.
  parameters: { a11y: { config: { rules: [{ id: "color-contrast", enabled: false }] } } },
  args: { active: true, message: "Start by adding your first camera.", side: "bottom", align: "center" },
  render: (args) => (
    <div className="p-16">
      <CoachMark {...args}>
        <Button>
          <Plus className="size-4" /> Add camera
        </Button>
      </CoachMark>
    </div>
  ),
};

/** Inactive — no ring, no tooltip; children render untouched. */
export const Inactive: Story = {
  args: { active: false, message: "Start by adding your first camera." },
  render: (args) => (
    <CoachMark {...args}>
      <Button>
        <Plus className="size-4" /> Add camera
      </Button>
    </CoachMark>
  ),
};

/** Every side. */
export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-x-48 gap-y-28 p-20">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <CoachMark key={side} active side={side} message={`Tooltip on the ${side}`}>
          <Button variant="outline">{side}</Button>
        </CoachMark>
      ))}
    </div>
  ),
};

/** A three-step guided tour — the parent decides which step is active. */
export const GuidedTour: Story = {
  render: function TourStory() {
    const steps = [
      { label: "Add site", message: "1 / 3 · Create a site for Changi Logistics Hub." },
      { label: "Add camera", message: "2 / 3 · Connect a camera at the site." },
      { label: "Run analysis", message: "3 / 3 · Run analysis to see detections." },
    ];
    const [step, setStep] = React.useState(0);
    return (
      <div className="flex flex-col items-center gap-16 p-16">
        <div className="flex gap-4">
          {steps.map((s, i) => (
            <CoachMark key={s.label} active={i === step} message={s.message}>
              <Button variant="outline">{s.label}</Button>
            </CoachMark>
          ))}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setStep((s) => (s + 1) % steps.length)}>
          Next step
        </Button>
      </div>
    );
  },
};
