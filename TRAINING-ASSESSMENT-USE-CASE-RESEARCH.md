# Training Assessment: What to show for each use case

**Scope:** Research for the four focus use cases in [TRAINING-ASSESSMENT-DESIGN-BRIEF.md](TRAINING-ASSESSMENT-DESIGN-BRIEF.md): golf swing, industrial workplace safety, gym/weightlifting technique, and physiotherapy/rehabilitation.
**Question:** What should Accel display and include for each one?
**Date:** 2026-11-07

## Summary

- **Three of the four fit the existing AAR layout.** Golf, gym and physio are all about one person doing a repeated movement and improving across sessions, which is what the indoor-range AAR (`/aar`) already shows for shooting. The "shot" just becomes a swing, a rep or a walk. Reuse that layout, with its summary strip, pose view, per-attempt review, signals, graded fundamentals and coaching.
- **Industrial safety does not fit that layout.** It is continuous and site-wide, and workers are often not named. Buyers care about risk by task, zone and shift, not one person's grade. It belongs closer to **Detection Feed + Rule Library**, with an ergonomics risk report on top, and not in a per-person AAR.
- **Each use case needs its own setup check.** Golf needs high-frame-rate cameras at fixed angles. Physio gait timing is unreliable on low-frame-rate clinic cameras. Industrial can usually run on the CCTV already installed. The deployment step should check each camera against the model's requirements, as the Re-ID calibration drawer does today.
- **Treat AI scores as screening, not final verdicts.** Published studies show AI is good at confirming correct squat form but weaker at catching incorrect form. AI NIOSH lifting results also run optimistic (they understate risk). The UI should show confidence and let a coach, ergonomist or therapist confirm or correct.

---

## 1. Common layout (reuse from AAR)

The AAR page already has the structure. This table maps each part of it to the four use cases.

| AAR part today | Golf swing | Gym / weightlifting | Physio / rehab | Industrial safety |
|---|---|---|---|---|
| **Unit being reviewed** (shot) | Swing | Rep, grouped into sets | Exercise rep, or one walking pass | Lift / task event |
| **Summary strip** (grade, score, vs last session) | Swing score, consistency, vs last session | Form score per set, reps, depth hit rate | Progress vs baseline and vs goal (no letter grade) | Site risk level, high-risk events, trend vs last period |
| **Posture view** (pose frame, red/green joints) | Address / top / impact frames with angles | Bottom-of-rep frame with knee, hip, torso angles | Joint angles at end of range, left vs right | Pose frame at worst posture, colour-coded by body part |
| **Target Board** (outcome) | Ball flight / launch data (needs extra hardware, see §2) | Bar path and bar speed | ROM in degrees, gait speed, test times | Risk score (REBA / RULA / NIOSH lifting index) |
| **Shot Review** (per attempt) | Per swing | Per rep | Per rep / per gait cycle | Per event |
| **Shot Signals** (traces around the event) | Pelvis / chest rotation over time, swing sequence | Bar speed per rep, joint angle through the rep | Joint angle through the movement, step timing | Joint angles and time at risk during the task |
| **Fundamentals** (graded A–F) | Turn, sway, lift, sequence, tempo | Depth, knee tracking, torso lean, bar path, tempo | Range, symmetry, control, compensation (shown in clinical units) | Back, neck, shoulders, wrists, lift load |
| **Coaching** (faults + drills) | Top faults + drills | Top faults + cues | Home exercise programme adjustments | Corrective actions (job redesign, training) |
| **Trend / standing** | Across lessons | Across sessions / training block | Across visits, to discharge goal | Across weeks, by zone / task / shift |
| **Live mode** | Optional (between swings) | Useful (cue on next rep) | Optional | Core: live alerts into Detection Feed |

---

## 2. Use case details

### A. Golf swing performance

**Who uses it:** golf academies, coaches, driving ranges, indoor bays.
**What competitors show:** Sportsbox AI groups its 3D swing metrics into *turn* (chest turn, pelvis turn, X-factor, the gap between chest and pelvis rotation), *sway*, *lift*, plus lead wrist angle, shaft angle and kinematic sequence. V1 Golf's core coach tools are two swings side by side, synced at address, top or impact, an overlay mode, and drawing tools for lines and angles. Coaching software often connects to launch monitors (Trackman, FlightScope) to pair the swing with ball data.

**Display on Accel**
- **Swing list per session**, each auto-split into phases: address → takeaway → top → impact → finish (timestamps on the timeline).
- **Key frames** at address / top / impact with angle overlays.
- **Metrics:** chest turn, pelvis turn, X-factor, sway, lift, spine angle, lead wrist, tempo (backswing : downswing ratio).
- **Kinematic sequence chart**: order and timing of peak rotation speed, pelvis → chest → arms → club. The right order is a fundamental.
- **Compare view**: this swing vs best swing, vs last lesson, or vs a coach reference, synced at a phase, side by side or overlaid. **This is the feature golf coaches use most.**
- **Drawing tools** (line, angle, circle) on the frame for the coach.
- **Consistency**: spread of each metric across the session's swings.
- **Coaching**: top 2 faults with drills, like AAR's Coaching panel.

**Setup / hardware**
- Two cameras: face-on and down-the-line, at high frame rate. Standard CCTV is unlikely to be enough.
- Optional **launch monitor** integration for ball speed, club path and face angle, which act as the "outcome" (the Target Board equivalent). Without it, Accel can only judge technique, not results.
- One player per bay. Multi-person here means multiple bays at once, not multiple people per camera.

### B. Industrial workplace safety

**Who uses it:** manufacturing, warehouses, logistics, EHS managers, ergonomists.
**What competitors show:** Intenseye and Protex AI run on existing CCTV and split into modules: PPE, ergonomics, area / zone breaches, vehicle–pedestrian, housekeeping, behaviour. Protex has a rule builder to configure what counts as an event, and processes video on the edge for privacy. Ergonomics tools (TuMeke, Human Focus, Intenseye) score video with standard methods: **REBA** (whole body), **RULA** (upper limbs) and the **NIOSH lifting equation** (lifting index; above 1.0 means the load is over the recommended limit). They show a colour-coded risk overlay on the video and joint-angle charts.

**Display on Accel**
- **Risk overview** (site level): risk events by zone, task and shift; trend over weeks; top 5 riskiest tasks.
- **Live events** go into the existing **Detection Feed** (unsafe lift, PPE missing, zone breach), not a new feed.
- **Task assessment report** (per job or task, not per person):
  - REBA / RULA score and band (negligible → very high).
  - NIOSH lifting index, with the inputs (load, distances, frequency) shown and editable.
  - Body-part breakdown: back, neck, shoulders, wrists, knees.
  - Time at high risk during the task, and how often per shift.
  - Video clip of the worst moment with the pose overlay.
  - Recommended corrective action.
- **Before / after** comparison for a task after a fix (proves ROI).
- Worker identity **off by default**: anonymous tracking IDs and face blur. Named results only where the site has consent.

**Setup / hardware**
- Usually existing CCTV. Extra cameras may be needed where the posture view is blocked (shelving, side angles).
- Assessment areas drawn on the camera view, the same pattern as the Re-ID zones.
- Thresholds and event types configured as rules, reusing the **Rule Library** pattern.

**Caution:** a 2025 study of a commercial AI tool found its NIOSH estimates understated risk (recommended weight limit too high, lifting index too low), mainly from distance errors. Show NIOSH as a screening score and let an ergonomist correct the inputs.

### C. Gym / weightlifting technique assessment

**Who uses it:** gyms, PT studios, strength coaches, sports performance centres.
**What competitors show:** form apps flag knee valgus, insufficient depth and forward lean, and give a per-set form score (0–100 or a grade) with cues such as "push your knees out". Velocity-based training apps (Metric VBT, Qwik VBT, WL Analysis) track bar path, mean and peak bar speed, range of motion, rep tempo, and speed loss across a set as a fatigue signal. Bar path is coloured by speed, with side-by-side compare and CSV export.

**Display on Accel**
- **Session → exercise → set → rep** hierarchy. Reps are counted automatically.
- **Per rep:** depth reached (hip below knee, yes/no plus angle), knee tracking / valgus, torso lean, hip–knee timing, bar path trace, bar speed.
- **Per set:** form score, reps counted vs prescribed, speed loss through the set, the rep where form broke down.
- **Fault list** with cues, linked to the rep clip (like AAR's "See shot" links).
- **Compare**: best rep vs worst rep, this session vs last.
- **Trend**: form score and bar speed at a given load over the training block.
- **Coach confirm / dismiss** on flagged faults, because AI misses incorrect form more often than it misses correct form.

**Setup / hardware**
- Fixed cameras per platform or rack, side view for depth and bar path, front view for knee valgus.
- Optional barbell sensor for exact speed.
- Multi-person: several racks in one view, each assigned to a lifter.

### D. Physiotherapy / rehabilitation

**Who uses it:** physio clinics, rehab centres, hospitals. The user is the clinician, not the patient.
**What competitors show:** Kemtai's clinician app assigns protocols and tracks range of motion, adherence, reps, duration and performance. EuMotus reports range of motion, stability, symmetry and likely muscle imbalances. Gait tools report cadence, step length, stance/swing ratio, gait speed and left–right symmetry.

**Display on Accel**
- **Patient view** (not a leaderboard): baseline → current → goal for each measure.
- **ROM in degrees** per joint, left vs right, with a progress chart across visits.
- **Gait:** walking speed, cadence, step length, stance / swing time, symmetry.
- **Standard tests** as templates, e.g. Timed Up and Go, 30-second sit-to-stand, single-leg balance. Show time / count with norms where the clinic provides them.
- **Movement quality:** compensations (trunk lean, hip hike), control, pain-limited reps if the clinician marks them.
- **Clinician notes** and an exportable visit report.
- **No letter grades or rankings.** Use clinical units and progress toward the goal.

**Setup / hardware**
- Fixed camera(s) in the treatment or gait area, with a known walkway length for gait speed.
- Higher frame rate matters: studies found low-frame-rate clinic cameras are not accurate enough to track gait timing changes reliably.
- Optional depth camera for better 3D joint angles.

**Caution:**
- Patient video is health data, so face blur, consent capture, access by clinician, retention limits and audit logs are required.
- Markerless gait tools agree well with lab systems on speed and step length, but less well on stance and double-support time.
- If results are used to make clinical decisions, this may count as a medical device. Check the regulatory position before marketing.

---

## 3. What Accel needs to add (shared across all four)

| Area | What to add | Builds on |
|---|---|---|
| Model categories | Golf Swing, Strength Technique, Rehab Movement, Ergonomics | Category field in Model Management (Re-ID, PPE, …) |
| Camera requirement check | Each assessment model states minimum fps, resolution and angle (face-on, side). Deployment flags cameras that fail. | Re-ID calibration drawer |
| Assessment areas | Bay / rack / walkway / work zone drawn on the camera view | Re-ID zone markers |
| Extra hardware | Launch monitor (golf), bar sensor (gym), depth camera (physio) | Hardware Management |
| Subjects | Named participants (golf, gym, physio) or anonymous IDs (industrial) | Participant setup in the brief |
| Report layout | One report shell, panels switched on per use case (§1 table) | AAR page |
| Compare view | Attempt vs attempt, session vs session, vs reference; synced at a phase | New, used by all four |
| Human review | Confirm / dismiss / correct AI findings, with confidence shown | New, needed by all four |
| Privacy | Face blur, consent, retention, role-based access | Needed most by physio and industrial |
| Live events | Industrial (and optionally gym) push events to Detection Feed | Detection Feed, Rule Library |

## 4. Suggested order

1. **Gym / weightlifting.** Closest to the AAR model (repeated attempts, clear faults), standard movements, cameras are simple. Good first proof that the layout generalises.
2. **Golf.** Same layout plus Compare view and phase detection, but needs the high-fps camera and launch monitor setup.
3. **Industrial safety.** Strongest fit with existing CCTV and the biggest buyers, but a different layout (site risk, Detection Feed, rules). Worth starting design early in parallel.
4. **Physio.** Most demanding: accuracy, privacy and possible medical-device rules. Design last.

## 5. Open questions

1. Will golf customers bring their own launch monitor, or should Accel judge technique only at first?
2. Industrial: do customers want named worker results, or site / task results only?
3. Physio: is the clinic using results to make clinical decisions? This affects regulatory scope.
4. Gym: one camera per rack, or wide cameras covering several racks?
5. Should Live mode exist for all four, or only industrial and gym?

---

## Sources

- Sportsbox AI swing metrics: [Golf Digest](https://www.golfdigest.com/story/useful-golf-swingfacts-sportsbox-ai-graph), [Sportsbox course](https://sportsbox-ai.teachable.com/courses/sportsbox-3dgolf-level-2-certification/lectures/51320649), [Golf.com](https://golf.com/instruction/sportsbox-ai-exposed-flaws-golf-swing-play-smart/)
- Kinematic sequence: [Noraxon](https://www.noraxon.com/?p=27823), [K-Motion](https://www.k-motion.com/?p=17142)
- V1 Golf compare and drawing tools: [V1 side-by-side](https://swing-analysis.v1sports.com/swing-analysis/side-by-side-comparison), [V1 overview](https://swing-analysis.v1sports.com/)
- Launch monitor sync in coaching software: [FitGap](https://us.fitgap.com/search/golf-software/video)
- Ergonomics AI (REBA / RULA / NIOSH): [Intenseye Ergonomics](https://www.intenseye.com/products/ergonomics), [Human Focus](https://humanfocus.co.uk/?p=116025), [TuMeke study](https://pmc.ncbi.nlm.nih.gov/articles/PMC12063896), [ErgoPlus](https://ergo-plus.com/reba-software/)
- AI NIOSH accuracy: [Virginia Tech / HFES 2025](https://vtechworks.lib.vt.edu/items/57acb2c0-2ee2-43fc-90ec-bd2f6a7b11d6), [iFactory lifting index guide](https://ifactoryapp.com/ehs-management/ergonomics-risk-assessment-ai-video-lift-reach)
- CCTV safety platforms: [Protex AI PPE](https://protex.ai/ppe-detection), [Voxel review of Intenseye](https://www.voxelai.com/industry-insights/intenseye-review)
- Weightlifting / VBT apps: [Qwik VBT](https://apps.apple.com/us/app/id1660094818), [Gymbot Vision](https://apps.apple.com/app/id6766827120), [WL Analysis](https://apps.apple.com/gb/app/wl-analysis/id1541855037), [Metric VBT](https://metric.coach/old-home)
- Form feedback apps: [FormLab](https://apps.apple.com/us/app/formlab/id6758761079), [FormCoach](https://hunted.space/dashboard/formcoach-ai-form-coach), [Squat Checker](https://appshunter.io/ios/app/squat-checker-ai-form-coach/id6761863312), [FORMFIT](https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/asda/formfit)
- AI squat form accuracy: [Comparative Effectiveness Research study](https://becarispublishing.com/doi/10.2217/cer-2021-0253)
- Physio / rehab: [Kemtai (IntuitionLabs)](https://www.intuitionlabs.ai/software/physical-occupational-therapy/rom-and-goniometry-tracking/kemtai), [EuMotus FAQ](https://www.eumotus.com/faq)
- Markerless gait accuracy: [Cotton et al., arXiv](https://arxiv.org/pdf/2203.09371.pdf), [University of Miami validity study](https://scholarship.miami.edu/esploro/outputs/journalArticle/Concurrent-validity-of-artificial-intelligence-based-markerless/991031757894502976), [Dunn et al., frame interpolation](https://shura.shu.ac.uk/31834/), [PMC review](https://pmc.ncbi.nlm.nih.gov/articles/PMC9224754)

Vendor feature lists come mostly from vendor pages and app listings and were not independently checked.
