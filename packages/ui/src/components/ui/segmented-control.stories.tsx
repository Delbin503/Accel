import type { Meta, StoryObj } from "@storybook/react-vite";
import { LayoutGrid, Rows3, Columns3 } from "lucide-react";
import { SegmentedControl, SegmentedControlItem } from "./segmented-control";

const meta: Meta<typeof SegmentedControl> = {
  title: "UI/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

/** View switcher — one option active. */
export const Default: Story = {
  render: () => (
    <SegmentedControl type="single" defaultValue="hero">
      <SegmentedControlItem value="hero"><LayoutGrid /> Hero</SegmentedControlItem>
      <SegmentedControlItem value="wall"><Rows3 /> Wall</SegmentedControlItem>
      <SegmentedControlItem value="custom"><Columns3 /> Custom</SegmentedControlItem>
    </SegmentedControl>
  ),
};

/** State picker (prototype testers) — small size. */
export const Small: Story = {
  render: () => (
    <SegmentedControl type="single" defaultValue="populated" size="sm">
      <SegmentedControlItem value="loading">Loading</SegmentedControlItem>
      <SegmentedControlItem value="empty">Empty</SegmentedControlItem>
      <SegmentedControlItem value="error">Error</SegmentedControlItem>
      <SegmentedControlItem value="populated">Populated</SegmentedControlItem>
    </SegmentedControl>
  ),
};

/** Filter chips — several options can be on at once. */
export const OutlineMultiple: Story = {
  render: () => (
    <SegmentedControl type="multiple" variant="outline" defaultValue={["astra", "fedex"]}>
      <SegmentedControlItem value="astra">Astra HQ</SegmentedControlItem>
      <SegmentedControlItem value="fedex">FedEx Changi</SegmentedControlItem>
      <SegmentedControlItem value="sembawang">Sembawang Naval</SegmentedControlItem>
    </SegmentedControl>
  ),
};
