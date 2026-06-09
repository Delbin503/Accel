import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Open event details</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detection event</SheetTitle>
          <SheetDescription>Person detected · CAM-002 · 14:32</SheetDescription>
        </SheetHeader>
        <div className="px-4 text-sm text-muted-foreground">
          Drawer body content — event metadata, snapshot, and actions.
        </div>
      </SheetContent>
    </Sheet>
  ),
};
