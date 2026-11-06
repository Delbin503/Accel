import * as React from "react";
import { CheckCircle2, CircleDot, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";

/**
 * Gallery-only copies of the progress modals in the new confirm style:
 *   - same 550px frame, neutral title, no description, one footer action;
 *   - one sentence saying what's running, item in bold;
 *   - a single thin progress bar (the ring and its duplicate bar are gone),
 *     labelled with what's done on the left and the percentage on the right;
 *   - once finished the bar turns green and Cancel becomes Done.
 * The pages still render their own versions.
 */

const NOTE = "text-sm leading-relaxed text-muted-foreground";
const HI = "font-semibold text-foreground";

/** Simulated progress, as the originals do: climbs in random steps to 100. */
function useSimulatedProgress(min: number, spread: number, intervalMs: number) {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let pct = 0;
    const id = setInterval(() => {
      pct = Math.min(100, pct + min + Math.random() * spread);
      setProgress(Math.round(pct));
      if (pct >= 100) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
  }, [min, spread, intervalMs]);
  return progress;
}

/** Label row over a thin bar: what's done on the left, % on the right. */
function ProgressBlock({ progress, label }: { progress: number; label: React.ReactNode }) {
  const done = progress >= 100;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-semibold tabular-nums", done ? "text-success" : "text-foreground")}>
          {progress}%
        </span>
      </div>
      <Progress
        value={progress}
        aria-label="Progress"
        className={cn("h-1.5 bg-muted", done && "[&_[data-slot=progress-indicator]]:bg-success")}
      />
    </div>
  );
}

function ProgressFrame({
  title,
  done,
  cancelLabel,
  onClose,
  children,
}: {
  title: string;
  done: boolean;
  cancelLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm" className="w-[550px]">
        <ModalHeader title={title} description={null} />
        <ModalBody className="space-y-4">{children}</ModalBody>
        <ModalFooter>
          {done ? (
            <Button size="sm" onClick={onClose}>Done</Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={onClose}>{cancelLabel}</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Site · NVR — storage cleanup ──────────────────────────────────────── */

export function CleanupProgressCopy({ methodLabel, totalToProcess, onClose }: {
  methodLabel: string;
  totalToProcess: number;
  onClose: () => void;
}) {
  const progress = useSimulatedProgress(7, 8, 220);
  const processed = Math.floor((progress / 100) * totalToProcess);
  const done = progress >= 100;
  return (
    <ProgressFrame
      title={done ? "Cleanup complete" : "Cleaning up storage…"}
      done={done}
      cancelLabel="Cancel Cleanup"
      onClose={onClose}
    >
      <p className={NOTE}>
        {done ? (
          <>Removed <span className={HI}>{totalToProcess} recordings</span> ({methodLabel.toLowerCase()}).</>
        ) : (
          <>
            Removing recordings <span className={HI}>{methodLabel.toLowerCase()}</span>. Keep this window open until it
            finishes.
          </>
        )}
      </p>
      <ProgressBlock progress={progress} label={`${processed} of ${totalToProcess} files`} />
    </ProgressFrame>
  );
}

/* ── Shared · device sync ──────────────────────────────────────────────── */

export function SyncProgressCopy({ title, deviceLabel, stages, onClose }: {
  title: string;
  deviceLabel: string;
  stages: string[];
  onClose: () => void;
}) {
  const progress = useSimulatedProgress(5, 9, 240);
  const done = progress >= 100;
  const stageIndex = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));
  return (
    <ProgressFrame title={done ? "Sync complete" : title} done={done} cancelLabel="Cancel Sync" onClose={onClose}>
      <p className={NOTE}>
        {done ? (
          <><span className={HI}>{deviceLabel}</span> is synced. Changes are being applied.</>
        ) : (
          <>
            Syncing <span className={HI}>{deviceLabel}</span> with the NVR. Keep this window open until it finishes.
          </>
        )}
      </p>
      <ProgressBlock progress={progress} label={done ? "All steps complete" : `${stages[stageIndex]}…`} />
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
    </ProgressFrame>
  );
}
