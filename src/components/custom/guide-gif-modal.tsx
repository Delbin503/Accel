import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface GuideGifModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  frameCount: number;
  frameDurationMs?: number;
  renderFrame: (frame: number) => React.ReactNode;
  ctaLabel?: string;
}

/**
 * Short, looping instructional demo shown as a modal — stands in for a
 * screen-recorded product GIF using a hand-drawn, frame-cycled illustration
 * instead of a binary asset. Swap `renderFrame` for an <img src=".../*.gif">
 * once real recordings exist; the modal chrome stays the same.
 */
export function GuideGifModal({
  open, onClose, title, description, frameCount, frameDurationMs = 900, renderFrame, ctaLabel = "Got it",
}: GuideGifModalProps) {
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    setFrame(0);
    const id = window.setInterval(() => setFrame((f) => (f + 1) % frameCount), frameDurationMs);
    return () => window.clearInterval(id);
  }, [open, frameCount, frameDurationMs]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[440px] max-w-[92vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 p-5">
          <div className="relative flex h-52 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
            {renderFrame(frame)}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
        <div className="flex justify-end border-t border-border px-5 py-3.5">
          <Button onClick={onClose} className="gap-1.5">
            <Check className="size-3.5" />
            {ctaLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
