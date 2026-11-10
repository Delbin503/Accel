# Training Assessment: Display items

Every item to display for the three focus use cases: **golf swing**, **gym / weightlifting** and **physio / rehab**. Industrial safety is on hold.
Based on [TRAINING-ASSESSMENT-USE-CASE-RESEARCH.md](TRAINING-ASSESSMENT-USE-CASE-RESEARCH.md). The layout follows the existing indoor-range AAR page (`/aar`).

**Terms**
- **Attempt**: one swing (golf), one rep (gym), or one rep / walking pass (physio). The equivalent of a shot in the range AAR.
- **Session**: one lesson, workout or clinic visit.

---

## Part 1 — Shared items (all three)

### 1.1 Session header
- [ ] Subject name / ID (golfer, lifter, patient)
- [ ] Coach / clinician name
- [ ] Session date, start time, duration
- [ ] Location: bay / rack / treatment room
- [ ] Assessment model name and version
- [ ] Session status: live, processing, complete, failed
- [ ] Mode switch: **Live** / **Results**
- [ ] Actions: export report, share, add note

### 1.2 Summary strip
- [ ] Overall score or headline result (format per use case, see Part 2)
- [ ] Change vs last session (up / down / same)
- [ ] Number of attempts analysed
- [ ] Number of attempts flagged for review
- [ ] 3–6 headline results (per use case)

### 1.3 Video & pose view
- [ ] Video player, one tab per camera angle
- [ ] Pose overlay: keypoints and skeleton, joints coloured green (OK) / red (fault)
- [ ] Angle labels on key joints
- [ ] Toggle: pose overlay on / off
- [ ] Playback speed (0.25× / 0.5× / 1×) and frame-by-frame step
- [ ] Jump to key frame (per use case)
- [ ] Coach drawing tools: line, angle, circle, freehand, clear
- [ ] Privacy: face blur on / off (on by default for physio)

### 1.4 Session timeline
- [ ] Every attempt as a marker on the timeline
- [ ] Marker colour by result (good / fault / flagged)
- [ ] Click a marker to open that attempt
- [ ] Phase or set boundaries shown on the timeline

### 1.5 Attempt list
- [ ] Attempt number
- [ ] Time in session
- [ ] Score / result
- [ ] Main fault (if any)
- [ ] Review status: AI only / confirmed / corrected / dismissed
- [ ] Mark as best / reference attempt
- [ ] Filter: all / faults only / flagged

### 1.6 Attempt detail
- [ ] Attempt score and grade
- [ ] Every metric for this attempt, with target range and pass / fail
- [ ] Faults found, each with the moment in the video
- [ ] AI confidence per finding (high / medium / low)
- [ ] Coach / clinician action per finding: confirm, dismiss, correct value
- [ ] Note field

### 1.7 Signal charts
- [ ] Line charts of key measures over the course of the attempt
- [ ] Phase or event markers on the charts
- [ ] Shared hover line across charts, synced with the video frame
- [ ] Target band shown behind the line

### 1.8 Fundamentals
- [ ] 4–6 fundamentals per use case (Part 2), each with:
  - [ ] Grade or value
  - [ ] Attempts that met it (e.g. 7 of 10)
  - [ ] Last session vs this session
  - [ ] What it measures (tooltip / help text)

### 1.9 Coaching / recommendations
- [ ] Top 2–3 faults that cost the most
- [ ] One drill / cue / exercise per fault
- [ ] "See attempt" link that opens the clearest example
- [ ] Coach / clinician can edit or add recommendations

### 1.10 Compare
- [ ] Two attempts side by side
- [ ] Overlay mode (one video transparent on the other)
- [ ] Sync point (key frame / phase)
- [ ] Choose what to compare: best vs worst, this vs last session, vs reference / coach model
- [ ] Metric differences listed under the videos

### 1.11 Progress / history
- [ ] Score trend across sessions (chart)
- [ ] Trend per key metric
- [ ] Session list with date, score, attempts, main fault
- [ ] Goal line (if a goal is set)

### 1.12 Setup & system status
- [ ] Camera status per angle: online / offline
- [ ] Camera check vs model needs: fps, resolution, angle; pass / warn / fail
- [ ] Extra hardware status (launch monitor, bar sensor, depth camera)
- [ ] Assessment area set: bay / rack / walkway
- [ ] Analysis progress while processing

### 1.13 Page states
- [ ] Loading (skeleton)
- [ ] Empty: no sessions yet
- [ ] No results: filters match nothing
- [ ] Error with retry
- [ ] Processing: analysis still running
- [ ] Partial: some attempts could not be analysed (person not visible, camera dropped)

---

## Part 2 — Use case items

### 2A. Golf swing

**Key frames (jump to)**
- [ ] Address
- [ ] Takeaway
- [ ] Top of backswing
- [ ] Impact
- [ ] Finish

**Summary strip**
- [ ] Swing score (/100) and grade
- [ ] Swings analysed
- [ ] Consistency score (how similar swings are)
- [ ] Tempo ratio (backswing : downswing, e.g. 3 : 1)
- [ ] Best swing number
- [ ] Ball / club data summary, if a launch monitor is connected (avg club speed, avg carry)

**Swing metrics (per swing)**
- [ ] Chest turn at top (°)
- [ ] Pelvis turn at top (°)
- [ ] X-factor (chest minus pelvis turn, °)
- [ ] X-factor stretch (max gap early in downswing, °)
- [ ] Pelvis sway (cm)
- [ ] Chest sway (cm)
- [ ] Sway gap (pelvis vs chest)
- [ ] Pelvis lift / drop (cm)
- [ ] Spine angle at address and at impact (°), with change
- [ ] Lead arm angle at top (°)
- [ ] Lead wrist angle at top and at impact (°)
- [ ] Shaft angle at top (°)
- [ ] Hand height at top
- [ ] Head movement (cm)
- [ ] Weight shift (rear → lead, %)
- [ ] Backswing time, downswing time (s)
- [ ] Hand speed / club speed (estimated)

**Swing sequence**
- [ ] Order of peak rotation speed: pelvis → chest → arms → club
- [ ] Timing gap between each peak (ms)
- [ ] In sequence / out of sequence flag

**Ball & club data** (only with a launch monitor)
- [ ] Club speed
- [ ] Ball speed
- [ ] Smash factor
- [ ] Launch angle
- [ ] Spin rate
- [ ] Carry distance
- [ ] Club path (in-to-out / out-to-in, °)
- [ ] Face angle (open / closed, °)
- [ ] Shot shape (draw / fade / straight)
- [ ] Ball flight trace (or from video with ball tracing)

**Signal charts**
- [ ] Pelvis and chest rotation over the swing
- [ ] Rotation speed per body part (sequence chart)
- [ ] Sway and lift over the swing
- [ ] Head movement over the swing

**Fundamentals**
- [ ] Setup / posture
- [ ] Turn
- [ ] Sway control
- [ ] Lift / posture hold
- [ ] Sequence
- [ ] Tempo

**Common faults to name**
- [ ] Early extension (hips move toward the ball)
- [ ] Loss of posture
- [ ] Reverse pivot
- [ ] Over-the-top
- [ ] Sway off the ball
- [ ] Casting / early release
- [ ] Out-of-sequence downswing

**Golf-specific extras**
- [ ] Bay number and club used per swing (driver, 7-iron, …)
- [ ] Coach reference swing for comparison
- [ ] Session filter by club

### 2B. Gym / weightlifting

**Structure**
- [ ] Session → exercise → set → rep
- [ ] Exercise name (squat, deadlift, bench, …)
- [ ] Load per set (kg)
- [ ] Prescribed reps vs counted reps

**Key frames (jump to)**
- [ ] Start position
- [ ] Bottom of rep (deepest point)
- [ ] Sticking point (slowest point)
- [ ] Lockout / finish

**Summary strip**
- [ ] Session form score (/100) and grade
- [ ] Total sets, total reps
- [ ] Clean-rep ratio (reps without a fault, %)
- [ ] Depth hit rate (%)
- [ ] Average bar speed at main working load
- [ ] Biggest speed loss in a set (%)

**Rep metrics (per rep)**
- [ ] Depth reached: hip below knee yes / no, plus knee angle at bottom (°)
- [ ] Hip angle at bottom (°)
- [ ] Knee tracking / valgus (knees caving in, °)
- [ ] Torso lean (°)
- [ ] Back angle / spine neutral flag
- [ ] Hip–knee timing (hips shoot up first flag)
- [ ] Heel lift flag
- [ ] Left–right shift / asymmetry
- [ ] Bar path trace (side view)
- [ ] Bar path drift from vertical (cm)
- [ ] Mean bar speed (m/s)
- [ ] Peak bar speed (m/s)
- [ ] Range of motion (cm)
- [ ] Rep tempo: down / pause / up (s)

**Set metrics (per set)**
- [ ] Set form score
- [ ] Reps counted
- [ ] Speed loss first → last rep (%)
- [ ] Rep where form broke down
- [ ] Faults in this set

**Signal charts**
- [ ] Bar speed per rep across the set (bar chart)
- [ ] Knee and hip angle through the rep
- [ ] Bar height over time
- [ ] Torso angle through the rep

**Fundamentals**
- [ ] Depth
- [ ] Knee tracking
- [ ] Torso position
- [ ] Bar path
- [ ] Tempo / control
- [ ] Consistency across the set

**Common faults to name**
- [ ] Knee valgus
- [ ] Not reaching depth
- [ ] Excessive forward lean
- [ ] Butt wink / lower back rounding
- [ ] Hips rise first
- [ ] Heels lift
- [ ] Bar drifts forward
- [ ] Shift to one side

**Gym-specific extras**
- [ ] Rack / platform number
- [ ] Lifter assignment when several racks are in one camera view
- [ ] Training block / programme week
- [ ] Bar speed at the same load over time
- [ ] CSV export

### 2C. Physio / rehab

**Structure**
- [ ] Patient → episode of care → visit → test / exercise → rep
- [ ] Diagnosis / affected side (entered by clinician)
- [ ] Visit number in episode

**Summary strip** (no letter grades)
- [ ] Progress toward goal (%) for main measure
- [ ] Main measure: baseline → today → goal
- [ ] Change since last visit
- [ ] Tests / exercises done this visit
- [ ] Reps done vs prescribed
- [ ] Items flagged for clinician review

**Range of motion (per joint)**
- [ ] Joint and movement (e.g. knee flexion, shoulder abduction)
- [ ] Left value (°)
- [ ] Right value (°)
- [ ] Difference left vs right (° and %)
- [ ] Normal range for reference
- [ ] Baseline value and goal value
- [ ] Active vs assisted (clinician marks)

**Gait (walking pass)**
- [ ] Walking speed (m/s)
- [ ] Cadence (steps / min)
- [ ] Step length, left and right (cm)
- [ ] Stride length (cm)
- [ ] Step time, left and right (s)
- [ ] Stance time, left and right (s or % of cycle)
- [ ] Swing time, left and right
- [ ] Double-support time
- [ ] Symmetry index (%)
- [ ] Walkway length used
- [ ] Accuracy note for timing measures (lower confidence than speed / step length)

**Standard tests** (templates)
- [ ] Timed Up and Go (s)
- [ ] 30-second sit-to-stand (count)
- [ ] 5-times sit-to-stand (s)
- [ ] Single-leg balance (s, left and right)
- [ ] 10-metre walk test (s, m/s)
- [ ] Norm or cut-off for each, if the clinic provides them

**Movement quality (per rep)**
- [ ] Compensations: trunk lean, hip hike, shoulder shrug, knee valgus
- [ ] Movement control / smoothness
- [ ] Rep completed through full range yes / no
- [ ] Pain-limited rep (clinician marks)
- [ ] Patient-reported pain score (0–10, entered)

**Signal charts**
- [ ] Joint angle through the movement, left and right overlaid
- [ ] ROM trend across visits
- [ ] Gait speed trend across visits
- [ ] Step timing left vs right

**Fundamentals** (shown as values, not grades)
- [ ] Range
- [ ] Symmetry
- [ ] Control
- [ ] Compensation
- [ ] Function (standard test results)

**Physio-specific extras**
- [ ] Clinician notes per visit
- [ ] Home exercise programme: exercises, sets, reps
- [ ] Adherence (if home sessions are recorded)
- [ ] Visit report export (PDF)
- [ ] Consent status on file
- [ ] Who viewed this record (access log)
- [ ] Video retention date

---

## Part 3 — List & management screens (all three)

**Subjects list** (golfers / lifters / patients)
- [ ] Name / ID, group or team, coach / clinician
- [ ] Last session date
- [ ] Latest score or main measure
- [ ] Trend arrow
- [ ] Sessions count
- [ ] Search, filter by group / coach

**Sessions list**
- [ ] Date, subject, location, assessment model
- [ ] Status: live / processing / complete / failed
- [ ] Score / main result
- [ ] Attempts count, flagged count
- [ ] Filter: date, subject, model, status

**Group view** (several people at once)
- [ ] Participants in session
- [ ] Score per participant
- [ ] Group average
- [ ] Who needs review
- [ ] Most common fault in the group
- [ ] Not for physio (no patient rankings)
