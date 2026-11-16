import type { Meta, StoryObj } from "@storybook/react-vite";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Quick filters</Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <p className="text-base font-semibold text-foreground">Filters</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Popover content — put filter controls, forms, or info here.
        </p>
      </PopoverContent>
    </Popover>
  ),
};
