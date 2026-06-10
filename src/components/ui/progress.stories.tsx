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
  args: { value: 60, className: "w-80" },
};

export const Steps: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={75} />
      <Progress value={100} />
    </div>
  ),
};
