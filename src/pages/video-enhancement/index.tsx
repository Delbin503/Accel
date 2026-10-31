import * as React from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Crop, Download, Pencil, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionCard } from "@/components/shared/SectionCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { ALL_RECORDINGS, cameraDayFiles } from "@/mocks/dayRecordings";
import { cameraFrame } from "@/mocks/cameraFrames";
import { CropOverlay } from "./CropOverlay";
import { ExportEnhancedModal } from "./ExportEnhancedModal";
import { TypeChip } from "./TypeChip";
import { useDownloadsStore } from "@/stores/useDownloadsStore";
import {
  ASPECTS,
  START_RECT,
  describeRect,
  rectForAspect,
  type AspectId,
  type CropRect,
  type SavedCrop,
} from "./cropRect";

/* ── Enhancement state ───────────────────────────────────────────────────── */

interface Enhancement {
  brightness: number; // %
  contrast: number;   // %
  sharpness: number;  // 0–100, drives the convolve kernel below
}

const NEUTRAL: Enhancement = {
  brightness: 100,
  contrast: 100,
  sharpness: 0,
};

/** What one recording has been given. Each recording opened keeps its own. */
interface RecordingSettings {
  enh: Enhancement;
  /** The saved crop switched on for it, if any. */
  cropId: string | null;
}

const UNTOUCHED: RecordingSettings = { enh: NEUTRAL, cropId: null };

/** The crop box while it is being drawn. `editingId` is the saved crop being changed, if any. */
interface CropDraft {
  rect: CropRect;
  aspect: AspectId;
  editingId: string | null;
}

/* ── Slider ──────────────────────────────────────────────────────────────── */

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  neutral,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  neutral: number;
  onChange: (v: number) => void;
}) {
  const changed = value !== neutral;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <span className={cn("font-mono text-xs", changed ? "text-foreground" : "text-muted-foreground")}>
            {value}
            {suffix}
          </span>
          {changed && (
            <button
              type="button"
              onClick={() => onChange(neutral)}
              title={`Reset ${label}`}
              aria-label={`Reset ${label}`}
              className="text-3xs text-muted-foreground underline hover:text-foreground"
            >
              reset
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full accent-primary"
      />
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

/** The clip's still — the camera's frame, or a stand-in gradient with enough
    structure for the filters to show when the camera has none. */
function ClipFrame({ src, filter }: { src: string | undefined; filter: string }) {
  if (src) {
    // Scaled past the edges to crop the burned-in camera banner, as Live Monitoring does.
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ filter }}>
        <img src={src} alt="" className="size-full scale-[1.18] object-cover" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950" style={{ filter }}>
      <div className="absolute left-[12%] top-[22%] size-24 rounded-full bg-neutral-500/40 blur-xl" />
      <div className="absolute right-[18%] bottom-[18%] h-28 w-40 rounded-lg bg-neutral-400/25" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-500/40" />
    </div>
  );
}

/** The kept part of the frame, scaled to fit the viewer with black bars
    where its shape differs from the frame's. */
function CroppedFrame({ src, filter, rect }: { src: string | undefined; filter: string; rect: CropRect }) {
  // Pixel aspect of the box against the 16:9 viewer decides which side fills.
  const s = Math.min(1 / rect.w, 1 / rect.h);
  const w = rect.w * s;
  const h = rect.h * s;
  return (
    <div
      className="absolute overflow-hidden"
      style={{ left: `${((1 - w) / 2) * 100}%`, top: `${((1 - h) / 2) * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
    >
      <div
        className="absolute"
        style={{
          width: `${100 / rect.w}%`,
          height: `${100 / rect.h}%`,
          left: `${(-rect.x / rect.w) * 100}%`,
          top: `${(-rect.y / rect.h) * 100}%`,
        }}
      >
        <ClipFrame src={src} filter={filter} />
      </div>
    </div>
  );
}

export function VideoEnhancement() {
  /* Opened from Recordings → Enhance, the page starts on that recording; the
     dropdown switches to any other. */
  const sent = useLocation().state as { recordingId?: string } | null;
  const [recordingId, setRecordingId] = React.useState(
    () => ALL_RECORDINGS.find((r) => r.id === sent?.recordingId)?.id ?? ALL_RECORDINGS[0].id,
  );
  const recording = ALL_RECORDINGS.find((r) => r.id === recordingId) ?? ALL_RECORDINGS[0];
  /* An operation recording carries its standby and motion clips; any of them
     can be the one enhanced. Continuous has only itself. */
  const files = React.useMemo(() => cameraDayFiles(recording), [recording]);
  const [fileId, setFileId] = React.useState(recordingId);
  const file = files.find((f) => f.id === fileId) ?? recording;
  const frame = cameraFrame(recording.cameraId);
  /* Every recording opened from the dropdown keeps its own enhancements, so
     switching away and back loses nothing, and Export Enhanced can send
     several at once. */
  const [settings, setSettings] = React.useState<Record<string, RecordingSettings>>({});
  const [opened, setOpened] = React.useState<string[]>(() => [recordingId]);
  const { enh, cropId: activeCropId } = settings[recordingId] ?? UNTOUCHED;

  function update(fn: (cur: RecordingSettings) => RecordingSettings) {
    setSettings((all) => ({ ...all, [recordingId]: fn(all[recordingId] ?? UNTOUCHED) }));
  }
  const setActiveCropId = (cropId: string | null) => update((cur) => ({ ...cur, cropId }));

  /* Crops are drawn on the video and saved; a saved crop does nothing until
     it is switched on, and only one can be on at a time. Saved crops are
     shared by every recording, so the same framing can be reused. */
  const [savedCrops, setSavedCrops] = React.useState<SavedCrop[]>([]);
  const [draft, setDraft] = React.useState<CropDraft | null>(null);
  const activeCrop = savedCrops.find((c) => c.id === activeCropId) ?? null;
  const [exportOpen, setExportOpen] = React.useState(false);
  const startDownload = useDownloadsStore((s) => s.start);

  /** A recording's enhancements in words, e.g. ["Brightness 120%", "Crop 1 · 60% × 50%"]. */
  function summarize({ enh: e, cropId }: RecordingSettings): string[] {
    const crop = savedCrops.find((c) => c.id === cropId);
    return [
      e.brightness !== NEUTRAL.brightness && `Brightness ${e.brightness}%`,
      e.contrast !== NEUTRAL.contrast && `Contrast ${e.contrast}%`,
      e.sharpness !== NEUTRAL.sharpness && `Sharpness ${e.sharpness}`,
      crop && `${crop.name} · ${describeRect(crop.rect)}`,
    ].filter((a): a is string => Boolean(a));
  }

  /** Every recording opened this session, the one on screen first. */
  const exportable = [recordingId, ...opened.filter((id) => id !== recordingId)].flatMap((id) => {
    const rec = ALL_RECORDINGS.find((r) => r.id === id);
    return rec ? [{ rec, files: cameraDayFiles(rec), applied: summarize(settings[id] ?? UNTOUCHED) }] : [];
  });

  /* An operation camera-day is one recording split into files — the operation
     recording, its standby and the motion clips — so its enhancements are set
     once and carry to every file. Moving between them keeps the settings. */
  function pickFile(id: string) {
    setFileId(id);
    setDraft(null);
  }

  // Each camera-day keeps its own enhancements; a new one starts untouched.
  function pickRecording(id: string) {
    setRecordingId(id);
    setFileId(id);
    setDraft(null);
    setOpened((o) => (o.includes(id) ? o : [...o, id]));
  }

  const dirty = JSON.stringify(enh) !== JSON.stringify(NEUTRAL) || activeCropId !== null;

  function patch(next: Partial<Enhancement>) {
    update((cur) => ({ ...cur, enh: { ...cur.enh, ...next } }));
  }

  function startCrop(edit?: SavedCrop) {
    setDraft({ rect: edit?.rect ?? activeCrop?.rect ?? START_RECT, aspect: "free", editingId: edit?.id ?? null });
  }

  function pickAspect(id: AspectId) {
    if (!draft) return;
    const ratio = ASPECTS.find((a) => a.id === id)?.ratio ?? null;
    setDraft({ ...draft, aspect: id, rect: ratio ? rectForAspect(ratio, draft.rect) : draft.rect });
  }

  function saveCrop() {
    if (!draft) return;
    if (draft.editingId) {
      setSavedCrops((list) => list.map((c) => (c.id === draft.editingId ? { ...c, rect: draft.rect } : c)));
      toast.success("Crop updated");
    } else {
      const n = savedCrops.length + 1;
      const crop: SavedCrop = { id: `crop-${Date.now()}`, name: `Crop ${n}`, rect: draft.rect };
      setSavedCrops((list) => [...list, crop]);
      toast.success(`Saved as ${crop.name}`, { description: "Switch it on under Crop to apply it to the video." });
    }
    setDraft(null);
  }

  function deleteCrop(id: string) {
    setSavedCrops((list) => list.filter((c) => c.id !== id));
    // Switch it off wherever it was on.
    setSettings((all) =>
      Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.cropId === id ? { ...v, cropId: null } : v])),
    );
  }

  /* Brightness and contrast are native CSS filters. Sharpness has no CSS
     equivalent, so it runs through the SVG convolve kernel defined below —
     amount 0 leaves the frame untouched. */
  const cssFilter = [
        `brightness(${enh.brightness}%)`,
        `contrast(${enh.contrast}%)`,
        enh.sharpness > 0 ? "url(#accel-sharpen)" : "",
      ]
        .filter(Boolean)
        .join(" ");

  const k = enh.sharpness / 100; // 0 → identity, 1 → full sharpen
  const kernel = [
    0, -k, 0,
    -k, 1 + 4 * k, -k,
    0, -k, 0,
  ].map((n) => Number(n.toFixed(3))).join(" ");

  const draftRatio = draft ? ASPECTS.find((a) => a.id === draft.aspect)?.ratio ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      {/* The sharpen kernel lives once, off-screen, and is referenced by filter url(). */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="accel-sharpen">
            <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix={kernel} />
          </filter>
        </defs>
      </svg>

      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Video Enhancement</PageHeader.Title>
          <PageHeader.Description>{file.id} · {recording.cameraName}</PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button
            variant="outline"
            size="sm"
            disabled={!dirty}
            onClick={() => update(() => UNTOUCHED)}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          {/* Enabled while any opened recording has enhancements, not only the one on screen. */}
          <Button
            size="sm"
            disabled={!exportable.some((i) => i.applied.length > 0)}
            className="gap-1.5"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-3.5" />
            Export Enhanced
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Viewer ── */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <p className="text-base font-semibold text-foreground">{recording.cameraName}</p>

            <Select value={recordingId} onValueChange={pickRecording}>
              <SelectTrigger size="sm" className="w-96 max-w-full" aria-label="Recording to enhance">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="max-h-80">
                {ALL_RECORDINGS.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate">{r.id} · {r.cameraName} · {r.dateLabel}</span>
                      <TypeChip rec={r} />
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Crop mode toolbar — shape, then cancel or save */}
          {draft && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-primary/5 px-4 py-2">
              <Crop className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {draft.editingId ? `Editing ${savedCrops.find((c) => c.id === draft.editingId)?.name}` : "Crop mode"}
              </span>
              <span className="text-xs text-muted-foreground">Drag the box to move it, its handles to resize.</span>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {ASPECTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => pickAspect(a.id)}
                    aria-pressed={draft.aspect === a.id}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-standard",
                      draft.aspect === a.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
                <div className="mx-1 h-4 w-px bg-border" />
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Cancel</Button>
                <Button size="sm" onClick={saveCrop}>{draft.editingId ? "Save changes" : "Save crop"}</Button>
              </div>
            </div>
          )}

          <div className="bg-black p-4">
            <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-lg">
              {/* Drawing shows the whole frame; otherwise a crop that is on shows only what it keeps. */}
              {activeCrop && !draft ? (
                <CroppedFrame src={frame} filter={cssFilter} rect={activeCrop.rect} />
              ) : (
                <ClipFrame src={frame} filter={cssFilter} />
              )}

              {draft && <CropOverlay rect={draft.rect} ratio={draftRatio} onChange={(rect) => setDraft({ ...draft, rect })} />}

              {/* Hidden while drawing so it never sits under the box's size label. */}
              {!draft && (
                <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-1.5 py-px text-2xs text-white">
                  {file.id} · {recording.cameraName}
                </span>
              )}
              {activeCrop && !draft && (
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-px text-2xs font-bold text-primary-foreground">
                  <Crop className="size-3" />
                  {activeCrop.name}
                </span>
              )}
            </div>
          </div>

          {/* Resolved settings — legible in review without opening devtools */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-border px-4 py-2.5 font-mono text-2xs text-muted-foreground">
            <span>brightness: <span className="text-foreground">{enh.brightness}%</span></span>
            <span>contrast: <span className="text-foreground">{enh.contrast}%</span></span>
            <span>sharpness: <span className="text-foreground">{enh.sharpness}</span></span>
            <span>
              crop: <span className="text-foreground">{activeCrop ? `${activeCrop.name} (${describeRect(activeCrop.rect)})` : "off"}</span>
            </span>
          </div>
        </div>


        {/* ── Controls ── */}
        <div className="flex flex-col gap-4">
          <SectionCard collapsible size="sm" title="Image" description="Applied on playback and on export.">
            <div className="space-y-4">
              <Slider
                label="Brightness"
                value={enh.brightness}
                min={50}
                max={180}
                suffix="%"
                neutral={100}
                onChange={(v) => patch({ brightness: v })}
              />
              <Slider
                label="Contrast"
                value={enh.contrast}
                min={50}
                max={200}
                suffix="%"
                neutral={100}
                onChange={(v) => patch({ contrast: v })}
              />
              <Slider
                label="Sharpness"
                value={enh.sharpness}
                min={0}
                max={100}
                suffix=""
                neutral={0}
                onChange={(v) => patch({ sharpness: v })}
              />
            </div>
          </SectionCard>

          <SectionCard collapsible size="sm" title="Crop" description="Draw it on the video, save, switch on.">
            <div className="space-y-3">
              <Button
                variant={draft && !draft.editingId ? "default" : "outline"}
                size="sm"
                className="w-full gap-1.5"
                onClick={() => (draft ? setDraft(null) : startCrop())}
              >
                <Crop className="size-3.5" />
                {draft ? "Cancel cropping" : "Draw crop area"}
              </Button>

              {savedCrops.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                  No saved crops yet. Draw one on the video and save it.
                </p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {savedCrops.map((c) => {
                    const on = c.id === activeCropId;
                    return (
                      <li key={c.id} className={cn("flex items-center gap-2 px-3 py-2", on && "bg-primary/5")}>
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate text-sm font-semibold", on ? "text-primary" : "text-foreground")}>{c.name}</p>
                          <p className="font-mono text-2xs text-muted-foreground">{describeRect(c.rect)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground"
                          aria-label={`Edit ${c.name}`}
                          onClick={() => startCrop(c)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          aria-label={`Delete ${c.name}`}
                          onClick={() => deleteCrop(c.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <Switch
                          checked={on}
                          onCheckedChange={(v) => setActiveCropId(v ? c.id : null)}
                          aria-label={`Apply ${c.name} to the video`}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </SectionCard>

          {/* ── The camera-day's other files — operation only ── */}
          {files.length > 1 && (
            <SectionCard
              collapsible
              size="sm"
              title={`Recordings in ${recording.id}`}
              description={`${files.length} files · enhancements apply to all`}
              flushBody
            >
              <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto">
                {files.map((f) => {
                  const active = f.id === file.id;
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => pickFile(f.id)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 py-2 pr-4 text-left transition-colors duration-[var(--duration-fast)] ease-standard",
                          active ? "bg-primary/10" : "hover:bg-muted/50",
                          // Motion clips sit under their standby.
                          f.type === "motion" ? "pl-8" : "pl-4"
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate font-mono text-sm", active ? "font-semibold text-primary" : "text-foreground")}>
                            {f.id}
                          </p>
                          <p className="mt-0.5 whitespace-nowrap font-mono text-2xs text-muted-foreground">
                            {f.startsAt} – {f.endsAt} · {f.fileSizeDisplay}
                          </p>
                        </div>
                        <TypeChip rec={f} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          )}

          <div className="rounded-xl border border-border bg-card p-3">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 flex-shrink-0 text-primary" />
              Enhancements are non-destructive — they are stored alongside the clip and applied
              on playback or when exporting. The original recording is untouched.
            </p>
          </div>
        </div>
      </div>

      <ExportEnhancedModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        items={exportable}
        currentId={recording.id}
        onExport={(chosen) => {
          setExportOpen(false);
          const all = chosen.flatMap((c) => c.files);
          const totalMb = all.reduce((t, f) => t + f.fileSizeMb, 0);
          const fileName = chosen.length === 1 ? `${chosen[0].rec.id}-enhanced.zip` : `Accel-enhanced-${chosen.length}-recordings.zip`;
          // Progress shows in the top bar's download indicator, as Recordings → Export does.
          startDownload({
            fileName,
            files: all.map((f) => ({ name: `${f.id}-enhanced.mp4`, size: f.fileSizeDisplay })),
            totalMb,
          });
          toast.success(`Exporting ${fileName}`, {
            description: "Follow its progress from the download icon at the top.",
            duration: 3000,
          });
        }}
      />
    </div>
  );
}

export default VideoEnhancement;
