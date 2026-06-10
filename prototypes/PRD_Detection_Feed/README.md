# PRD — Detection Feed listing (+ Dismissed Events bulk Restore)

Throwaway prototype to validate the **listing pattern** for the live Detection Feed and to
add **bulk Restore** to Dismissed Events. Isolated from `src/`.

## Run

```bash
npm run prototype        # vite on http://localhost:5174
# then open:
# http://localhost:5174/PRD_Detection_Feed/
```

Top-right **Dev · State** control flips the view through every state (Populated / Loading /
Empty / Error). Use the **Detection Feed / Dismissed Events** toggle to switch views.

## The decision (why this pattern)

The feed is **live-streaming**, **date-grouped**, **high/unbounded volume**, with **bulk
multi-select + destructive batch actions**. That combination rules out classic numbered
pagination (page contents reshuffle under the operator on every live prepend) and auto-infinite
scroll (scroll-jank vs. live prepend, runaway loading). Resolved design:

| # | Decision | Choice |
|---|----------|--------|
| 1 | Feed nature | Live streaming (events prepend in real time) |
| 2 | Volume | High / unbounded — filters are the primary scoping tool |
| 3 | Older events | **Manual "Load older entries" button** (not auto-on-scroll) |
| 4 | New live events | **"N new events" pill** — operator pulls them in (never auto-prepend mid-triage) |
| 5 | Virtualization | None for v1 — manual load + hard cap keeps the DOM flat |
| 6 | Sizes | **Initial 20 · +20 per "Load older" click · no cap** (loads until caught-up) |
| 7 | Selection safety | Selection persists across loads; **bottom roll-off pauses while anything is ticked** so a bulk action can never hit an off-screen row |
| 8 | States | Skeleton (initial) · button spinner (load older) · empty · error+retry · caught-up / cap hint |

**Invariant:** every load is a fixed ~30-row cost — never "load everything." That's the fix for
the loading-time concern, independent of pattern.

> Nuance deferred: auto-prepend is *safe* only when the operator is at the very top with nothing
> selected. v1 keeps it simple — always gate new events behind the pill.

## Dismissed Events

Mirrors the feed (bulk multi-select + Load-older + states), **minus the live pill** (it isn't a
live stream). Adds **bulk Restore**: ticking rows reveals a "Restore N" action that opens a
**confirmation modal** listing exactly which events will be restored before committing.

## Fidelity

This prototype renders the **real module**, not a lookalike: it mounts the actual `AppSidebar` +
header shell (via `MemoryRouter`) and uses **copies of the real pages** so you get the real event
cards, the per-event action buttons, the **EventDrawer**, and the **Escalate / Dismiss / Link**
modals (imported straight from `@/pages/detection-feed/*`). The new listing behaviour is layered
on top of those copies — nothing is moved or restyled.

## Files

| File | Role |
|------|------|
| `index.tsx` | Shell: real `AppSidebar` + header + routes (`/detection-feed`, `/detection-feed/dismissed`) + floating **State Tester** + `<Toaster>` |
| `RealDetectionFeed.tsx` | Copy of `src/pages/detection-feed/index.tsx` + layered Load-older / cap / live pill / forced states |
| `RealDismissed.tsx` | Copy of the real Dismissed page + **bulk multi-select, bulk Restore, and the confirmation modal** |
| `shared.tsx` | Skeleton / error / load-more footer + `ForcedState` |
| `StateTester.tsx` | **PROTOTYPE-ONLY** dev control to force states |
| `proto.css` | Pulls in the app Tailwind theme + tokens |

> The real pages have ~14 events — too few to show Load-older. `RealDetectionFeed` augments the
> data by **cloning real events** onto the existing date buckets (~200) so the cap is reachable
> with full card fidelity. Marked `PROTOTYPE-ONLY`.

## Promoting to `src/`

Apply the layered diffs back onto the real `src/pages/detection-feed/index.tsx` and the Dismissed
page. **Do NOT carry over:**

- `StateTester.tsx`, `FloatingTester`, and the `MemoryRouter`/shell in `index.tsx` (the real app
  already provides the layout + router).
- The `forced` / `onResolveForced` props and every block marked **`PROTOTYPE-ONLY`** — the
  `forced === "loading" | "empty" | "error"` override branches (replace with real data-layer
  states), the cloned `FEED_DATA` augmentation, and the simulated live `setInterval`.

Everything else (Load-older button +20/page, caught-up footer, the "N new events" pill, the
Areas filter, the back-to-top button,
bulk multi-select, the **bulk Restore + confirmation modal**) ports directly.
