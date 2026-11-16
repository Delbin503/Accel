import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TimeSelect } from "./TimeSelect";
import { Label } from "../ui/label";

const meta: Meta<typeof TimeSelect> = {
  title: "Shared/TimeSelect",
  component: TimeSelect,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-56"><Story /></div>],
};

export default meta;
type Story = StoryObj<typeof TimeSelect>;

function Controlled(props: Omit<React.ComponentProps<typeof TimeSelect>, "value" | "onChange"> & { initial?: string }) {
  const { initial = "", ...rest } = props;
  const [value, setValue] = React.useState(initial);
  return <TimeSelect value={value} onChange={setValue} {...rest} />;
}

/** Empty — shows the placeholder. Edits are held until OK. */
export const Default: Story = {
  render: () => (
    <div className="space-y-1.5">
      <Label>Monitoring starts</Label>
      <Controlled aria-label="Monitoring starts" />
    </div>
  ),
};

export const WithValue: Story = {
  render: () => <Controlled initial="18:30" aria-label="Monitoring ends" />,
};

/** Coarser minute grid via `step`. */
export const QuarterHourStep: Story = {
  render: () => <Controlled initial="09:45" step={15} aria-label="Shift change" />,
};

export const Invalid: Story = {
  render: () => (
    <div className="space-y-1">
      <Controlled initial="06:00" invalid aria-label="Monitoring ends" />
      <p className="text-xs text-severity-critical">End time must be after the start time.</p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <Controlled initial="00:00" disabled aria-label="24-hour monitoring" />,
};
