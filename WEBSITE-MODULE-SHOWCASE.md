# Accel — Website Module Showcase

A curated list of which Accel modules are website-ready, with draft section
copy for each. Pulled from the actual product (not aspirational) so nothing
here overpromises what a prospect will see in a demo.

## Recommendation at a glance

Accel has 14 modules. Not all of them are "front door" material — some are
necessary plumbing (billing, user seats, audit logs) that enterprise buyers
check for during procurement but that don't sell the product on their own.
The website should lead with the AI/workflow story and fold the plumbing into
one trust-and-governance section near the bottom.

| # | Section | Modules folded in | Why it's on the site |
|---|---|---|---|
| 1 | Live Monitoring | Live Monitoring | Visual hook — this is the screenshot that makes someone stop scrolling |
| 2 | Detection Feed | Detection Feed + Dismissed Events | The clearest "AI is actually doing something" moment |
| 3 | Run Analysis | Run Analysis | The flagship differentiator — VLM-verified SOP compliance, nothing else in the deck does this |
| 4 | Rules Library | Rules Library | Turns "AI" from a black box into something a non-engineer can configure — big trust unlock |
| 5 | AI Model Lifecycle | Model Management + Model Deployment | Tells the "how it stays accurate" story without needing two separate, thinner sections |
| 6 | Incident Cases | Incident Cases | Closes the loop — detection → investigation → resolution |
| 7 | Site & Device Management | Site Overview + Cameras + NVR + Device Health | The unglamorous but necessary "yes it manages your actual hardware" proof |
| 8 | Built for the Enterprise | User Management + Billing + Activity Logs | One compact section for RBAC, seats, audit trail, plans — answers procurement questions without diluting the AI story |
| — | Dashboard | Dashboard | Use for in-app screenshots / hero background, not its own pitch — it's a rollup of the other sections, not a differentiator by itself |
| — | Recordings | Recordings | Leave off the site; mention only in a feature-comparison table or docs, not the pitch |

Everything below is section copy for the 8 recommended modules, in the order
they should appear on the page.

---

## 1. Live Monitoring

**Positioning:** *One console, every site, live.*

Accel's Live Monitoring is the command-center view — the screen an operator
keeps up all day.

- Three view modes built for different jobs: **Hero** (one large feed +
  grouped sidebar for focused watching), **Wall** (uniform grid with
  pagination for broad coverage), and **Custom** (free-form drag-and-resize
  layout, up to 24×16 tiles, for building a purpose-built ops wall)
- Custom layouts are named, saved, and shared **organization-wide** — every
  operator on shift sees the same layout, not a personal one trapped in their
  browser
- Live tile chrome shows exactly what's happening at a glance: LIVE badge,
  animated recording indicator, an "AI" processing tag, and a bounding-box
  detection overlay — no guessing whether a feed is actually being analyzed
- Cameras pin to the top of every filtered view, so the feeds that matter
  most never scroll out of sight
- Built-in playback controls (play/pause, mute, snapshot, fullscreen) plus a
  mini event timeline with clickable, severity-colored dots on the featured
  feed

**Suggested visual:** Hero view with a bounding-box overlay mid-detection, or
the Wall view showing 9 live tiles with one flagged in red.

**Benefit row** — three columns under the screenshot:

1. **No blind spots** — Every site, every camera, in one console. Watch one
   feed closely or forty at once without switching tools.
2. **One wall for the whole team** — Layouts are saved organization-wide, so
   every operator on shift sees the same view instead of a personal one
   trapped in their own browser.
3. **The feeds that matter stay put** — Pin your priority cameras and they
   hold the top spot across every filter, page, and view mode.

---

## 2. Detection Feed

**Positioning:** *Every alert comes with its reasoning attached.*

This is the section that proves the AI isn't a black box. Every detection
event ships with a plain-language explanation, not just a bounding box.

- Live, AI-tagged event feed with color-coded bounding-box thumbnails
  (person / vehicle / asset) and inline entity reference chips pulled
  straight out of the AI's own summary text
- Open any event and get a **VLM Reasoning** panel — a narrative description
  of the scene from the vision-language model that processed the clip — next
  to a model provenance card (model name, version, trained date, mAP) and a
  full precision/recall/F1/IoU confidence breakdown
- One-click bulk triage: multi-select events and **Escalate**, **Link to
  Case**, or **Dismiss** — no per-row clicking through a queue
- Escalating auto-generates a case title, lets the operator set
  severity/assignee, and shows SLA targets (acknowledge / initial action /
  resolution) computed from that severity
- A dedicated **Dismissed Events** queue with its own false-positive
  taxonomy (wrong class, wrong person, known exemption, staged, threshold,
  other) that feeds straight back into model tuning — dismissing isn't a
  dead end, it's training signal

**Suggested visual:** An open event drawer showing the VLM Reasoning text
next to the confidence metrics panel — this is the single best "wow, it
actually explains itself" screenshot in the product.

**Benefit row** — three columns under the screenshot:

1. **AI that explains itself** — Every event comes with a written
   description of what the model actually saw, plus the confidence numbers
   behind it. No black box, no blind trust.
2. **Clear the queue in bulk** — Select a whole batch of events and
   escalate, link, or dismiss them in a single action instead of clicking
   through one row at a time.
3. **Dismissals aren't dead ends** — Tag why a detection was wrong and that
   reason feeds straight back into model tuning, so the same false positive
   stops coming back.

---

## 3. Run Analysis

**Positioning:** *Prove a model works before it ever touches a live camera.*

This is the flagship module — the one competitors without a VLM layer simply
can't show. It's a sandbox for testing whether an AI model is actually ready
for SOP-compliance duty.

- Upload footage and run it against a detection model **and** a selectable
  vision-language model, side by side, before deployment — described in-app
  as testing "before deployment," not after something's already gone wrong
- Choice of VLM backend with honest tradeoffs shown per option: Qwen3-VL
  (256K context, built for long CCTV footage), Qwen2.5-VL (open-source,
  self-hostable), Gemini 2.5 Pro (proprietary, zero hosting overhead), and
  Tarsier2 (purpose-built for long-video CCTV QA)
- Produces a numeric **compliance score** (0–100%) with a pass/warning/fail
  verdict, a steps-passed count, and a rules-triggered count — not a vague
  "looks fine"
- Frame-by-frame processing log tied to named SOP steps — e.g. "Step 1: Chin
  strap fastened," "Step 3: Helmet not detected" — turning a video clip into
  an auditable checklist
- Transparent, usage-based pricing baked directly into the workflow: a free
  trial allowance, then metered token billing with purchasable credit packs
  — no hidden compute costs
- Full run history with filters by model, VLM, verdict, and date, plus
  one-click PDF export of any result for a compliance file

**Suggested visual:** The scoring screen — big percentage score, verdict
badge, and the step-by-step pass/fail log underneath.

**Benefit row** — three columns under the screenshot:

1. **Test before you trust** — Score a model against real footage before it
   ever touches a live camera. Find out it doesn't work in a sandbox, not in
   an incident review.
2. **A score, not a hunch** — Every run returns a 0–100% compliance score
   with a step-by-step pass/fail log you can file, export, and defend.
3. **Pay only for what you analyze** — Metered by footage minute with a free
   trial allowance included. No hidden compute bills, no annual commit to
   run your first test.

---

## 4. Rules Library

**Positioning:** *Configure detection logic without writing a line of code.*

If Run Analysis proves the AI works, Rules Library is where a security lead
— not an engineer — actually configures what it watches for.

- Visual, block-based rule builder: **WHEN** (trigger) → **IN** (zone) →
  **AND/OR** (extra conditions) → **FOR** (duration threshold) → **DURING**
  (schedule window) → **THEN** (action) — assembled by adding, reordering,
  and swapping blocks
- A live **"Rule in Plain English"** panel translates the block chain into a
  readable sentence in real time as it's built — what you configure is
  exactly what you can read back
- **Estimated trigger rate** preview: a 7-day historical chart shows how
  often this exact rule would have fired, *before* it goes live — no
  surprises from an overly sensitive rule flooding the feed on day one
  - Reusable **Rule Templates**, searchable and taggable, so a new site can
  be configured from a proven starting point instead of a blank canvas
- Severity picker (Low / Medium / Critical) ties directly into the SLA
  targets used later in Incident Cases — one decision, consistent
  downstream behavior

**Suggested visual:** The block-builder mid-assembly with the "Rule in Plain
English" sentence forming below it.

**Benefit row** — three columns under the screenshot:

1. **No code required** — Build detection logic out of visual blocks. If you
   can describe the rule out loud, you can build it yourself — no engineer,
   no ticket, no wait.
2. **Read it back in plain English** — A live sentence translates your
   blocks as you build them, so what you configured is exactly what you can
   verify before saving.
3. **Know before you go live** — A 7-day trigger-rate preview shows how
   often the rule would have fired on real history, so nothing floods the
   feed on day one.

---

## 5. AI Model Lifecycle

**Positioning:** *From raw model file to live camera, one pipeline.*

Combines Model Management and Model Deployment into a single "how a model
gets trusted" story — this is the section that answers "how do you keep
accuracy up over time?"

- Models are built as an ordered, **multi-step verification pipeline**:
  upload individual `.onnx` model files into a step pool, then arrange them
  into a sequence (e.g. chin-strap check → helmet check → bolt-group check)
  that runs in order on every clip
- **Extract from Model** auto-generates candidate detection rules straight
  from an uploaded model file — class and confidence conditions — which can
  be accepted straight into that model's attached ruleset, or built manually
  from the shared Rule Library
- A guided deploy wizard walks through Model → Site → Area → Camera →
  confidence threshold (with live low/ok/high advisory copy) → detection
  zones, applied per-camera or in bulk across a whole selection
- Deployment health is tracked automatically per camera and rolled up per
  model: **Healthy / Degraded / Offline / Overloaded** — so a model quietly
  failing on one camera doesn't hide inside an "Active" label
- Explicitly framed in-app as the *final* stage after Run Analysis — models
  don't reach a live camera until they've been scored and verified first

**Suggested visual:** The deploy wizard's zone-drawing step, or the model
health rollup strip showing a mix of Healthy/Degraded states.

**Benefit row** — three columns under the screenshot:

1. **Check every step, not just one** — Chain models into an ordered
   sequence so a single clip gets verified against your whole SOP —
   chin strap, helmet, bolt group — in order, every time.
2. **Rules that write themselves** — Upload a model file and Accel extracts
   candidate detection rules from it automatically. Accept them as-is or
   tune them first.
3. **Catch a failing model early** — Health is tracked per camera and rolled
   up per model, so a deployment quietly degrading on one feed never hides
   behind a green "Active" label.

---

## 6. Incident Cases

**Positioning:** *Every alert has somewhere to go.*

Detection Feed generates the signal; Incident Cases is where it becomes an
investigation with an owner and an outcome.

- Case lifecycle with a KPI card per stage: **Open → In Review → Action
  Taken → Closed**, plus a standing Critical count so nothing urgent gets
  buried in the queue
- Cases aggregate multiple related detection events under one investigation
  — a single incident can span several cameras or alerts, shown as an
  event-count badge on the case row
- Filterable by severity, site, and status, with saved date-range presets
  and free-text search across case ID, title, and assignee
- Confirmed multi-site coverage in the product: naval bases, logistics hubs,
  port terminals, and corporate campuses can all live in the same case queue
  side by side

**Suggested visual:** The case board/list with a mix of severity badges and
the drawer open showing linked events on one case.

**Benefit row** — three columns under the screenshot:

1. **Every alert gets an owner** — Escalate a detection into a case with an
   assignee, a severity, and an SLA clock attached from the moment it opens.
2. **One incident, one case** — Related detections across different cameras
   and times roll into a single investigation instead of scattering across
   the queue as separate alerts.
3. **Nothing gets buried** — Open, In Review, Action Taken, Closed — with a
   standing critical count so the urgent work stays visible at the top.

---

## 7. Site & Device Management

**Positioning:** *It actually manages your hardware, not just your video.*

The proof-of-substance section — this is where the product answers "but can
it handle our actual cameras and recorders?"

- **Site Overview:** upload a real floor plan and draw polygon "areas"
  directly on top of it (Armoury, Checkpoint, Loading Bay, Server Room) — the
  zones operators see everywhere else in the product are defined visually,
  here, once
- **Cameras:** full lifecycle status — Online / Offline / Connection Failed
  / Unlinked to NVR — with RTSP credentials, codec, resolution, frame rate,
  recording schedule/retention, and boundary zones all managed from one
  record
- **NVR:** per-channel management for linking/unlinking cameras, storage
  utilization tracked with a "Storage Critical" state at ≥90%, configurable
  retention/auto-cleanup policy, and an export tool (ZIP archive, individual
  MP4 pack, or manifest-only JSON) for handing footage to compliance or law
  enforcement
- **Device Health:** cameras and NVRs unified into one roster with a single
  health signal and an aggregate Health Score — sorted worst-health-first so
  the thing that needs attention is always at the top

**Suggested visual:** The floor-plan area editor with polygons drawn over a
real building layout — it's the fastest way to signal "this isn't a generic
camera list."

**Benefit row** — three columns under the screenshot:

1. **Zones drawn on your real floor plan** — Upload the actual building
   layout and draw the areas the AI watches — armoury, checkpoint, loading
   bay — once, then use them everywhere else in the product.
2. **Cameras and recorders, one roster** — Every camera and NVR shares a
   single health signal, sorted worst-first, so whatever needs attention is
   already at the top of the list.
3. **Footage ready to hand over** — Export recordings as a ZIP, an MP4 pack,
   or a manifest file when compliance or law enforcement asks — no
   screen-recording workarounds.

---

## 8. Built for the Enterprise

**Positioning:** *The governance questions, answered before they're asked.*

One compact section covering the things a security/procurement reviewer
checks for — kept short and factual rather than stretched into three thin
marketing sections.

- **Role-based access** — Owner / Admin / Member tiers, each with distinct
  permissions and its own seat pool; per-user two-factor authentication with
  admin-triggered reset
- **Accountable offboarding** — suspending or deleting a user requires a
  reason and duration, and audit history is explicitly preserved for
  compliance even after removal
- **Full audit trail** — every action across cases, events, auth, config,
  licensing, sites, cameras, rules, models, deployments, users, and
  analysis runs is logged, filterable by date/type/site, and exportable to
  CSV for a compliance handoff
- **Transparent, tiered billing** — Starter / Professional / Enterprise
  plans with clear site and camera ceilings, itemized invoices (plan +
  seat add-ons + tax), and a self-serve retry-payment flow — no opaque
  "contact sales for pricing" wall for the core plans

**Suggested visual:** Skip a screenshot here — a small icon row (Role-based
access / Audit trail / 2FA / Transparent billing) reads better than a
cropped table for this section.

---

## Notes for whoever writes final copy

- **"TRMS"** is not expanded anywhere in the codebase or docs — it's only
  ever written as "Accel TRMS." Don't invent an acronym expansion; either
  drop the letters on the public site or confirm the expansion with whoever
  owns the name before it goes live.
- The product's own vocabulary (armouries, restricted zones, checkpoints,
  chin-strap/helmet SOP checks, naval/logistics/port site names) points at a
  specific buyer: **security operations for high-security, multi-site
  logistics, defense/naval, port, and enterprise-campus environments** —
  likely APAC-based operators with regulated or asset-sensitive facilities.
  Lean into that specificity in the hero copy rather than genericizing to
  "video surveillance for everyone."
- Every bullet above is grounded in what's actually built and demoable
  today — nothing here describes a roadmap item as if it already shipped.
