import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { fmtSize, type DayRecording } from "@/mocks/dayRecordings";
import { TypeChip } from "./TypeChip";

/* Export Enhanced: one row per recording opened on the page, each with the
   enhancements it was given. An operation recording goes out whole — its
   standby and motion clips included — so its row counts them rather than
   listing them. Recordings with nothing applied can't be picked. */

export interface ExportableRecording {
  rec: DayRecording;
  /** Everything that goes out with it: for operation, the standby and its motion clips too. */
  files: DayRecording[];
  /** Its enhancements in words; empty when it has none. */
  applied: string[];
}

export function ExportEnhancedModal({
  open,
  onOpenChange,
  items,
  currentId,
  onExport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExportableRecording[];
  /** The recording on screen, marked in the list. */
  currentId: string;
  onExport: (chosen: ExportableRecording[]) => void;
}) {
  const ready = items.filter((i) => i.applied.length > 0);
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(ready.map((i) => i.rec.id)));

  // Every opening starts with each enhanced recording ticked.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPicked(new Set(ready.map((i) => i.rec.id)));
  }

  const chosen = ready.filter((i) => picked.has(i.rec.id));
  const totalMb = chosen.reduce((s, i) => s + i.files.reduce((t, f) => t + f.fileSizeMb, 0), 0);
  const all = ready.length > 0 && chosen.length === ready.length;

  function toggle(id: string) {
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size="sm">
        <ModalHeader title="Export Enhanced" description="Choose the recordings to export, each with its own enhancements." />
        <ModalBody className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Pick the recordings to export, each with <strong className="text-foreground">its own enhancements</strong>. The
            originals stay untouched.
          </p>
          <div className="overflow-hidden rounded-lg border border-border">
            {items.length > 1 && (
              <label className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2.5">
                <Checkbox
                  checked={all}
                  disabled={ready.length === 0}
                  onCheckedChange={() => setPicked(all ? new Set() : new Set(ready.map((i) => i.rec.id)))}
                  aria-label="Select all recordings"
                />
                <span className="text-sm font-medium text-foreground">Select all</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {ready.length} of {items.length} enhanced
                </span>
              </label>
            )}
            <ul className="max-h-80 divide-y divide-border/60 overflow-y-auto">
              {items.map(({ rec, files, applied }) => {
                const enhanced = applied.length > 0;
                const on = enhanced && picked.has(rec.id);
                const mb = files.reduce((t, f) => t + f.fileSizeMb, 0);
                return (
                  <li key={rec.id}>
                    {/* Name + type on top, ID · files · size under it, then what was applied. */}
                    <label
                      className={cn(
                        "flex items-start gap-3 px-3 py-3 transition-colors duration-[var(--duration-fast)] ease-standard",
                        enhanced ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                        on ? "bg-primary/5" : enhanced && "hover:bg-muted/40"
                      )}
                    >
                      <Checkbox
                        checked={on}
                        disabled={!enhanced}
                        onCheckedChange={() => toggle(rec.id)}
                        aria-label={`Export ${rec.id}`}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                            <span className="truncate">{rec.cameraName}</span>
                            {rec.id === currentId && (
                              <span className="shrink-0 rounded-full border border-border px-1.5 py-px text-3xs font-semibold uppercase tracking-wider text-muted-foreground">
                                On screen
                              </span>
                            )}
                          </p>
                          <TypeChip rec={rec} />
                        </div>
                        <p className="font-mono text-2xs text-muted-foreground">
                          {rec.id} · {rec.dateLabel} · {files.length > 1 ? `${files.length} files` : "1 file"} · {fmtSize(mb)}
                        </p>
                        <p className={cn("text-xs", enhanced ? "text-primary" : "text-muted-foreground")}>
                          {enhanced ? applied.join(" · ") : "No enhancements yet"}
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </ModalBody>
        <ModalFooter align="between">
          <span className="text-xs text-muted-foreground">
            {chosen.length} selected{chosen.length > 0 && ` · ${fmtSize(totalMb)}`}
          </span>
          <Button size="sm" disabled={chosen.length === 0} onClick={() => onExport(chosen)}>
            Export {chosen.length || ""}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
