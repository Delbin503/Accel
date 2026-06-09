import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

const meta: Meta<typeof DropdownMenu> = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Case actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>View details</DropdownMenuItem>
        <DropdownMenuItem>Reassign</DropdownMenuItem>
        <DropdownMenuItem>Change status</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete case</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
