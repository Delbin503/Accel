import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>AK</AvatarFallback>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarFallback>AK</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MS</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+5</AvatarGroupCount>
    </AvatarGroup>
  ),
};
