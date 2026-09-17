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
| Recordings | `/recordings` | Recordings | VMS-VR-001 … 004, VMS-VPB-003 |
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

Each scheduled type carries an **enable switch**, **start time**, **end time**,
**resolution** and **frame rate**. Continuous is fixed to 24/7, so its window is
not editable.

**Motion is not a schedule — it is a mode standby switches into.** It sits
nested inside standby, so it can only be turned on while standby is on, and it
records inside standby's hours. It carries only what is actually its own:
resolution, frame rate, and how long to wait without motion before dropping
back — 50 seconds by default. Switch standby off and motion greys out and
stops producing recordings.

Type descriptions say what each type *is*; the numbers live in the controls
beneath them rather than being restated in prose.

- **Whether all four are needed is still open** — every type can be switched
  off, and switching one off removes it from the coverage strip and stops it
  producing recordings on the Recordings page.
- **Spec minimums warn, they do not block.** Dropping motion below its
  specified quality says so rather than refusing the change, because the
  minimums are still under discussion.
- **A window whose end is at or before its start runs overnight** and draws as
  two bands on the coverage strip — the default Standby 06:00 PM – 06:00 AM is
  the case to look at.

## 2 · Synchronised Playback (Live Monitoring, rebuilt)

Hero and Wall views, both selectable and both scrubbable.

**Counts on top.** A stat strip carries the entry-line analytics — visitors
inside, entries/exits, the gender split and the age split.

The split ones do not use the shared `KpiCard`: a single value slot turns two
categories into "168 / 163", which reads as a fraction. Each side gets its own
name, its own colour and a share of a proportion bar instead, so the balance is
legible at a glance. Visitors inside, having one number, keeps the plain card.

They roll up from whichever cameras are in view, so filtering to one site or
searching for one camera re-answers them rather than reporting the whole
estate. Visitors inside assumes 100 present at start-up, per the counting spec.

The view switch (Hero / Wall) sits with the page title, leaving the filter bar
to the site picker and search.

**Selecting.** Hovering a tile reveals a checkbox; once checked it stays
visible. A selection bar collects the picks at the bottom of the page — the
same pattern as Detection Feed — offering **Clear selection** and **Playback
settings**.

**Playback settings** narrows the view to just the selected cameras and swaps
the selection bar for one set of transport controls driving all of them:
shared timeline, play/pause, ±30s, speed 0.25×–8×, zoom, mute and Go live.
Clearing the selection drops back out.

**Per-tile player.** Hovering any tile also reveals its own player bar — a
draggable timeline with a scrub preview and event markers, back/forward 30s,
play/pause, audio, a **LIVE** tag that turns into how far back the tile is
sitting (click it to jump back to live), and a settings dropdown holding
playback speed. Drag one tile back and only that tile leaves the live edge;
the rest keep running.

**Zoom picks an area, not a level.** The zoom button arms the tile; drag a box
over the frame and that region fills the tile. It is per tile, not shared —
two operators watching the same incident frame different corners of it — so
the synchronised bar carries speed and transport only.

Both bars sit inside the page rather than pinned to the viewport, so they line
up with the camera grid above them.

`BUFFER_SEC` is the how-far-back limit — 6 hours.

## 3 · Recordings

The Recordings page, reshaped around the fact that a camera no longer produces
one file a day. A card is a **camera-day**, and its chip counts what is inside
it — `3 Recordings` — instead of naming a single mode.

Opening a card **leads with Recording Info**, not a video: with several
recordings behind one card there is no single video to open on. Below it, a
**Recordings** section lists what that camera captured that day — type, window,
duration, clip count and size — and picking one **opens the player in a
pop-up**, over the drawer. The player carries the same overlay controls as the
live tiles — back/forward, play, audio, zoom-to-area, settings — over its own
timeline and detected periods.

**Starring protects (VMS-VPB-003).** The star on a card marks a camera-day as
protected: its delete button is disabled and explains why, and a bulk delete
holds the starred ones back rather than taking them with the rest. A filter
next to the sort control narrows the grid to starred recordings.

Deleting is per camera-day, so the confirmation counts the files it will take
with it rather than saying "1 recording".

## 4 · Video Enhancement

Crop, brightness, sharpness and contrast on the clip that was opened for
enhancement, non-destructive — the stored recording is never modified. There is
no clip picker: choosing footage is the Recordings list's job, not this
editor's.

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
  coverage strip and the Recordings page all describe the same recordings,
  down to the IDs.
- `playback.ts` holds the playback state shape and helpers; `playbackControls.tsx`
  holds the scrub track and chip rows shared by a tile and the synchronised bar.
