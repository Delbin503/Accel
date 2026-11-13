import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box, ChevronRight, MapPin } from "lucide-react";
import { Item, ItemActions, ItemButton, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./item";

const meta: Meta<typeof ItemButton> = {
  title: "UI/Item",
  component: ItemButton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ItemButton>;

/** A selectable list of rows — e.g. the model picker. */
export const SelectableList: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      {["SOP Compliance", "Muzzle Detection", "Helmet Detection"].map((name, i) => (
        <ItemButton key={name} variant="outline" selected={i === 0}>
          <ItemMedia><Box /></ItemMedia>
          <ItemContent>
            <ItemTitle>{name}</ItemTitle>
            <ItemDescription>Sequential procedure verification</ItemDescription>
          </ItemContent>
          <ItemActions><ChevronRight className="size-4 text-muted-foreground" /></ItemActions>
        </ItemButton>
      ))}
    </div>
  ),
};

/** Static (non-clickable) item. */
export const Static: Story = {
  render: () => (
    <Item variant="muted" className="w-80">
      <ItemMedia><MapPin /></ItemMedia>
      <ItemContent>
        <ItemTitle>Astra HQ</ItemTitle>
        <ItemDescription>8 Marina Boulevard, Singapore</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const Small: Story = {
  render: () => (
    <div className="flex w-64 flex-col">
      <ItemButton size="sm">General</ItemButton>
      <ItemButton size="sm" selected>Detection</ItemButton>
      <ItemButton size="sm">Notifications</ItemButton>
    </div>
  ),
};
