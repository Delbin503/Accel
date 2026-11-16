import type { Meta, StoryObj } from "@storybook/react-vite";
import { TruncatedText } from "./TruncatedText";
import { TooltipProvider } from "../ui/tooltip";

const meta: Meta<typeof TruncatedText> = {
  title: "Shared/TruncatedText",
  component: TruncatedText,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TruncatedText>;

/** Clipped — hover to see the full name in a tooltip. */
export const Default: Story = {
  render: () => (
    <div className="w-48 text-sm text-foreground">
      <TruncatedText text="CAM-014 · Loading Bay North, Changi Logistics Hub" />
    </div>
  ),
};

/** Fits — no tooltip is attached. */
export const NotTruncated: Story = {
  render: () => (
    <div className="w-48 text-sm text-foreground">
      <TruncatedText text="CAM-022 · Gate 3" />
    </div>
  ),
};

/** Multi-line clamp via a `line-clamp-*` class. */
export const LineClamp: Story = {
  render: () => (
    <div className="w-56 text-sm text-muted-foreground">
      <TruncatedText
        className="line-clamp-2"
        text="Person detected loitering near the perimeter fence for more than five minutes after site closing hours at Jurong Warehouse 2."
      />
    </div>
  ),
};

/** Rich children with an explicit `title` for the tooltip. */
export const RichContent: Story = {
  render: () => (
    <div className="w-52 text-sm text-foreground">
      <TruncatedText title="Forklift in pedestrian zone — CAM-031">
        Forklift in pedestrian zone — <span className="font-mono text-muted-foreground">CAM-031</span>
      </TruncatedText>
    </div>
  ),
};
