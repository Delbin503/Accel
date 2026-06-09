import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionCard } from "./SectionCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof SectionCard> = {
  title: "Shared/SectionCard",
  component: SectionCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SectionCard>;

export const Default: Story = {
  args: {
    title: "General settings",
    description: "Site-wide preferences and defaults.",
    className: "w-[34rem]",
    children: (
      <p className="text-sm text-muted-foreground">Section body content goes here.</p>
    ),
  },
};

export const WithAction: Story = {
  args: {
    title: "Cameras",
    description: "11 of 14 online",
    className: "w-[34rem]",
    action: (
      <Button variant="outline" size="sm">
        Manage
      </Button>
    ),
    children: <p className="text-sm text-muted-foreground">Camera list…</p>,
  },
};

export const WithBadge: Story = {
  args: {
    title: "Model deployment",
    className: "w-[34rem]",
    action: <StatusBadge tone="success">Healthy</StatusBadge>,
    children: <p className="text-sm text-muted-foreground">Deployment details…</p>,
  },
};
