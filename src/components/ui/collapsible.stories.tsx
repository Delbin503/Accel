import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronsUpDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";
import { Button } from "./button";

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80 space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
        <span className="text-base font-semibold text-foreground">Advanced settings</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <ChevronsUpDown />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
        <p>Motion sensitivity threshold</p>
        <p>Recording retention policy</p>
        <p>Detection confidence cutoff</p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
