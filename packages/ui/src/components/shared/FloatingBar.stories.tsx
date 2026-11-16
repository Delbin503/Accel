import type { Meta, StoryObj } from "@storybook/react-vite";
import { Trash2, UserCheck, X } from "lucide-react";
import { FloatingBar } from "./FloatingBar";
import { Button } from "../ui/button";

const meta: Meta<typeof FloatingBar> = {
  title: "Shared/FloatingBar",
  component: FloatingBar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof FloatingBar>;

/**
 * Bulk-action bar for selected rows. It pins to the bottom of the viewport but
 * keeps the width of the column it is placed in (here, the centred max-w column).
 */
export const Default: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl space-y-3">
      <p className="text-base text-muted-foreground">3 detections selected in the feed below.</p>
      <div className="h-40 rounded-xl border border-dashed border-border" />
      <FloatingBar>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-popover px-4 py-2.5 shadow-lg">
          <span className="text-sm font-semibold text-foreground">3 selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline">
              <UserCheck className="size-4" /> Assign
            </Button>
            <Button size="sm" variant="destructive">
              <Trash2 className="size-4" /> Dismiss
            </Button>
            <Button size="icon" variant="ghost" aria-label="Clear selection">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </FloatingBar>
    </div>
  ),
};
