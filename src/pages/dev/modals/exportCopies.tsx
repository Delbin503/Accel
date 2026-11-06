import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { TONE_CLASSES, typeById } from "@/lib/recordingTypes";
import { fmtSize, type DayRecording } from "@/mocks/dayRecordings";
import { TypeChip } from "@/pages/video-enhancement/TypeChip";
import type { ExportableRecording } from "@/pages/video-enhancement/ExportEnhancedModal";

/**
 * Gallery-only copies of the export modals in the new confirm style: 550px,
 * neutral title, no description, one sentence with the item in bold, a single
 * list (no box inside a box), and one footer action with no icon. The pages
 * still render their own versions.
 */

const NOTE = "text-sm leading-relaxed text-muted-foreground";
const HI = "font-semibold text-foreground";

function ExportFrame({
  title,
  onClose,
  footerStart,
  action,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Optional summary on the footer's left, e.g. "2 selected · 8 GB". */
  footerStart?: React.ReactNode;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm" className="w-[550px]">
        <ModalHeader title={title} description={null} />
        <ModalBody className="space-y-4">{children}</ModalBody>
        <ModalFooter align={footerStart ? "between" : "end"}>
          {footerStart ? <span className="text-xs text-muted-foreground">{footerStart}</span> : null}
          {action}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Monitor · Recordings — one camera-day as a zip ─────────────────────── */

export function ExportRecordingCopy({ rec, items, onClose }: {
  rec: DayRecording;
  /** Everything the zip holds: the recording, plus its standby and motion clips. */
  items: DayRecording[];
  onClose: () => void;
}) {
  const totalMb = items.reduce((t, r) => t + r.fileSizeMb, 0);
  const withClips = items.length > 1;
  // Group the zip's files by recording type, in the order they first appear.
  const groups: { type: string; label: string; dot: string; first: string; count: number; mb: number }[] = [];
  for (const r of items) {
    const t = typeById(r.type);
    const g = groups.find((x) => x.type === r.type);
    if (g) {
      g.count += 1;
      g.mb += r.fileSizeMb;
    } else {
      groups.push({ type: r.type, label: t.label, dot: TONE_CLASSES[t.tone].dot, first: `${r.id}.mp4`, count: 1, mb: r.fileSizeMb });
    }
  }

  return (
    <ExportFrame
      title="Export Recording"
      onClose={onClose}
      action={<Button size="sm" onClick={onClose}>Download zip · {fmtSize(totalMb)}</Button>}
    >
      <p className={NOTE}>
        Export <span className={HI}>{rec.id} · {rec.cameraName}</span> as one zip
        {withClips ? ", with its standby and motion clips." : "."}
      </p>
      {/* One row per recording type, then the zip as a total — 16 near-identical
          file names said less than this. */}
      <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border">
        {groups.map((g) => (
          <li key={g.type} className="flex items-center gap-2.5 px-3 py-2.5">
            <span className={cn("size-1.5 shrink-0 rounded-full", g.dot)} />
            <span className="w-28 shrink-0 text-sm text-foreground">{g.label}</span>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{g.count === 1 ? g.first : `${g.count} clips`}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{fmtSize(g.mb)}</span>
          </li>
        ))}
        <li className="flex items-center gap-2.5 bg-muted/30 px-3 py-2.5">
          <span className="size-1.5 shrink-0" />
          <span className="w-28 shrink-0 truncate font-mono text-sm font-semibold text-foreground">{rec.id}.zip</span>
          <span className="min-w-0 flex-1 text-xs text-muted-foreground">
            {items.length} file{items.length === 1 ? "" : "s"}
          </span>
          <span className="shrink-0 font-mono text-xs font-semibold text-foreground">{fmtSize(totalMb)}</span>
        </li>
      </ul>
    </ExportFrame>
  );
}

/* ── Monitor · Video Enhancement — pick enhanced recordings ─────────────── */

export function ExportEnhancedCopy({ items, currentId, onClose }: {
  items: ExportableRecording[];
  /** The recording on screen, marked in the list. */
  currentId: string;
  onClose: () => void;
}) {
  const ready = items.filter((i) => i.applied.length > 0);
  // Opens with every enhanced recording ticked.
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(ready.map((i) => i.rec.id)));
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
    <ExportFrame
      title="Export Enhanced"
      onClose={onClose}
      footerStart={<>{chosen.length} selected{chosen.length > 0 && ` · ${fmtSize(totalMb)}`}</>}
      action={
        <Button size="sm" disabled={chosen.length === 0} onClick={onClose}>
          Export {chosen.length || ""}
        </Button>
      }
    >
      <p className={NOTE}>
        Pick the recordings to export, each with <span className={HI}>its own enhancements</span>. The originals stay
        untouched.
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
                    "flex items-start gap-3 px-3 py-3",
                    enhanced ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                    on && "bg-primary/5"
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
                      {rec.id} · {files.length > 1 ? `${files.length} files` : "1 file"} · {fmtSize(mb)}
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
    </ExportFrame>
  );
}
