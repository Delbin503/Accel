import * as React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../shared/Modal";
import { Button } from "../ui/button";
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

  // Restart from the first frame whenever the modal opens (or its timing
  // changes while open) — adjusted during render rather than in the effect.
  const resetKey = open ? `${frameCount}:${frameDurationMs}` : null;
  const [prevResetKey, setPrevResetKey] = React.useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    if (resetKey !== null) setFrame(0);
  }

  React.useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => setFrame((f) => (f + 1) % frameCount), frameDurationMs);
    return () => window.clearInterval(id);
  }, [open, frameCount, frameDurationMs]);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title={title} description={description} />
        <ModalBody>
          <div data-slot="guide-gif-modal-frame" className="relative flex h-52 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">
            {renderFrame(frame)}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} className="gap-1.5">
            <Check className="size-3.5" />
            {ctaLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
