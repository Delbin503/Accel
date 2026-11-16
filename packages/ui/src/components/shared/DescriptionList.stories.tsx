import type { Meta, StoryObj } from "@storybook/react-vite";
import { HardDrive } from "lucide-react";
import { DescriptionItem, DescriptionList } from "./DescriptionList";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof DescriptionList> = {
  title: "Shared/DescriptionList",
  component: DescriptionList,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DescriptionList>;

/** The drawers' info grid: stacked label over value, two columns, in a card. */
export const StackedCard: Story = {
  render: () => (
    <DescriptionList columns={2} variant="card" className="w-[36rem]">
      <DescriptionItem label="Camera ID" mono>CAM-015</DescriptionItem>
      <DescriptionItem label="Status">
        <StatusBadge tone="success">Online</StatusBadge>
      </DescriptionItem>
      <DescriptionItem label="Site">Changi Logistics Hub</DescriptionItem>
      <DescriptionItem label="Area">Loading Bay 3</DescriptionItem>
      <DescriptionItem label="NVR">
        <span className="inline-flex items-center gap-1.5">
          <HardDrive className="size-3 text-info" />
          <span className="font-mono text-xs">NVR-02</span>
        </span>
      </DescriptionItem>
      <DescriptionItem label="Resolution" mono>2560×1440 · 25 fps</DescriptionItem>
      <DescriptionItem label="Last seen" />
      <DescriptionItem label="Notes" wide>
        Re-aimed on 12 Nov after the dock door was replaced. Night IR is on a schedule.
      </DescriptionItem>
    </DescriptionList>
  ),
};

/** Label left, value right — narrow panels and summaries. */
export const Inline: Story = {
  render: () => (
    <DescriptionList layout="inline" variant="card" className="w-80">
      <DescriptionItem label="Plan">Business</DescriptionItem>
      <DescriptionItem label="Seats" mono>12 / 85</DescriptionItem>
      <DescriptionItem label="Renews">1 Jan 2027</DescriptionItem>
      <DescriptionItem label="Amount" mono>$1,240.00</DescriptionItem>
    </DescriptionList>
  ),
};

export const ThreeColumnsPlain: Story = {
  render: () => (
    <DescriptionList columns={3} className="w-[48rem]">
      <DescriptionItem label="Model">PPE detection v4</DescriptionItem>
      <DescriptionItem label="Version" mono>4.2.1</DescriptionItem>
      <DescriptionItem label="Deployed">14 Nov 2026</DescriptionItem>
      <DescriptionItem label="Cameras" mono>18</DescriptionItem>
      <DescriptionItem label="Confidence" mono>0.72</DescriptionItem>
      <DescriptionItem label="Owner">Delbin Arkar</DescriptionItem>
    </DescriptionList>
  ),
};
