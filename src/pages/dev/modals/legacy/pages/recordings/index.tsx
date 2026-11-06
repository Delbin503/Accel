/**
 * Frozen copy of src/pages/recordings/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/recordings/index.tsx.
 */
import { Download, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";
import { TONE_CLASSES, typeById, type RecordingTypeId } from "@/lib/recordingTypes";
import { DAYS, fmtSize, type DayRecording } from "@/mocks/dayRecordings";

/* ── Recordings list ─────────────────────────────────────────────────────── */

/** A recording's calendar date and its window, e.g. "25 May 2026" and "18:00 – 06:00". */
function recDate(rec: DayRecording): { date: string; time: string } {
  // DAYS runs newest first and ends on a dated label, so the others count back from it.
  const last = DAYS.length - 1;
  const date = new Date(DAYS[last]);
  date.setDate(date.getDate() + (last - rec.dayIndex));
  return {
    date: formatDate(date, { day: "numeric", month: "short", year: "numeric" }),
    time: `${rec.startsAt} – ${rec.endsAt}`,
  };
}

/* ── Export ──────────────────────────────────────────────────────────────── */

/** One file a zip holds. The drawer decides which recordings are in it. */
function exportFiles(items: DayRecording[]): { name: string; kind: RecordingTypeId; size: string; mb: number }[] {
  return items.map((r) => ({ name: `${r.id}.mp4`, kind: r.type, size: r.fileSizeDisplay, mb: r.fileSizeMb }));
}

/**
 * What an export archives. From the drawer it is one camera-day (`rec` names
 * the zip, `items` is what was ticked); from the selection bar it is several
 * whole camera-days (`recs`).
 */
export type ExportTarget = { items: DayRecording[] } & ({ rec: DayRecording } | { recs: DayRecording[] });

/** The zip's name, without the extension. */
function exportName(target: ExportTarget): string {
  return "rec" in target ? target.rec.id : `Accel-recordings-${target.recs.length}`;
}

export function ExportRecordingModal({ open, target, onClose, onConfirm }: {
  open: boolean;
  target: ExportTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  const { items } = target;
  const rec = "rec" in target ? target.rec : null;
  const files = exportFiles(items);
  const totalMb = files.reduce((t, f) => t + f.mb, 0);
  const partial = !!rec?.standby && files.length < 2 + (rec.standby.clipCount ?? 0);
  const name = exportName(target);
  const description = rec
    ? `${rec.id} · ${rec.cameraName} · ${recDate(rec).date}`
    : `${"recs" in target ? target.recs.length : 0} recordings, each with its standby and motion clips`;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={rec ? "Export Recording" : "Export Recordings"}
          description={description}
        />
        <ModalBody>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-base font-semibold text-foreground">
                <Package className="size-3.5 text-primary" />
                {name}.zip
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {files.length} file{files.length === 1 ? "" : "s"} · {fmtSize(totalMb)}
              </span>
            </div>
            {/* Long on a busy night, so the list scrolls rather than the modal. */}
            <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto rounded-md border border-border">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-2 px-3 py-1.5">
                  <span className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASSES[typeById(f.kind).tone].dot)} />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{f.name}</span>
                  <span className="shrink-0 text-2xs text-muted-foreground">{typeById(f.kind).label}</span>
                  <span className="w-20 shrink-0 text-right font-mono text-2xs text-muted-foreground">{f.size}</span>
                </li>
              ))}
            </ul>
          </div>
          {rec?.standby && (
            <p className="mt-3 text-xs text-muted-foreground">
              {partial
                ? "Only the recordings picked in the drawer are archived — tick the rest to include them."
                : "The standby recording and its motion clips are part of this camera-day, so they are archived with it."}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <Download className="size-3.5" />
            Download zip · {fmtSize(totalMb)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete confirmation ─────────────────────────────────────────────────── */

export function DeleteRecordingsModal({ open, recs, onClose, onConfirm }: {
  open: boolean;
  recs: DayRecording[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (recs.length === 0) return null;
  const isBulk = recs.length > 1;
  const clips = recs.reduce((s, r) => s + (r.standby?.clipCount ?? 0), 0);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Delete Recordings (${recs.length})` : "Delete Recording"}
          description="This action cannot be undone."
          tone="destructive"
        />
        <ModalBody>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">You are about to remove:</p>
                {isBulk ? (
                  <p className="mt-1 text-sm text-muted-foreground">{recs.length} recordings will be deleted immediately.</p>
                ) : (
                  <p className="mt-1 text-base text-muted-foreground">
                    <span className="font-mono text-sm">{recs[0].id}</span> — {recs[0].cameraName} · {typeById(recs[0].type).label}
                  </p>
                )}
              </div>
            </div>
          </div>
          {clips > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              An operation recording takes its standby, and the motion clips inside it — {clips} clip{clips === 1 ? "" : "s"} in all.
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete {recs.length} Recording{recs.length === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
