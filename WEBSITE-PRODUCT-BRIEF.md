# Accel — Product Brief for Website Copy

Context document for an AI writing marketing copy. Everything here is drawn
from the shipped product (`src/pages`, `src/mocks`, `src/types`) and the
prototype set, not from a roadmap. Where a claim is aspirational or unverified
it is marked. Companion docs: [WEBSITE-MODULE-SHOWCASE.md](WEBSITE-MODULE-SHOWCASE.md)
(long-form section copy), [WEBSITE-MODULE-BENEFITS.md](WEBSITE-MODULE-BENEFITS.md)
(benefit rows), [WEBSITE-PERKS.md](WEBSITE-PERKS.md) (perks grid).

---

## 1. What Accel is, in one paragraph

Accel is an AI video surveillance platform for organizations that run cameras
across several physical sites and are accountable for what happens at them. It
connects to the cameras and NVRs already installed over standard RTSP, watches
every feed continuously with computer-vision models, and raises events that
each carry a written explanation of what the model saw. Beyond alerting, it
verifies standard operating procedures: you can score a model against recorded
footage and get a 0–100% compliance verdict with a step-by-step pass/fail log
before that model ever touches a live camera. Detections escalate into
investigations with an owner, a severity and an SLA clock, and every action is
logged for audit.

**The one-line version:** surveillance that explains what it saw, and proves
its models work before they go live.

## 2. What makes it different

Three things, in order of how hard they are to copy:

1. **A vision-language model layer, not just object detection.** Every event
   carries a narrative "VLM Reasoning" description of the scene alongside the
   confidence numbers. Competitors ship a bounding box and a class label.
2. **Run Analysis — a pre-deployment proving ground.** Upload footage, pick a
   detection model *and* a VLM, get a numeric compliance score plus a
   frame-by-frame log tied to named SOP steps. Models are scored before
   deployment, not audited after an incident.
3. **SOP verification as a chained pipeline.** Models are arranged into an
   ordered sequence (chin strap → helmet → bolt group) so one clip is checked
   against a whole procedure in order, every time.

Supporting differentiators: no-code rule configuration, per-camera deployment
health, and a dismissal taxonomy that feeds false positives back into tuning.

## 3. Who it is for

The product's own vocabulary points at a specific buyer. Site names in the
product are **Astra HQ** (corporate campus), **FedEx Changi** (logistics hub)
and **Sembawang Naval** (defense). Zones are **Armoury**, **Checkpoint**,
**Loading Bay**, **Server Room**, **Medical Bay**, **Parking**. SOP steps are
chin-strap, helmet and bolt-group checks. Detected object classes include
`person`, `weapon`, `helmet`, `chin_strap`, `bolt_group`, `vehicle`, `bag`,
`forklift`.

That reads as: **security operations at high-security, multi-site facilities —
defense and naval, ports and logistics, and enterprise campuses — with a
Singapore/APAC centre of gravity.** Pricing is quoted in SGD.

Lean into that specificity in hero copy. Genericizing to "video surveillance
for everyone" throws away the product's strongest signal.

**Buyer roles:** the security or operations lead who is accountable when
something happens on site; the operator on shift watching the wall; and, in
procurement, a reviewer checking RBAC, audit trail and 2FA.

## 4. Modules

Fourteen in the main navigation, grouped as the sidebar groups them.

| Group | Module | What it does |
|---|---|---|
| Monitor | Dashboard | Rollup of the other modules — good for hero screenshots, not its own pitch |
| Monitor | Live Monitoring | Hero / Wall / Custom view modes; org-wide saved layouts; pinned cameras; per-tile playback |
| Monitor | Recordings | Browse and replay recorded footage, export for handover |
| Monitor | Detection Feed | Live AI event feed with VLM reasoning, bulk triage, dismissed-events queue |
| Manage | Site Management | Upload a real floor plan, draw polygon zones on it |
| Manage | Cameras | Per-camera lifecycle, RTSP credentials, codec, resolution, schedule, retention, zones |
| Manage | NVR Devices | Per-channel linking, storage utilization, retention policy, footage export |
| Manage | Model Management | Chain `.onnx` models into an ordered verification sequence; auto-extract rules from a model file |
| Manage | Rules Library | Configure what counts as an incident, without code |
| Manage | Incident Cases | Open → In Review → Action Taken → Closed, with owner, severity and SLA |
| Deploy | Run Analysis | Score a model against footage before deployment |
| Deploy | Model Deployment | Guided wizard: model → site → area → camera → confidence → detection zones |
| System | User Management | Owner / Admin / User roles, seat pools, 2FA, accountable offboarding |
| System | Device Health | Cameras and NVRs in one roster, worst-health-first, aggregate health score |
| System | System Configuration | Camera defaults, recording schedules, workspace settings |
| System | Activity Logs | Full audit trail, filterable, CSV export |

Also shipped, outside the main nav: Billing / subscription, Profile, Settings,
and both cloud and on-premise onboarding flows.

**For the website:** lead with Live Monitoring, Detection Feed, Run Analysis,
Rules Library, AI Model Lifecycle (Model Management + Deployment), Incident
Cases, and Site & Device Management. Fold User Management, Billing and
Activity Logs into one "Built for the Enterprise" trust section. Leave
Recordings and Dashboard off the pitch.

## 5. Technical facts safe to state

- **Works with existing hardware.** Connects to installed cameras and NVRs
  over standard RTSP. No rip-and-replace.
- **Two deployment models.** Cloud SaaS, and an on-premise offline single-site
  install activated with a license key (first-run wizard: License → Owner →
  Site → Members).
- **Selectable VLM backend**, with honest tradeoffs shown per option:
  Qwen3-VL (256K context, built for long CCTV footage), Qwen2.5-VL (7B,
  open-source, self-hostable), Gemini 2.5 Pro (proprietary, zero hosting
  overhead), Tarsier2 (7B, purpose-built for long-video CCTV QA).
- **Model format:** `.onnx` files, uploaded with a `.json` manifest and a
  configurable batch size.
- **Deployment health states:** Healthy / Degraded / Offline / Overloaded,
  tracked per camera and rolled up per model.
- **Roles:** Owner / Admin / User, each with its own seat pool and 2FA.
- **Export formats:** ZIP archive, individual MP4 pack, or manifest-only JSON.
- **Recording types:** Continuous, Standby, Motion-Based and Training, each
  with its own schedule, resolution and frame rate.

## 6. Pricing (current, from `src/mocks/cloudPlans.ts`)

Per site, in SGD, excluding GST. Annual is roughly two months free.

| Plan | Price | For | Headline limits |
|---|---|---|---|
| Starter Cloud | Free, 14 days | Evaluation / PoC | 1 site · 1 camera · 1 seat · 30-day retention · 10 min/mo Run Analysis · view-only |
| Standard Cloud | $599/mo · $5,990/yr | A single small site | 1 site · 10 cameras · 5 seats · 30-day retention · 125 min/mo Run Analysis |
| Professional Cloud | $2,499/mo · $24,990/yr | Multi-site operations | 5 sites · 50 cameras · 15 seats · 90-day retention · 1,000 min/mo · full VLM selection · SLA + CSM |
| Enterprise | Contact us | — | Not surfaced as a card |

Starter needs no credit card and adds 14 days for referring three users. Run
Analysis minutes roll over on paid plans. Run Analysis is separately metered
with purchasable credit packs — worth saying plainly, it reads as honest next
to competitors who hide compute cost.

## 7. Naming — read before writing anything

**"TRMS" is never expanded anywhere in the codebase or docs.** It appears only
as "Accel TRMS". Either drop the letters on the public site or confirm the
expansion with whoever owns the name before it ships. Do not invent one.

The product calls itself **Accel** throughout the UI. Brand colour is the
orange gradient `#FF9A4D → #FE5C01`. The UI is dark-first.

## 8. Tone

The existing copy set the voice; match it.

- Concrete over abstract. "Find out it doesn't work in a sandbox, not in an
  incident review" beats "de-risk your AI deployment."
- Name the real thing. Armoury, chin strap, loading bay, RTSP, `.onnx`.
- Short declaratives. Lowercase energy, no exclamation marks.
- Address the accountable person, not a demo audience. The perks subhead is
  the reference: *"Built for the people who are accountable for what happens
  on site — not for a demo reel."*
- No hype words: revolutionary, seamless, cutting-edge, game-changing,
  next-generation, unlock, empower, leverage.

## 9. Recently added, not yet in the other website docs

Phase 1.3 work, built as prototypes and partly shipped. Verify status before
putting any of it on the public site.

- **Synchronised multi-camera playback** — select several cameras and scrub
  them together on one set of controls while the feed keeps running.
- **Visitor analytics on Live Monitoring** — entries, exits, a running
  inside-count, plus gender and age-group splits.
- **Zoom on any frame** — scroll wheel or `+` / `−`, with the level shown as
  a percentage; small tiles expand into a pop-up player instead.
- **Recordings by camera-day** — a card is a camera's whole day rather than
  one file.
- **Video enhancement** — non-destructive crop, brightness, sharpness and
  contrast with hold-to-compare.

## 10. Claims to avoid

Two things the current website docs promise that **are no longer in the
product**. Both were removed when the rule builder was reworked:

- ❌ **"Rule in Plain English" panel.** The live sentence that translated the
  block chain as you built it. Gone.
- ❌ **"Estimated trigger rate" 7-day preview.** The historical chart showing
  how often a rule would have fired before going live. Gone.

The rule builder today is **event-based conditions**: a rule carries a name,
description, tags and severity, plus one or more condition cards. Each
condition picks an event template (object detected, enters zone, stays in
zone, exits zone, lost in zone, object count, object absent) and sets object
classes, confidence, an optional zone, duration and count threshold. The
no-code claim still holds — describe it as building conditions, not as
snapping together WHEN/IN/FOR/THEN blocks.

Also avoid:

- Any accuracy percentage, benchmark or customer count. None exist in the
  product or docs.
- Named customers. "FedEx Changi" and "Sembawang Naval" are demo fixtures,
  not references. Do not imply they are clients.
- Certifications or compliance standards (SOC 2, ISO 27001, GDPR). Nothing in
  the codebase supports a claim here.
- Real-time alerting latency numbers. Not measured anywhere.
