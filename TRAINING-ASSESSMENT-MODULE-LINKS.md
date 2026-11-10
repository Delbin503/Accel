# Training Assessment: Links to Existing Accel Modules

**Purpose:** for each step of the Training Assessment workflow, which existing Accel module it should reuse or link to, and what's new.
**Checked:** 8 Nov 2026, against `src/pages/*` and `prototypes/PRD_*` in this repo.
**Workflow:** [Training Assessment Workflows](https://claude.ai/artifact/8KWERwzrE8fcugXWTbAoe5)

---

## Summary

Most of the workflow can reuse what Accel already has. The four strongest links:

1. **Stage 2 Deploy = Model Deployment.** Its wizard already runs *model → site → areas → cameras*, with deployment history, health KPIs, a per-model camera drawer and deploy-error toasts. Training Assessment should deploy through it, not build a second deploy flow.
2. **1.2 CV models = Model Management.** Upload (`.onnx` + `.json` manifest + batch size) and model versions already live there.
3. **1.7 Test & save and recorded sessions = Run Analysis.** It already does *pick model → add footage → run → pass/fail verdict → history*.
4. **1.5 Faults and thresholds = Rule Library.** Its WHEN / conditions builder and severity can express "knee cave when knee angle < X", so faults become rules instead of a new editor.

Things that don't exist yet and must be built: **Participant Management**, **consent capture**, **reusable hardware profiles**, **sessions and results pages** (the AAR and golf prototypes are the starting point), and **drill / cue libraries**.

---

## Step by step

### Stage 1 · Create & configure model

| Step | Reuse / link | How |
|---|---|---|
| 1.1 Basic information | **Model Management** › Create Model modal (`src/pages/model-management`) | Same name + description pattern. Training Assessment adds category, activity and version. |
| 1.2 AI configuration | **Model Management** (Add Step: model title, `.onnx`, manifest, batch size) · **System Config › Detection Engine** (confidence thresholds, models) | "+ Upload CV model" opens the existing Add Step form. Pose confidence defaults come from Detection Engine. |
| 1.3 Hardware & environment | **Cameras** `/site/cameras` (camera table, NVR channel linking, **detection-zone editor**) · **NVR Devices** `/site/nvr` · **System Config › Camera Defaults** (frame rate) · **Re-ID Calibration** (Phase 1.3, `reid/ReidCalibration.tsx`, "Calibrate All Cameras") · **Device Health** | Test cameras are picked from Cameras. "Areas" reuses the detection-zone editor. "Calibrate" and the coverage check reuse the Re-ID calibration flow. Device Health supplies live fps and camera status. |
| 1.4 Participant configuration | **Re-ID** (Phase 1.3: tracking, re-identification) · **User Management** + **System Config › User Access** (roles, permission matrix) · **Activity Logs** · **System Config › Security** | Tracking and temporary IDs build on Re-ID. "Who can view" uses roles; today they are Owner / Admin / Security Operations, so Coach, PT and Clinician roles are needed. The access log is Activity Logs. **Participant Management itself is new.** |
| 1.5 Assessment criteria | **Rule Library** (rule builder, WHEN / conditions, severity, templates) · **Model Management** "Extract from Model" → rules · **Detection Engine** thresholds | Faults and thresholds become rules. "Send to review below X% confidence" mirrors the Detection Engine confidence setting. Scoring weights and grade bands are new. |
| 1.6 Reporting configuration | **Email Templates** (transactional emails + document exports, Accel email design) · **System Config › Notifications** | Report PDFs and "send to golfer / patient / referrer" use the export and email templates. Delivery channels come from Notifications. |
| 1.7 Test & save | **Run Analysis** (model selector, footage upload, run, pass/fail verdict, history) | The test analysis is a Run Analysis run on the test cameras' footage. |
| 1.9 Save model | **Model Management** models list | The Assessment Models list follows the same list and detail pattern. The brief gives it its own nav item. |

### Stage 2 · Deploy & activate model

| Step | Reuse / link | How |
|---|---|---|
| 2.1–2.5 whole stage | **Model Deployment** (deploy wizard *model → site → areas → cameras*, deployed-models history, health / status KPIs, camera drawer, deploy-error toast) | Deploy assessment models through this wizard. Add the hardware-profile check as the verify step. |
| 2.2 Select deployment location | **Site Management** `/site/overview` (sites, Add Site wizard, floor plan and area drawing) · **Zones** `/site/zones` (under construction) | Site → Area → Locations (bays / racks / rooms) map onto sites and zones. The empty Zones page is a natural home for bays, racks and rooms. |
| 2.3 Assign camera group | **Cameras** · **Model Deployment** camera step | Pick the site's real cameras, mapped to the positions from 1.3. |
| 2.4 Verify deployment | **Device Health** (camera status, fps) · **Re-ID Calibration** | Check each camera against the hardware profile, then calibrate. |
| 2.5 Activate | **System Config › Camera Defaults › Recording Schedule** (Phase 1.3) · Model Deployment status | The optional schedule reuses the weekly recording schedule. Active / Inactive reuse deployment status. |

### Stage 3A · Run assessment session

| Step | Reuse / link | How |
|---|---|---|
| 3A.1–3A.2 Create, name & time range | **Recordings** (date range, camera-day list) | Sessions point at time ranges in existing recordings. |
| 3A.4 Live or recorded? | **Live Monitoring** + **Synchronised Playback** (Phase 1.3) · **Recordings** · **System Config › NVR Defaults** (max length per video) | Live sessions use the live view. Recorded sessions pick recordings. NVR max length affects how long footage is split. |
| 3A.5 Run AI analysis | **Run Analysis** | Recorded sessions run as analysis jobs. Live sessions run on the deployment. |
| 3A.6 Monitor progress | **Live Monitoring** · **Detection Feed** (live stream, date-grouped) | Progress and tracking warnings can use the feed pattern. |
| 3A.8 Tracking or unknown people | **Re-ID Tracking** (Phase 1.3, `reid/ReidTracking.tsx`) | Reassigning tracks and merging temporary IDs builds on Re-ID tracks. |
| 3A.9 Complete session | **Run Analysis › History** | Completed sessions appear like analysis history records. |

### Stage 3B · Review results

| Step | Reuse / link | How |
|---|---|---|
| 3B.1 Group overview | **Customizable Dashboard** (Phase 1.3) · shared `KpiCard`, `DataTable`, charts | The Assessment Dashboard and group results reuse dashboard panels. |
| 3B.2 Individual breakdown | **AAR** `/aar` and **Swing Assessment** `/golf` (Phase 1.3) · **Synchronised Playback** · **Video Enhancement** · **Recordings** player | The AAR layout is the base. Synchronised Playback fits face-on + down-the-line side by side. Video Enhancement for unclear clips. |
| Confirm / dismiss findings | **Detection Feed** (dismiss + bulk restore) · **Incident Cases** (assignee, status) | Same dismiss / restore pattern. "Needs review" can use Incident Cases' assignee pattern. |
| 3B.3 Generate reports | **Email Templates** (document exports) · Recordings / NVR export flows | Reuse export and email designs. |
| 3B.4 Historical performance | Dashboard charts (`components/charts`) | Trend charts reuse the chart components. |

### Across all steps

| Need | Module |
|---|---|
| Audit trail (who changed a model, who viewed a patient's results, consent changes) | **Activity Logs** |
| New roles: Coach, PT, Clinician, with site scoping | **User Management** + **System Config › User Access** (and "Manage Site") |
| Booking, membership and clinic-records sync; launch monitors | **System Config › Integrations** (currently "on the way") |
| "Report ready" and "needs review" alerts | **System Config › Notifications** |

---

## New, no existing module

| What | Notes |
|---|---|
| **Participant Management** | People, groups, required profile fields, import. Linked from 1.4 and 3A.3. |
| **Consent capture** | Needed before recording (physio locked on). Logged in Activity Logs. |
| **Hardware profiles** | A reusable "2 cameras, 240 fps, these positions" object. Could sit in System Config › Camera Defaults. |
| **Assessment sessions and results pages** | Start from the AAR and Swing Assessment prototypes. |
| **Drill / cue / home-programme libraries** | Recommendations per fault. Rule Library templates are the closest pattern. |
| **Scoring and grading** | Weights, grade bands, progress-to-goal. Next to Rule Library rules. |
