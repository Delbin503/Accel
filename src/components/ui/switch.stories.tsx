import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch";
import { Label } from "./label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => <Switch defaultChecked />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="motion" defaultChecked />
      <Label htmlFor="motion">Motion detection</Label>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch id="on" defaultChecked />
        <Label htmlFor="on">On</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="off" />
        <Label htmlFor="off">Off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="dis" disabled />
        <Label htmlFor="dis">Disabled</Label>
      </div>
    </div>
  ),
};
