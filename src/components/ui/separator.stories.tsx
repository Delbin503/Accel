import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-72">
      <p className="text-base text-foreground">Site overview</p>
      <Separator className="my-3" />
      <p className="text-sm text-muted-foreground">11 of 14 cameras online</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm text-muted-foreground">
      <span>Cameras</span>
      <Separator orientation="vertical" />
      <span>NVRs</span>
      <Separator orientation="vertical" />
      <span>Zones</span>
    </div>
  ),
};
