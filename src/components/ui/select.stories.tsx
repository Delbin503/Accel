import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a site" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="lobby">Lobby</SelectItem>
        <SelectItem value="parking">Parking</SelectItem>
        <SelectItem value="warehouse">Warehouse</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Assign camera" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>North Site</SelectLabel>
          <SelectItem value="cam-001">CAM-001 Entrance</SelectItem>
          <SelectItem value="cam-002">CAM-002 Parking</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>South Site</SelectLabel>
          <SelectItem value="cam-101">CAM-101 Dock</SelectItem>
          <SelectItem value="cam-102">CAM-102 Yard</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">A</SelectItem>
      </SelectContent>
    </Select>
  ),
};
