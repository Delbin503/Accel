import * as React from "react";
import { CheckCircle2, CircleDot, LoaderCircle } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProgressRow } from "@/components/shared/ProgressRow";

/**
 * Canonical "device is syncing" progress modal (NVR devices + Cameras): one
 * sentence, a labelled progress bar, the stage checklist, and one footer
 * action — Cancel while running, a disabled "Finishing…" at 100% until the
 * caller closes it.
 *
 * Progress is simulated here — the caller owns when the sync actually settles.
 */
export interface SyncProgressModalProps {
  /** Dialog copy, e.g. "Syncing NVR…". */
  title: string;
  /** Device the sync targets, shown under the title and next to the ring. */
  deviceLabel: string;
  /** Ordered stage labels stepped through as progress advances. */
  stages: string[];
  onCancel: () => void;
  /** Footer button copy. */
  cancelLabel?: string;
}

export function SyncProgressModal({
  title, deviceLabel, stages, onCancel, cancelLabel = "Cancel Sync",
}: SyncProgressModalProps) {
  const [progress, setProgress] = React.useState(0);

  // Mounted only while a sync is running, so progress always starts at 0.
  React.useEffect(() => {
    let pct = 0;
    const interval = setInterval(() => {
      pct += 5 + Math.random() * 9;
      if (pct >= 100) pct = 100;
      setProgress(Math.round(pct));
      if (pct >= 100) clearInterval(interval);
    }, 240);
    return () => clearInterval(interval);
  }, []);

  const done = progress >= 100;
  const stageIndex = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));

  return (
    <Modal open onOpenChange={() => { /* not dismissible while syncing */ }}>
      <ModalContent size="sm" showCloseButton={false}>
        <ModalHeader title={done ? "Sync complete" : title} />
        <ModalBody className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {done ? (
              <><strong className="text-foreground">{deviceLabel}</strong> is synced. Changes are being applied.</>
            ) : (
              <>
                Syncing <strong className="text-foreground">{deviceLabel}</strong>. Keep this window open until it
                finishes.
              </>
            )}
          </p>
          <ProgressRow progress={progress} label={done ? "All steps complete" : `${stages[stageIndex]}…`} />
          <ul className="space-y-2">
            {stages.map((stage, i) => {
              const stageDone = done || i < stageIndex;
              const active = !done && i === stageIndex;
              return (
                <li key={stage} className="flex items-center gap-2 text-sm">
                  {stageDone ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                  ) : active ? (
                    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" />
                  ) : (
                    <CircleDot className="size-3.5 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      "truncate",
                      active ? "font-semibold text-foreground" : stageDone ? "text-muted-foreground" : "text-muted-foreground/50"
                    )}
                  >
                    {stage}
                  </span>
                </li>
              );
            })}
          </ul>
        </ModalBody>
        <ModalFooter>
          {/* At 100% the caller closes the modal on its own timer; Cancel would misreport a cancel. */}
          {done ? (
            <Button size="sm" disabled>Finishing…</Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
