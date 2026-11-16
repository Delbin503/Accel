import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cctv, MousePointer2 } from "lucide-react";
import { GuideGifModal } from "./guide-gif-modal";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const meta: Meta<typeof GuideGifModal> = {
  title: "Custom/GuideGifModal",
  component: GuideGifModal,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof GuideGifModal>;

/** Frame-cycled illustration: the cursor moves to a camera tile and selects it. */
function renderFrame(frame: number) {
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "relative flex size-16 items-center justify-center rounded-lg border bg-muted transition-colors",
            frame === i + 1 ? "border-primary bg-primary/10" : "border-border"
          )}
        >
          <Cctv className={cn("size-5", frame === i + 1 ? "text-primary-ink" : "text-muted-foreground")} />
          {frame === i + 1 && <MousePointer2 className="absolute -bottom-2 -right-2 size-5 text-foreground" />}
        </div>
      ))}
    </div>
  );
}

export const Default: Story = {
  render: function DefaultStory() {
    const [open, setOpen] = React.useState(false);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          How do I pick a camera?
        </Button>
        <GuideGifModal
          open={open}
          onClose={() => setOpen(false)}
          title="Pick a camera"
          description="Click any camera tile to open its live view and recent detections."
          frameCount={4}
          renderFrame={renderFrame}
        />
      </>
    );
  },
};

/** Opened on load, slower frames and a custom CTA. */
export const OpenCustomCta: Story = {
  render: function OpenStory() {
    const [open, setOpen] = React.useState(true);
    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          Reopen guide
        </Button>
        <GuideGifModal
          open={open}
          onClose={() => setOpen(false)}
          title="Select cameras for analysis"
          description="Choose one or more cameras, then press Run analysis."
          frameCount={4}
          frameDurationMs={1400}
          ctaLabel="Start analysis"
          renderFrame={renderFrame}
        />
      </>
    );
  },
};
