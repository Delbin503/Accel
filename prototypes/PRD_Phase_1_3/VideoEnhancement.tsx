import * as React from "react";
import { Download, Eye, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/shared/SectionCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { MOCK_CAMERAS } from "@/mocks/cameras";

/* ── Enhancement state ───────────────────────────────────────────────────── */

interface Enhancement {
  brightness: number; // %
  contrast: number;   // %
  sharpness: number;  // 0–100, drives the convolve kernel below
  crop: { top: number; right: number; bottom: number; left: number }; // % inset
}

const NEUTRAL: Enhancement = {
  brightness: 100,
  contrast: 100,
  sharpness: 0,
  crop: { top: 0, right: 0, bottom: 0, left: 0 },
};

const CROP_PRESETS = [
  { id: "free",  label: "Free",   inset: null },
  { id: "16:9",  label: "16:9",   inset: { top: 0, right: 0, bottom: 0, left: 0 } },
  { id: "4:3",   label: "4:3",    inset: { top: 0, right: 12, bottom: 0, left: 12 } },
  { id: "1:1",   label: "Square", inset: { top: 0, right: 22, bottom: 0, left: 22 } },
  { id: "focus", label: "Centre", inset: { top: 18, right: 18, bottom: 18, left: 18 } },
] as const;

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

export function VideoEnhancement() {
  const clips = MOCK_CAMERAS.filter((c) => c.nvrId).slice(0, 5);
  const [clipId, setClipId] = React.useState(clips[0]?.id ?? "");
  const [enh, setEnh] = React.useState<Enhancement>(NEUTRAL);
  const [preset, setPreset] = React.useState<string>("free");
  const [showOriginal, setShowOriginal] = React.useState(false);

  const clip = clips.find((c) => c.id === clipId) ?? clips[0];
  const dirty = JSON.stringify(enh) !== JSON.stringify(NEUTRAL);

  function patch(next: Partial<Enhancement>) {
    setEnh((e) => ({ ...e, ...next }));
  }

  function patchCrop(side: keyof Enhancement["crop"], v: number) {
    setPreset("free");
    setEnh((e) => ({ ...e, crop: { ...e.crop, [side]: v } }));
  }

  function applyPreset(id: string) {
    setPreset(id);
    const p = CROP_PRESETS.find((c) => c.id === id);
    if (p?.inset) patch({ crop: { ...p.inset } });
  }

  /* Brightness and contrast are native CSS filters. Sharpness has no CSS
     equivalent, so it runs through the SVG convolve kernel defined below —
     amount 0 leaves the frame untouched. */
  const cssFilter = showOriginal
    ? "none"
    : [
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

  const crop = showOriginal ? NEUTRAL.crop : enh.crop;

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
          <PageHeader.Description>
            VMS-VPB-004 — crop, brightness, sharpness and contrast, applied to the clip for
            review and export. The stored recording is never modified.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button
            variant="outline"
            size="sm"
            disabled={!dirty}
            onClick={() => { setEnh(NEUTRAL); setPreset("free"); }}
            className="gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button size="sm" disabled={!dirty} className="gap-1.5">
            <Download className="size-3.5" />
            Export Enhanced
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Viewer ── */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
            <Select value={clipId} onValueChange={setClipId}>
              <SelectTrigger className="h-8 w-[240px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {clips.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Press-and-hold to see the untouched frame */}
            <Button
              variant={showOriginal ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              onKeyDown={(e) => e.key === " " && setShowOriginal(true)}
              onKeyUp={() => setShowOriginal(false)}
            >
              <Eye className="size-3.5" />
              Hold to compare
            </Button>
          </div>

          <div className="bg-black p-4">
            <div className="relative mx-auto aspect-video w-full overflow-hidden rounded-lg">
              {/* Stand-in frame — a gradient with structure, so the filters are visible. */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950"
                style={{ filter: cssFilter }}
              >
                <div className="absolute left-[12%] top-[22%] size-24 rounded-full bg-neutral-500/40 blur-xl" />
                <div className="absolute right-[18%] bottom-[18%] h-28 w-40 rounded-lg bg-neutral-400/25" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-neutral-500/40" />
              </div>

              {/* Crop mask — the discarded region dims rather than disappearing,
                  so the operator can see what is being cut. */}
              {(crop.top || crop.right || crop.bottom || crop.left) > 0 && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-black/55" />
                  <div
                    className="pointer-events-none absolute border-2 border-primary/80"
                    style={{
                      top: `${crop.top}%`,
                      right: `${crop.right}%`,
                      bottom: `${crop.bottom}%`,
                      left: `${crop.left}%`,
                      boxShadow: "0 0 0 9999px rgba(0,0,0,0)",
                    }}
                  >
                    <div
                      className="absolute inset-0 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950"
                      style={{
                        filter: cssFilter,
                        backgroundSize: `${100 / (1 - (crop.left + crop.right) / 100)}% ${100 / (1 - (crop.top + crop.bottom) / 100)}%`,
                      }}
                    />
                    <span className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-px font-mono text-3xs font-bold text-primary-foreground">
                      CROP
                    </span>
                  </div>
                </>
              )}

              <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-px text-2xs text-white">
                {clip?.name}
              </span>
              {showOriginal && (
                <span className="absolute right-2 top-2 rounded bg-info px-1.5 py-px text-2xs font-bold uppercase tracking-wider text-white">
                  Original
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
              crop: <span className="text-foreground">
                {enh.crop.top}/{enh.crop.right}/{enh.crop.bottom}/{enh.crop.left}
              </span>
            </span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex flex-col gap-4">
          <SectionCard title="Image" description="Applied on playback and on export.">
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

          <SectionCard title="Crop" description="Trim the frame before export.">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {CROP_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors duration-[var(--duration-fast)] ease-standard",
                      preset === p.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {(["top", "right", "bottom", "left"] as const).map((side) => (
                  <Slider
                    key={side}
                    label={side}
                    value={enh.crop[side]}
                    min={0}
                    max={40}
                    suffix="%"
                    neutral={0}
                    onChange={(v) => patchCrop(side, v)}
                  />
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="rounded-xl border border-border bg-card p-3">
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3 flex-shrink-0 text-primary" />
              Enhancements are non-destructive — they are stored alongside the clip and applied
              on playback or when exporting. The original recording is untouched.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
