# PRD · Phase 1.3 — Proposals

Four proposed features for the next phase. The prototype opens on a **phase
index** that links to each one as its own page, in the module it would ship
inside — not as tabs, so each is reviewed at the size it would really be.

Run it with `npm run prototype` and open `/PRD_Phase_1_3/`.

Routes mirror the real app's, so the sidebar's own links land on the matching
proposal rather than bouncing back to the index.

| Page | Route | Ships inside | Requirements |
|---|---|---|---|
| System Configuration | `/config` | Camera Defaults › Recording Schedule | VMS-VR-001 … 004 |
| Synchronised Playback | `/live` | Live Monitoring | VMS-VPB-001, VMS-VPB-002 |
| Recordings | `/recordings` | Recordings | VMS-VR-001 … 004 |
| Recordings by Type | `/recordings/by-type` | Recordings | VMS-VR-001 … 004, VMS-VPB-003 |
| Video Enhancement | `/enhancement` | Recordings › playback | VMS-VPB-004 |

---

## 1 · System Configuration › Recording Schedule

A copy of the real System Configuration page — same section nav, same Stream
Defaults, same field chrome — landing on **Camera Defaults**, where the
Recording Schedule section now holds the four recording types.

`src/pages/system-config/index.tsx` is **not** touched. `SystemConfigRecording.tsx`
is a prototype-local copy so the proposal can be reviewed against the live page
without changing it. The only edits against the original are the default
section, and the Recording Schedule card's body.

Per type: an **enable switch**, **start time**, **end time**, **resolution** and
**frame rate**. Continuous is fixed to 24/7, so its window is not editable.

- **Whether all four are needed is still open** — every type can be switched
  off, and switching one off removes it from the coverage strip and stops it
  producing recordings on the Recordings page.
- **Spec minimums warn, they do not block.** Dropping Motion below 1080p/60
  quotes VMS-VR-003 back rather than refusing the change, because the minimums
  are still under discussion.
- **A window whose end is at or before its start runs overnight** and draws as
  two bands on the coverage strip — the default Standby 06:00 PM – 06:00 AM is
  the case to look at.

## 2 · Synchronised Playback (Live Monitoring, rebuilt)

Hero and Wall views, both selectable and both scrubbable.

**Selecting.** Hovering a tile reveals a checkbox; once checked it stays
visible. A selection bar collects the picks at the bottom of the page — the
same pattern as Detection Feed — offering **Clear selection** and **Playback
settings**.

**Playback settings** narrows the view to just the selected cameras and swaps
the selection bar for one set of transport controls driving all of them:
shared timeline, play/pause, ±30s, speed 0.25×–8×, zoom, mute and Go live.
Clearing the selection drops back out.

**Per-tile player.** Hovering any tile also reveals its own player bar —
draggable timeline with a scrub preview and event markers, a **LIVE** tag that
turns into how far back the tile is sitting (click it to jump back to live),
and a settings dropdown with annotations, speed, zoom and quality. Drag one
tile back and only that tile leaves the live edge; the rest keep running.

`BUFFER_SEC` is the how-far-back limit — 6 hours.

## 3 · Recordings

The Recordings page, reshaped around the fact that a camera no longer produces
one file a day. A card is a **camera-day**, and its chip counts what is inside
it — `3 Recordings` — instead of naming a single mode.

Opening a card **leads with Recording Info**, not a video: with several
recordings behind one card there is no single video to open on. Below it, a
**Recordings** section lists what that camera captured that day — type, window,
duration, clip count and size — and picking one **opens the player in a
pop-up**, over the drawer, with its own timeline and detected periods.

Deleting is per camera-day, so the confirmation counts the files it will take
with it rather than saying "1 recording".

## 3b · Recordings by Type

The same footage as a flat list: one row per type per camera-day, grouped into a
collapsible camera-day whose header dots show which types produced footage.

- **Motion is the exception to one row = one file.** It captures in bursts, so
  it reports a clip count and total duration instead of `1 file`.
- **Starred clips (VMS-VPB-003)** tint the row, carry a `PROTECTED` chip and
  **disable delete** — the control says why rather than failing on click. The
  Starred KPI doubles as a filter. Two clips start starred so the state is
  visible without clicking first.

## 4 · Video Enhancement

Crop, brightness, sharpness and contrast on a recorded clip, non-destructive —
the stored recording is never modified.

Brightness and contrast are native CSS filters. **Sharpness has no CSS
equivalent**, so it drives an SVG `feConvolveMatrix` kernel scaling from
identity to full sharpen. Crop has presets plus per-side insets, and the
discarded region dims rather than disappearing so you can see what is being
cut. **Hold to compare** shows the untouched frame.

---

## Caveats

- Everything here is prototype-local. Nothing under `src/` is modified.
- Video is simulated — tiles are gradients, so speed and zoom change the
  controls and the readouts, not real footage.
- `recordingTypes.ts` is the single source for the four types, and
  `dayRecordings.ts` builds the footage from it once — so the config, the
  coverage strip, the Recordings page and the by-type list all describe the
  same recordings, down to the IDs.
- `playback.ts` holds the playback state shape and helpers; `playbackControls.tsx`
  holds the scrub track and chip rows shared by a tile and the synchronised bar.
