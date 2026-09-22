import { Film, LayoutDashboard, PlayCircle, Settings, Sparkles } from "lucide-react";
import { SystemConfigRecording } from "./SystemConfigRecording";
import { SyncPlaybackMonitoring } from "./SyncPlaybackMonitoring";
import { RecordingsByDay } from "./RecordingsByDay";
import { VideoEnhancement } from "./VideoEnhancement";
import { CustomDashboard } from "./CustomDashboard";

/* Phase 1.3 proposals.

   Each proposal is a full PRD page of its own, linked from the phase index,
   rather than a tab inside one page — so each is reviewed at the size it
   would actually ship at.

   Paths mirror the real app's routes, so the sidebar's own links land on the
   matching proposal instead of bouncing back to the index. */

export const PAGES = [
  {
    /* "/" is the phase index here, so the dashboard proposal takes /dashboard. */
    path: "/dashboard",
    title: "Customizable Dashboard",
    subtitle: "Dashboard, rebuilt",
    icon: LayoutDashboard,
    refs: "No ref yet",
    summary:
      "The current dashboard, now arranged by each user. Customize enters edit mode: drag panels to reorder, click one to move or remove it, and drag hidden panels back in from the drawer.",
    points: [
      "Visitor counts join as a panel of their own",
      "Removed panels park in a drawer, never lost",
      "Cancel reverts, Reset restores the default",
    ],
    Component: CustomDashboard,
  },
  {
    path: "/config",
    title: "System Configuration",
    subtitle: "Camera Defaults › Recording Schedule",
    icon: Settings,
    refs: "VMS-VR-001 … 004",
    summary:
      "The four recording types configured where they would really live — inside Camera Defaults. Each type has its own enable switch, start and end time, resolution and frame rate.",
    points: ["Continuous, Standby, Motion-Based and Training", "Spec minimums warn rather than block", "Daily coverage strip, overnight windows included"],
    Component: SystemConfigRecording,
  },
  {
    path: "/live",
    title: "Synchronised Playback",
    subtitle: "Live Monitoring, rebuilt",
    icon: PlayCircle,
    refs: "VMS-VPB-001, VMS-VPB-002",
    summary:
      "Hero and Wall views with a checkbox on every tile. Pick several cameras, open Playback settings, and the view narrows to just those channels with one set of controls driving all of them.",
    points: ["Hover a tile for its own scrubber, LIVE tag and settings", "Selection bar → Clear selection · Playback settings", "Shared speed, zoom and transport across the selection"],
    Component: SyncPlaybackMonitoring,
  },
  {
    path: "/recordings",
    title: "Recordings",
    subtitle: "Recordings, rebuilt",
    icon: Film,
    refs: "VMS-VR-001 … 004",
    summary:
      "The Recordings page where a card is a camera's whole day, not one file. The chip counts the recordings inside it, and opening it leads with the recording info rather than a video.",
    points: [
      "Card chip reads \"3 Recordings\", not a single mode",
      "Drawer opens on Recording Info, then lists the day's recordings",
      "Picking one opens the player in a pop-up",
    ],
    Component: RecordingsByDay,
  },
  {
    path: "/enhancement",
    title: "Video Enhancement",
    subtitle: "Recordings › playback",
    icon: Sparkles,
    refs: "VMS-VPB-004",
    summary:
      "Non-destructive crop, brightness, sharpness and contrast on a recorded clip, with a hold-to-compare against the untouched frame.",
    points: ["Crop presets plus per-side insets", "Discarded region dims instead of disappearing", "Sharpness runs through an SVG convolve kernel"],
    Component: VideoEnhancement,
  },
] as const;
