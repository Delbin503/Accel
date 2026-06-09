import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof ConfirmDialog> = {
  title: "Shared/ConfirmDialog",
  component: ConfirmDialog,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Destructive: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete camera
        </Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          destructive
          title="Delete CAM-002?"
          description="This permanently removes the camera and its recordings. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const Default: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Publish rule</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Publish this rule?"
          description="The rule will become active across all assigned sites immediately."
          confirmLabel="Publish"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};
