import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Slider>;

/** Confidence threshold (50–99%). */
export const Default: Story = {
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[80]} min={50} max={99} step={1} aria-label="Confidence threshold" />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[20, 70]} aria-label="Range" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[40]} disabled aria-label="Disabled" />
    </div>
  ),
};
