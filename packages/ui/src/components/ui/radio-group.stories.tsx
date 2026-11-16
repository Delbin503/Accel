import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta: Meta<typeof RadioGroup> = {
  title: "UI/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="continuous" className="flex flex-col gap-3">
      {[
        { v: "continuous", l: "Continuous recording" },
        { v: "motion", l: "Motion-triggered" },
        { v: "schedule", l: "Scheduled" },
      ].map((o) => (
        <div key={o.v} className="flex items-center gap-2">
          <RadioGroupItem value={o.v} id={o.v} />
          <Label htmlFor={o.v}>{o.l}</Label>
        </div>
      ))}
    </RadioGroup>
  ),
};
