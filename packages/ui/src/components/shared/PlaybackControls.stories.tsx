import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Maximize2, Pause, Play, Volume2, VolumeX, ZoomIn } from "lucide-react";
import { ChipRow, IconButton, PlaybackSettingsMenu, ScrubTrack, ZoomSurface } from "./PlaybackControls";
import { LIVE_STATE, NO_ZOOM, SPEEDS, type PlaybackState, type ZoomState } from "../../lib/playback";

/**
 * Playback controls shared by a camera tile and the synchronised bar:
 * `ScrubTrack`, `IconButton`, `PlaybackSettingsMenu` (with `ChipRow`) and
 * `ZoomSurface`. They are drawn for a dark video frame, so stories sit on a
 * `bg-scrim` surface.
 */
const meta: Meta<typeof ScrubTrack> = {
  title: "Shared/PlaybackControls",
  component: ScrubTrack,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ScrubTrack>;

const NOW = new Date("2026-11-14T14:30:00");
const MARKERS = [
  { at: 18000, tone: "info" as const, label: "Person · Gate 3" },
  { at: 9000, tone: "warning" as const, label: "Loitering · Loading Bay" },
  { at: 2400, tone: "critical" as const, label: "Intrusion · Perimeter East" },
];

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="relative w-[36rem] rounded-xl bg-scrim p-4 pt-10">{children}</div>;
}

/** Full player bar: play/pause, mute, scrub track with event markers, settings. */
export const Default: Story = {
  render: function DefaultStory() {
    const [pb, setPb] = React.useState<PlaybackState>({ ...LIVE_STATE, offsetSec: 3600 });
    return (
      <Frame>
        <ScrubTrack offsetSec={pb.offsetSec} onChange={(o) => setPb({ ...pb, offsetSec: o })} now={NOW} markers={MARKERS} />
        <div className="mt-2 flex items-center gap-1">
          <IconButton label={pb.playing ? "Pause" : "Play"} onClick={() => setPb({ ...pb, playing: !pb.playing })}>
            {pb.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          </IconButton>
          <IconButton label={pb.muted ? "Unmute" : "Mute"} onClick={() => setPb({ ...pb, muted: !pb.muted })}>
            {pb.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </IconButton>
          <span className="ml-2 font-mono text-xs text-media-foreground/85">{pb.speed}×</span>
          <div className="ml-auto flex items-center gap-1">
            <PlaybackSettingsMenu pb={pb} onChange={(p) => setPb({ ...pb, ...p })} />
            <IconButton label="Fullscreen">
              <Maximize2 className="size-4" />
            </IconButton>
          </div>
        </div>
      </Frame>
    );
  },
};

/** At the live edge (offset 0). */
export const Live: Story = {
  render: function LiveStory() {
    const [offset, setOffset] = React.useState(0);
    return (
      <Frame>
        <ScrubTrack offsetSec={offset} onChange={setOffset} now={NOW} />
      </Frame>
    );
  },
};

/** Small track and compact buttons for sidebar tiles. */
export const Compact: Story = {
  render: function CompactStory() {
    const [offset, setOffset] = React.useState(1200);
    return (
      <div className="w-64 rounded-lg bg-scrim p-3 pt-8">
        <ScrubTrack size="sm" offsetSec={offset} onChange={setOffset} now={NOW} markers={MARKERS} />
        <div className="mt-1.5 flex items-center gap-1">
          <IconButton compact label="Play"><Play className="size-3.5" /></IconButton>
          <IconButton compact label="Zoom" active><ZoomIn className="size-3.5" /></IconButton>
          <IconButton compact label="Mute" disabled><VolumeX className="size-3.5" /></IconButton>
          <div className="ml-auto">
            <PlaybackSettingsMenu compact pb={LIVE_STATE} onChange={() => {}} />
          </div>
        </div>
      </div>
    );
  },
};

/** IconButton states: default, active, disabled. */
export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-2 rounded-lg bg-scrim p-3">
      <IconButton label="Play"><Play className="size-4" /></IconButton>
      <IconButton label="Zoom (on)" active><ZoomIn className="size-4" /></IconButton>
      <IconButton label="Mute (unavailable)" disabled><VolumeX className="size-4" /></IconButton>
    </div>
  ),
};

/** Speed chips as they appear inside the settings menu. */
export const SpeedChips: Story = {
  render: function ChipsStory() {
    const [speed, setSpeed] = React.useState<number>(1);
    return (
      <div className="w-56 rounded-lg border border-border bg-popover p-3">
        <ChipRow label="Playback speed" options={SPEEDS} value={speed as (typeof SPEEDS)[number]} onChange={setSpeed} format={(v) => `${v}×`} />
      </div>
    );
  },
};

/** Zoom mode armed over a frame — scroll or +/− to zoom, Esc to exit. */
export const Zoom: Story = {
  render: function ZoomStory() {
    const [zoom, setZoom] = React.useState<ZoomState>({ ...NO_ZOOM, level: 2 });
    const [armed, setArmed] = React.useState(true);
    return (
      <div className="relative h-56 w-96 overflow-hidden rounded-xl bg-scrim">
        <span className="absolute left-3 top-3 font-mono text-2xs text-media-foreground/70">CAM-014 · Loading Bay North</span>
        {armed ? (
          <ZoomSurface zoom={zoom} onChange={setZoom} onExit={() => setArmed(false)} />
        ) : (
          <button type="button" onClick={() => setArmed(true)} className="absolute inset-0 text-sm text-media-foreground/80">
            Zoom off — click to re-arm
          </button>
        )}
      </div>
    );
  },
};
