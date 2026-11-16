import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressRow } from "./ProgressRow";

const meta: Meta<typeof ProgressRow> = {
  title: "Shared/ProgressRow",
  component: ProgressRow,
  tags: ["autodocs"],
  decorators: [(Story) => <div className="w-96"><Story /></div>],
  argTypes: { progress: { control: { type: "range", min: 0, max: 100 } } },
};

export default meta;
type Story = StoryObj<typeof ProgressRow>;

export const Default: Story = {
  args: { progress: 42, label: "173 of 412 recordings exported" },
};

export const Starting: Story = {
  args: { progress: 0, label: "Preparing CAM-014 footage…" },
};

/** Turns green at 100%. */
export const Complete: Story = {
  args: { progress: 100, label: "412 of 412 recordings exported" },
};

export const Stack: Story = {
  render: () => (
    <div className="space-y-4">
      <ProgressRow progress={100} label="Changi Logistics Hub · 6 cameras" />
      <ProgressRow progress={64} label="Jurong Warehouse 2 · 9 cameras" />
      <ProgressRow progress={8} label="Tuas Depot · 4 cameras" />
    </div>
  ),
};
