import type { Meta, StoryObj } from "@storybook/react-vite";
import { Inbox, SearchX, Video } from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof EmptyState> = {
  title: "Shared/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: SearchX,
    title: "No events match the current filters",
    description: "Try widening the date range or clearing some filters.",
  },
};

export const WithAction: Story = {
  args: {
    icon: Video,
    title: "No cameras yet",
    description: "Add your first camera to start monitoring this site.",
    action: <Button size="sm">Add camera</Button>,
  },
};

export const Minimal: Story = {
  args: { icon: Inbox, title: "Nothing here yet" },
};
