import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./label";
import { Input } from "./input";

const meta: Meta<typeof Label> = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => <Label htmlFor="name">Site name</Label>,
};

export const WithInput: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="site">Site name</Label>
      <Input id="site" placeholder="e.g. North Distribution Center" />
    </div>
  ),
};
