import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: { value: 60, className: "w-80", "aria-label": "Upload progress" },
};

export const Steps: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Progress value={25} aria-label="Step 1 of 4" />
      <Progress value={50} aria-label="Step 2 of 4" />
      <Progress value={75} aria-label="Step 3 of 4" />
      <Progress value={100} aria-label="Step 4 of 4" />
    </div>
  ),
};
