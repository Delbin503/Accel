import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../ui/button";
import { Stepper } from "./Stepper";

const meta: Meta<typeof Stepper> = {
  title: "Shared/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const SIGN_UP = [
  { id: "account", label: "Create Account" },
  { id: "plan", label: "Subscribe Plan" },
  { id: "site", label: "Create Site" },
  { id: "team", label: "Invite Team" },
];

export const Default: Story = {
  args: { steps: SIGN_UP, current: 1 },
  render: (args) => (
    <div className="w-[40rem]">
      <Stepper {...args} />
    </div>
  ),
};

export const AllDone: Story = {
  args: { steps: SIGN_UP, current: SIGN_UP.length, labels: "always" },
  render: (args) => (
    <div className="w-[40rem]">
      <Stepper {...args} />
    </div>
  ),
};

function InteractiveDemo() {
  const steps = [
    { id: "camera", label: "Camera" },
    { id: "stream", label: "Stream" },
    { id: "zone", label: "Zones" },
  ];
  const [current, setCurrent] = React.useState(0);
  return (
    <div className="flex w-[32rem] flex-col gap-4">
      <Stepper steps={steps} current={current} labels="always" aria-label="Add camera progress" />
      <div className="flex justify-between">
        <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          Back
        </Button>
        <Button disabled={current === steps.length} onClick={() => setCurrent((c) => c + 1)}>
          {current >= steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}

/** The Stepper only shows progress; Back / Next stay with the page. */
export const WithNavigation: Story = {
  render: () => <InteractiveDemo />,
};
