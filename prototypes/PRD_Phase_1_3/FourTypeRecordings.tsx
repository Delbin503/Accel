import * as React from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Film,
  HardDrive,
  Lock,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/SectionCard";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONFIG,
  RECORDING_TYPES,
  TONE_CLASSES,
  type RecordingTypeId,
} from "./recordingTypes";
import { ALL_RECORDINGS, DAYS, fmtSize, type DayRecording } from "./dayRecordings";



/* ── Type chip ───────────────────────────────────────────────────────────── */

function TypeChip({ type }: { type: RecordingTypeId }) {
  const def = RECORDING_TYPES.find((t) => t.id === type)!;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded border px-1.5 py-px text-2xs font-bold uppercase tracking-wider",
        TONE_CLASSES[def.tone].chip
      )}
    >
      {def.label}
    </span>
  );
}

/* ── Starred clips (VMS-VPB-003) ─────────────────────────────────────────── */

/**
 * Starring marks a clip for retrieval and export, and protects it from the
 * retention sweep — a starred clip cannot be auto-overwritten or deleted.
 */
function StarButton({
  starred,
  onToggle,
  label,
}: {
  starred: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={starred}
      title={starred ? `${label} is starred — protected from overwriting` : `Star ${label}`}
      aria-label={starred ? `Unstar ${label}` : `Star ${label}`}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded transition-colors duration-[var(--duration-fast)] ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        starred ? "text-warning hover:text-warning/80" : "text-muted-foreground/40 hover:text-warning"
      )}
    >
      <Star className={cn("size-3.5", starred && "fill-current")} />
    </button>
  );
}

/* ── One camera-day, holding its set of type recordings ──────────────────── */

function CameraDayGroup({
  cameraName,
  areaName,
  siteName,
  dateLabel,
  rows,
  defaultOpen,
  starred,
  onToggleStar,
}: {
  cameraName: string;
  areaName: string;
  siteName: string;
  dateLabel: string;
  rows: DayRecording[];
  defaultOpen: boolean;
  starred: Set<string>;
  onToggleStar: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const totalMb = rows.reduce((s, r) => s + r.fileSizeMb, 0);
  const starredHere = rows.filter((r) => starred.has(r.id)).length;
  const missing = RECORDING_TYPES.filter(
    (t) => DEFAULT_CONFIG[t.id].enabled && !rows.some((r) => r.type === t.id)
  );

  return (
    <div className="rounded-lg border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{cameraName}</p>
          <p className="truncate text-2xs text-muted-foreground">
            {areaName} · {siteName}
          </p>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          {RECORDING_TYPES.filter((t) => DEFAULT_CONFIG[t.id].enabled).map((t) => {
            const present = rows.some((r) => r.type === t.id);
            return (
              <span
                key={t.id}
                title={`${t.label}${present ? "" : " — no recording"}`}
                className={cn(
                  "size-2 rounded-full",
                  present ? TONE_CLASSES[t.tone].dot : "bg-muted-foreground/25"
                )}
              />
            );
          })}
        </div>
        {starredHere > 0 && (
          <span
            title={`${starredHere} starred — protected from overwriting`}
            className="hidden shrink-0 items-center gap-1 rounded border border-warning/30 bg-warning/10 px-1.5 py-px text-2xs font-semibold text-warning sm:flex"
          >
            <Star className="size-2.5 fill-current" />
            {starredHere}
          </span>
        )}
        <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">{dateLabel}</span>
        <span className="w-20 shrink-0 text-right font-mono text-xs text-muted-foreground">
          {fmtSize(totalMb)}
        </span>
      </button>

      {open && (
        <div className="border-t border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/60">
                <th className="w-8 px-2 py-2" />
                {["Recording ID", "Type", "Window", "Duration", "Clips", "Size"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 font-mono text-3xs uppercase tracking-[0.15em] text-muted-foreground/60"
                  >
                    {h}
                  </th>
                ))}
                <th className="w-24 px-3 py-2 text-right font-mono text-3xs uppercase tracking-[0.15em] text-muted-foreground/60">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isStarred = starred.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border/40 last:border-b-0",
                      isStarred && "bg-warning/[0.04]"
                    )}
                  >
                    <td className="px-2 py-2">
                      <StarButton
                        starred={isStarred}
                        onToggle={() => onToggleStar(r.id)}
                        label={r.id}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.id}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <TypeChip type={r.type} />
                        {isStarred && (
                          <span
                            title="Protected from automatic overwriting"
                            className="inline-flex items-center gap-1 rounded border border-warning/30 bg-warning/10 px-1.5 py-px text-2xs font-bold uppercase tracking-wider text-warning"
                          >
                            <Lock className="size-2.5" />
                            Protected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {r.startsAt}–{r.endsAt}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{r.durationDisplay}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.clipCount === 1 ? "1 file" : `${r.clipCount} clips`}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-foreground">{r.fileSizeDisplay}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Export ${r.id}`} title="Export">
                          <Download className="size-3.5" />
                        </Button>
                        {/* A starred clip cannot be deleted — that is the point of starring. */}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isStarred}
                          aria-label={isStarred ? `${r.id} is protected and cannot be deleted` : `Delete ${r.id}`}
                          title={isStarred ? "Starred — cannot be deleted" : "Delete"}
                          className={cn(!isStarred && "hover:text-sev-critical")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {missing.map((t) => (
                <tr key={t.id} className="border-b border-border/40 last:border-b-0">
                  <td className="px-2 py-2" />
                  <td className="px-3 py-2 font-mono text-xs text-muted-foreground/50">—</td>
                  <td className="px-3 py-2"><TypeChip type={t.id} /></td>
                  <td className="px-3 py-2 text-xs italic text-muted-foreground/60" colSpan={5}>
                    No recording captured for this type.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export function FourTypeRecordings() {
  const [day, setDay] = React.useState<string>("Today");
  const [type, setType] = React.useState<string>("all");
  const [starredOnly, setStarredOnly] = React.useState(false);
  /* Seeded so the protected state is visible without clicking first. */
  const [starred, setStarred] = React.useState<Set<string>>(
    () => new Set(["REC-0003", "REC-0007"])
  );

  function toggleStar(id: string) {
    setStarred((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /* Filter and group in one pass — each group is one camera's day. */
  const { filtered, groups } = React.useMemo(() => {
    const rows = ALL_RECORDINGS.filter(
      (r) =>
        r.dateLabel === day &&
        (type === "all" || r.type === type) &&
        (!starredOnly || starred.has(r.id))
    );
    const map = new Map<string, DayRecording[]>();
    rows.forEach((r) => {
      const list = map.get(r.cameraId) ?? [];
      list.push(r);
      map.set(r.cameraId, list);
    });
    return { filtered: rows, groups: [...map.entries()] };
  }, [day, type, starredOnly, starred]);

  const enabledTypes = RECORDING_TYPES.filter((t) => DEFAULT_CONFIG[t.id].enabled);
  const cameraCount = new Set(ALL_RECORDINGS.filter((r) => r.dateLabel === day).map((r) => r.cameraId)).size;
  const totalMb = filtered.reduce((s, r) => s + r.fileSizeMb, 0);
  const starredCount = ALL_RECORDINGS.filter(
    (r) => r.dateLabel === day && starred.has(r.id)
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Recordings by Type</PageHeader.Title>
          <PageHeader.Description>
          Each camera produces one recording per enabled type, per day — so a day's worth of
          footage for one camera is {enabledTypes.length} rows, not one. Star a clip to keep it
          out of the retention sweep.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <KpiGrid cols={5}>
        <KpiCard label="Cameras" value={String(cameraCount)} sub="Recording on this day" accent="primary" icon={Video} />
        <KpiCard label="Types enabled" value={`${enabledTypes.length} / ${RECORDING_TYPES.length}`} sub="Set in Recording Settings" accent="info" icon={Film} />
        <KpiCard label="Recordings" value={String(filtered.length)} sub={`${cameraCount} cameras × ${enabledTypes.length} types`} accent="purple" icon={Calendar} />
        <KpiCard
          label="Starred"
          value={String(starredCount)}
          sub="Protected from overwriting"
          accent="warning"
          icon={Star}
          active={starredOnly}
          onClick={() => setStarredOnly((v) => !v)}
        />
        <KpiCard label="Storage" value={fmtSize(totalMb)} sub="Across the shown recordings" accent="info" icon={HardDrive} />
      </KpiGrid>

      <SectionCard
        title="Camera recordings"
        description="One row per camera-day. Expand to see the recording each type produced."
        action={
          <div className="flex items-center gap-2">
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger className="h-8 w-[150px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[160px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {enabledTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        {groups.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-muted-foreground">
            <Film className="size-5 opacity-40" />
            <p className="text-sm">
              {starredOnly ? "No starred recordings on this day." : "No recordings match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map(([cameraId, rows], i) => (
              <CameraDayGroup
                key={cameraId}
                cameraName={rows[0].cameraName}
                areaName={rows[0].areaName}
                siteName={rows[0].siteName}
                dateLabel={rows[0].dateLabel}
                rows={rows}
                defaultOpen={i === 0}
                starred={starred}
                onToggleStar={toggleStar}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
