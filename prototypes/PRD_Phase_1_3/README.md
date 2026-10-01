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

### Separate module · Model (Re-ID)

Not a Phase 1.3 page — a module of its own, listed under **Separate module** on
the index. Opening it lands on `/reid/live`, and while you're inside it the
sidebar shows only its three pages: Live Monitoring (`/reid/live`), Model
Management (`/reid/models`) and Model Deployment (`/reid/deployment`). The
Phase 1.3 breadcrumb is the way back.

`reid/ReidLiveMonitoring.tsx` is the module's own copy of the Phase 1.3 Live
Monitoring, so either can change without the other. Model Management and
Model Deployment are the app's pages; `/models` and `/deployment` redirect into
the module so links inside them stay there. Pages and nav: `reid/reidNav.ts`.

**Model Management and Model Deployment are the module's own copies**
(`reid/ReidModelManagement.tsx`, `reid/ReidModelDeployment.tsx`) of the app's
pages, so these changes stay out of the app. Both read one models store
(`reid/reidModels.ts`), so a model created in one can be deployed from the other.

- **Category** — Create Model asks for one (RE-ID, Weapon Detection, Human
  Detection, PPE Detection, Object Detection, Zone Monitoring). It shows on the
  model card, and a **category filter** sits under the tags filter.
- **No calibration file on steps** — Add Step is the same for every category.
  RE-ID models are calibrated per camera when they're deployed.
- **Calibration drawer** — choosing a RE-ID model, site, area and cameras,
  then **Ready to Deploy**, opens the calibration drawer
  (`reid/ReidCalibration.tsx`) instead of the zone modal. It is 860 px wide,
  like the Cameras and NVR drawers, and the camera view fits that width. At the
  top is a camera
  dropdown listing the selected cameras, each marked *not calibrated*,
  *placed · not saved*, *calibrated* or *offline*; below it is the camera view.
  The footer holds **Auto-Place Markers** and **Confirm Calibration** on the
  left and **Save & Deploy** on the right. Auto-Place fits the markers in view,
  drops outliers and joins the rest into the zone; each re-run is a new fit.
  Under the view, every marker is listed as on the boundary, inside the zone,
  or dropped. **Edit markers** turns each row's floor x / y and fit error into
  inputs. **Save changes** re-fits the zone: an error of 12 cm or more drops the
  marker, and edited rows are tagged. Confirm Calibration saves the camera with
  a toast and moves to the next uncalibrated one. **Calibrate All Cameras**
  (footer, right) does it in one go instead: it auto-places every camera that
  isn't calibrated yet, re-running poor fits up to 8 times, saves them all, and
  opens the merged zone map. Any camera that still can't get a usable fit is
  named in a warning and left selected to fix by hand. The "N of N cameras
  calibrated" count sits under the camera dropdown. **View Map**, on the right
  of that row, opens the site map of the cameras calibrated so far. It is a
  view-only pop-up with just Close, and is disabled until one camera is saved. Closing the drawer keeps the
  progress; changing the selection resets it.
- **Save & Deploy + site map** — **Save & Deploy** unlocks once every online
  camera is calibrated (offline ones calibrate on reconnect). It opens
  `reid/ReidSiteMap.tsx` over the drawer, as a standard 840 px (`xl`) modal: every zone on one floor plan in
  metres, using hand-corrected positions, with the site origin, each marker,
  and where each camera stands. Cameras sharing ≥ 2 markers form one linked
  group and share a colour; a split map is flagged.
  **Confirm & deploy** writes the deployment and shows the usual toast.
  Each linked group becomes a **Re-ID map** (`reid/reidMaps.ts`) that Live
  Monitoring tracks weapons on; a camera sits on one map at a time.
- **Zone map in deployment history** — a RE-ID model's History drawer has
  **Cameras** and **Zone map** tabs. Zone map shows each calibrated map its
  cameras run on: the floor plan, its linked groups, and an **Export** menu.
  - **Calibration (.json):** camera poses, markers, corrected positions and
    floor zones (`reid/mapExport.ts`).
  - **Map image (.png):** the floor plan at 2×.
  The seeded Re-ID maps come with matching history records
  (`reid/reidDeployments.ts`), and a redeploy replaces a camera's earlier
  record for the same model.
- **Live Monitoring layout** — one camera wall, following the wireframe:
  - **Header:** title and description, with a **Cameras & Tracking** toggle on
    the right (it shows the active track count).
  - **Filter bar:** the sites dropdown, **Grid view** (Auto · fit to width,
    1×1, 2×2, 3×3, 4×4) and camera search.
  - **Summary line:** "All sites · N cameras total · N online", with a pager
    when a fixed grid can't fit every camera.
  - **The grid.** Auto shows every camera, as many across as fit: 5 on a wide
    screen, and 4 once the panel is open. N×N pages through N² at a time.
- **Cameras & Tracking panel** — the toggle opens it on the right and the wall
  reflows to make room.
  - **Cameras tab:** the cameras grouped by area. This is the default view:
    the wall shows every camera. Clicking a camera, here or on the wall,
    highlights it in both places: an orange outline and an orange id chip.
    Both scroll to it, and a fixed grid also turns to its page.
  - **Tracking tab:** every active weapon track, a map picker and a mini map
    of the weapon in focus. Clicking the mini map opens the enlarged map with
    every weapon on it. While this tab is open, the wall is in **Map view**: it
    shows only the shown map's cameras (site filter aside; search still
    applies). The summary line names the map and has a **Show all cameras**
    link back to the Cameras tab.
  - **Full height:** the wall sits in a card that stretches to the bottom of
    the screen. The panel matches the wall's height and its list scrolls
    inside, so nothing leaves blank space at the bottom.
  - **Weapon tags:** clicking a `W-xx` tag on a tile, a track row or a weapon
    on the map highlights that weapon and opens the Tracking tab. While it is
    highlighted, the camera it's in stays outlined on the wall as it moves.
  - **Removed for now:** the visitor KPI cards, the "entered camera" toasts,
    and the Hero view with its auto-follow.
  Tracks are simulated in `reid/weaponTracks.ts` — each walks its route between
  camera zones in real time, so every view agrees on where a weapon is.
  The site marker map, camera poses and fits are simulated in
  `reid/calibrationGeometry.ts`, seeded by id, so each camera sees the markers
  in front of it and overlapping cameras share them.

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
