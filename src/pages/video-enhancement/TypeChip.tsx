import { cn } from "@/lib/utils";
import { TONE_CLASSES, typeById } from "@/lib/recordingTypes";
import type { DayRecording } from "@/mocks/dayRecordings";

/** A recording type as the Recordings list shows it. */
export function TypeChip({ rec }: { rec: DayRecording }) {
  const t = typeById(rec.type);
  return (
    <span className={cn("shrink-0 rounded-md border px-1.5 py-px text-2xs font-semibold uppercase tracking-wide", TONE_CLASSES[t.tone].chip)}>
      {t.label}
    </span>
  );
}
