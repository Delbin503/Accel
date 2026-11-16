import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExternalLink, MapPin, Trash2, Video } from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { DescriptionItem, DescriptionList } from "./DescriptionList";
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerFooter,
  DetailDrawerFooterStart,
  DetailDrawerHeader,
  DetailDrawerSection,
  DetailDrawerTitle,
} from "./DetailDrawer";
import { StatusBadge } from "./StatusBadge";

const meta: Meta<typeof DetailDrawer> = {
  title: "Shared/DetailDrawer",
  component: DetailDrawer,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof DetailDrawer>;

function CameraDrawerDemo({ size, startOpen = true }: { size?: "md" | "lg" | "xl"; startOpen?: boolean }) {
  const [open, setOpen] = React.useState(startOpen);
  const [confirm, setConfirm] = React.useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open camera
      </Button>
      <DetailDrawer open={open} onOpenChange={setOpen} size={size}>
        <DetailDrawerHeader
          actions={
            <Button variant="ghost" size="icon-sm" aria-label="Open live view" className="size-7 text-muted-foreground">
              <ExternalLink />
            </Button>
          }
        >
          <div className="flex items-center gap-1.5">
            <StatusBadge tone="success">Online</StatusBadge>
          </div>
          <DetailDrawerTitle>Loading Bay 3 — Dock</DetailDrawerTitle>
          <DetailDrawerDescription>
            <Video /> CAM-015 <span aria-hidden>·</span> <MapPin /> Changi Logistics Hub
          </DetailDrawerDescription>
        </DetailDrawerHeader>
        <DetailDrawerBody>
          <DetailDrawerSection title="Device">
            <DescriptionList variant="card">
              <DescriptionItem label="IP address" mono>10.20.4.15</DescriptionItem>
              <DescriptionItem label="NVR" mono>NVR-02 · channel 7</DescriptionItem>
              <DescriptionItem label="Resolution" mono>2560×1440 · 25 fps</DescriptionItem>
              <DescriptionItem label="Firmware" mono>5.7.3</DescriptionItem>
            </DescriptionList>
          </DetailDrawerSection>
          <DetailDrawerSection
            title="Recording"
            action={
              <Button variant="link" size="xs" className="h-auto p-0">
                Schedule
              </Button>
            }
          >
            <DescriptionList layout="inline" variant="card">
              <DescriptionItem label="Mode">Continuous</DescriptionItem>
              <DescriptionItem label="Retention">30 days</DescriptionItem>
              <DescriptionItem label="Storage used" mono>1.8 TB</DescriptionItem>
            </DescriptionList>
          </DetailDrawerSection>
        </DetailDrawerBody>
        <DetailDrawerFooter>
          <DetailDrawerFooterStart>
            <Button variant="destructive" onClick={() => setConfirm(true)}>
              <Trash2 /> Remove camera
            </Button>
          </DetailDrawerFooterStart>
          <Button variant="outline">Edit</Button>
          <Button>Open live view</Button>
        </DetailDrawerFooter>
      </DetailDrawer>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Remove CAM-015?"
        description="Recordings stay until their retention ends. The camera stops streaming now."
        confirmLabel="Remove camera"
        destructive
        onConfirm={() => setConfirm(false)}
      />
    </>
  );
}

/** Default record drawer (lg). Header actions sit left of the built-in close. */
export const Default: Story = {
  render: () => <CameraDrawerDemo />,
};

export const Medium: Story = {
  render: () => <CameraDrawerDemo size="md" />,
};

export const Closed: Story = {
  render: () => <CameraDrawerDemo startOpen={false} />,
};
