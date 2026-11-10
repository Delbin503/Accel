# Training Assessment: Do the AI Models Exist?

**Question:** Do analysis models already exist for golf, gym and physio, and what does Accel need to set them up?
**Researched:** 8 Nov 2026. Industrial safety is on hold, so it isn't covered.
**Related:** `TRAINING-ASSESSMENT-DESIGN-BRIEF.md`, `TRAINING-ASSESSMENT-USE-CASE-RESEARCH.md`, `TRAINING-ASSESSMENT-DISPLAY-ITEMS.md`

---

## Short answer

**No off-the-shelf model does the whole assessment for any of the three use cases.** But most of the pieces exist, and the hard part (body pose) is solved well enough to build on.

Each assessment model is made of three layers:

| Layer | What it does | Exists? |
|---|---|---|
| **1. Person layer** | Detect, track and re-identify people | **Yes.** Accel already has detection, tracking and Re-ID. Reuse it. |
| **2. Pose layer** | Find body joints in each frame (2D), and in 3D where needed | **Yes.** Mature open models exist, some free for commercial use. |
| **3. Assessment layer** | Turn joints into events, metrics, faults and scores (swing moments, reps, angles, test times) | **Partly.** Mostly rules on top of pose, plus a few small task models. Research versions exist but are almost all **non-commercial only**, so Accel has to build or retrain its own. |

Layer 3 is mostly **configurable rules** (angles, thresholds, weights), which matches the brief's "configure once" idea. The setup wizard's *Assessment criteria* step is where those rules are set. Only a few parts need trained models: swing event detection, barbell detection, and possibly fault classification.

**Difficulty:** gym is easiest, golf is medium, and physio is hardest (accuracy proof and medical rules).

---

## 1. Shared building blocks

### Pose models: which ones Accel can use

| Model | Licence | Fit for Accel | Notes |
|---|---|---|---|
| **RTMPose / RTMW** (OpenMMLab MMPose, or `rtmlib`) | Apache 2.0 for code and weights | **Recommended** | Real-time and multi-person (paired with a person detector). RTMPose-m: 75.8% AP on COCO, 430+ FPS on a GTX 1660 Ti per person crop. RTMW adds hands, feet and face. Check the terms of the training datasets (COCO, AI Challenger) before shipping. |
| **YOLO11-pose** (Ultralytics) | AGPL-3.0 | Only with a paid Enterprise licence | AGPL would force Accel to open-source its product. Ultralytics sells an Enterprise licence for commercial use. |
| **MediaPipe Pose Landmarker** (Google) | Apache 2.0 code; model-bundle terms not confirmed | Prototyping only | Defaults to one person. Accuracy against goniometers is mixed (see physio). Many fitness SDKs build on it. |
| **OpenPose** (CMU) | Non-commercial; paid commercial licence reportedly excludes sports | **Avoid** | A reported ~$25k/year licence that can't be used for sports. |
| **SMPL-based 3D body models** (VIBE, SMPL-X and others) | Non-commercial; paid licence from Meshcapade | Avoid unless licensed | Commercial tiers start around €2,000/year. Keypoint-only 3D avoids this. |

**3D pose:** there are two ways to get it:
- **Two synced cameras plus triangulation.** No extra model and no SMPL licence. This is how OpenCap works. **Recommended for golf and physio**, which already plan two views.
- **Single-camera "lifting" models** (MotionBERT, MeTRAbs and others). Cheaper on hardware, less accurate. Check each licence before use.

### Compute
- RTMPose deploys to NVIDIA Jetson / TensorRT through MMDeploy. Published Jetson figures are for one cropped person and conflict with each other, so **benchmark on Accel's own box**. Measure detector + pose for the realistic number of people per camera, at the target fps.
- High frame rate costs compute. A golf bay at 240 fps with two cameras uses about 8× the compute of one 60 fps camera. Plan GPU capacity per bay, rack and room.

### Data: the main gap
All the public task datasets found are **non-commercial**: GolfDB, Fitness-AQA (by request), FLEX (CC BY-NC-SA). Accel can read them and benchmark against them, but **must record and label its own footage** to train models it sells. That needs:
- consent from the people filmed
- a labelling tool (swing moments, rep boundaries, faults, barbell boxes)
- expert labellers: coaches, PTs, clinicians

---

## 2. Golf swing

### What the model has to do
3D pose at 120–240 fps · find the five swing moments · track club (and ball) · compute turn, X-factor, sway, spine angle, sequence, tempo · grade against the coach reference · pair with launch-monitor data.

| Piece | Exists? | Detail |
|---|---|---|
| Pose (3D) | **Yes** | RTMPose plus two-camera triangulation. |
| Swing moments (address → finish) | **Research only** | **GolfDB** (1,400 labelled swings) and **SwingNet**: 76.1% accuracy on 8 events, 91.8% on 6 of 8. A 2023 transformer reaches 83.4%. Dataset and code are **CC BY-NC (non-commercial)**, so retrain on Accel's own swings. Simple rules on wrist and club speed may be enough for 5 moments. |
| Club / ball detection | **Build** | No ready commercial model was found. Train a small detector. Fast clubheads blur below 120 fps. |
| Metrics (X-factor, sway, spine) | **Rules** | Angle maths on 3D joints. For X-factor, use the ZYX rotation sequence recommended in the literature, so numbers match other systems. |
| Accuracy proof | **Gap** | No study was found that validates markerless X-factor or kinematic sequence against lab motion capture. A 2025 MIT thesis shows it's feasible with MeTRAbs. Wearable sensors reach ICC 0.91–1.00 against motion capture, which is the bar to aim for. |
| Commercial engine to license | **No** | **Sportsbox AI** (bought by a Bryson DeChambeau-led group, Apr 2026) has no public API or SDK. It integrates with Foresight launch monitors only inside its own app. |
| Launch monitor data | **Yes, via integration** | Trackman units have an "SDK output" setting that third-party apps (Swing Catalyst, SAM BalanceLab) use. There's no public developer portal, so contact Trackman and Foresight for partner terms. |

### To set up
1. **Cameras:** two per bay (face-on and down-the-line), 120 fps minimum, 240 recommended, 1080p, hardware-synced or time-aligned.
2. **Calibration:** mat markers so both views share one 3D space.
3. **Data:** record and label about 1–2k swings across clubs, skill levels, and left- and right-handers (swing moments + club box).
4. **Train:** a swing-moment model and a club detector. Write metric rules and coach reference ranges.
5. **Validate:** compare against a lab motion-capture or wearable-sensor session on a sample of golfers. Publish accuracy notes per metric.
6. **Integrate:** a partner agreement with Trackman and/or Foresight.

---

## 3. Gym / weightlifting

### What the model has to do
Pose · recognise the exercise · count reps · track the barbell (path and speed) · check depth, knee tracking, torso lean · flag faults and fatigue.

| Piece | Exists? | Detail |
|---|---|---|
| Pose (2D, side view) | **Yes** | RTMPose. 2D is enough for a side camera. Add a front camera for knee cave. |
| Rep counting & depth | **Yes, simple** | Many open projects do this with angle rules (SquatCoach AI, FormCheck, YOLO11-pose trainers). Easy to build in-house. |
| Barbell detection & path | **Build (small job)** | ATG.AI trained a one-class YOLOv5 barbell detector. Retrain on own images; YOLOv5 is AGPL, so use an Apache detector such as RTMDet. FormCheck guesses the bar from the wrists, which is less accurate. |
| Bar speed (velocity-based training) | **Yes, proven** | Video systems match linear position transducers for **mean** concentric velocity (Pueo et al. 2021: 160 reps; PLOS ONE 2024: Qwik VBT best; Kinovea at 240 fps). Peak velocity is less reliable. Use the standard 450 mm plate as the pixel-to-metre scale. |
| Fault classification | **Research only** | **Fitness-AQA** (back squat, barbell row, overhead press, expert-labelled faults) is non-commercial and by request. **FLEX** is CC BY-NC-SA. Start with rules; train a classifier later on Accel's own labelled reps. Earlier research found AI misses bad form more often than good, so keep the PT check in the design. |
| Commercial SDKs | **Phone-focused** | KinesteX, QuickPose and PoseTracker sell pose and exercise SDKs for mobile apps, not for multi-camera VMS deployments. |

### To set up
1. **Cameras:** a side camera per rack, 60 fps minimum, lifter fully in frame at the bottom of a squat. An optional front camera.
2. **Zones:** draw a zone per rack, and link the lifter by QR / tap check-in (already in the design).
3. **Data:** a few thousand barbell images from Accel's own gyms, plus labelled reps per exercise.
4. **Train:** the barbell detector. Write rep, depth and fault rules per exercise.
5. **Validate:** against a linear position transducer for bar speed, and against PT ratings for faults.

---

## 4. Physio / rehab

### What the model has to do
Accurate left and right joint angles (range of motion) · gait events and speed · timed tests (Timed Up and Go, sit-to-stand) · compensations · strict privacy.

| Piece | Exists? | Detail |
|---|---|---|
| 3D pose & joint angles | **Yes, with limits** | **OpenCap** (Stanford): two smartphones plus open-source processing; the pipeline is listed as Apache 2.0, to confirm. Gait angles have 4–6° error in healthy people and more in patients. It's built as a phone + cloud service, so Accel would reuse the method, not the product. |
| Single-camera joint angles | **Mixed evidence** | MediaPipe vs goniometer: 15.5° RMSE in a 2026 knee study, ICC 0.81–1.0 in a small study, and an 18–20° offset against motion capture in a sports study. **Not good enough for clinical range of motion without Accel's own validation.** |
| Timed Up and Go / sit-to-stand | **Research, promising** | A single-camera Timed Up and Go system had errors under 0.15 s on all transitions (Savoie 2019, healthy adults). A 2025 study used AlphaPose and MotionBERT to split Timed Up and Go into subtasks. Sit-to-stand video timing has been shown with one RGB camera (Shukla 2020). |
| Gait (speed, cadence, step length) | **Yes, with calibration** | Needs a known walkway length. Earlier research found low-fps clinic cameras unreliable for gait timing. |
| Commercial options | **Apps, not engines** | Kemtai, EuMotus and QuickPose JointTrack (built on MediaPipe) are clinician apps or SDKs. None was found as a licensable multi-camera engine. |
| **Regulation** | **Must decide early** | In the US, FDA guidance updated in January 2026 says a "general wellness" product (fitness metrics, no disease claims) isn't a regulated device. **Clinical claims** (measuring rehab progress for a diagnosis) likely make it Software as a Medical Device. Similar motion-tracking rehab products have gone through 510(k) (e.g. UINCARE HOME, Recovr; check the FDA database). Accel's target markets (e.g. Singapore HSA) need their own check. |

### To set up
1. **Cameras:** a fixed, calibrated camera per room. Two views for 3D range of motion. A side-on walkway camera with a marked, known length. 60 fps or more; higher for gait timing.
2. **Privacy:** consent before recording, face blur, access control, retention period and an access log (already in the design).
3. **Data:** labelled clinic sessions with goniometer readings and stopwatch times as ground truth.
4. **Validate before any claim:** compare against a goniometer per joint and range, against a stopwatch or instrumented walkway for tests and gait, and test on patients as well as healthy people.
5. **Regulatory path:** pick the positioning (wellness and decision support vs. clinical measurement) per market, with a regulatory adviser, **before** building clinical features.

---

## 5. What Accel needs to set up (all three)

| # | Item | Why | Owner |
|---|---|---|---|
| 1 | **Pick the pose layer and clear its licence** | RTMPose / RTMW is the safest default. Get legal review of the weights and their training data. | Engineering + legal |
| 2 | **Camera requirements per model** | Golf 120–240 fps × 2 views; gym 60 fps side view; physio calibrated rooms + walkway. The deployment check enforces them. | Product + hardware |
| 3 | **GPU sizing** | High fps and multi-person both multiply compute. Benchmark on the target box. | Engineering |
| 4 | **Own data collection and labelling** | Public task datasets are non-commercial. | Data / ML + domain experts |
| 5 | **Rules engine per model** | Most of the assessment is configurable angles, thresholds and weights. That's the wizard's *Assessment criteria* step. | Engineering |
| 6 | **Small task models** | Swing moments, club detector, barbell detector, and later fault classifiers. | ML |
| 7 | **Validation per metric** | Golf: motion capture or wearable sensors. Gym: linear transducer. Physio: goniometer, stopwatch, walkway. Show accuracy notes in the UI. | ML + domain partners |
| 8 | **Integrations** | Launch monitors (Trackman, Foresight) and bar speed sensors. | Partnerships |
| 9 | **Physio regulation and privacy** | Wellness vs. medical device, decided per market. | Legal / regulatory |

### Suggested order
1. **Gym first.** 2D pose + rules + one barbell detector, a proven accuracy method, and no regulation. It proves the three layers.
2. **Golf next.** Adds two-camera 3D, high fps, the swing-moment model and the launch-monitor integration.
3. **Physio last.** Same 3D setup as golf, plus validation on patients and a regulatory decision.

### Design impact (small)
- The wizard's **AI configuration** step should show each capability's **validated accuracy** and **camera needs**, so admins see the limits before deploying.
- Metrics that aren't validated yet should carry an **accuracy note** in results. This is already planned for physio gait timing; extend it to golf 3D metrics.

---

## Open questions
- Does Accel's current person detector / Re-ID run fast enough alongside pose at 120–240 fps?
- Which markets are first? That decides the physio regulatory path.
- Can Accel partner with an academy, a gym and a clinic for filmed, consented data and validation sessions?
- Trackman / Foresight partner terms, and the cost of an Ultralytics Enterprise licence if YOLO is preferred.

---

## Sources

**Pose models & licences**
- RTMPose paper (performance): [arXiv 2303.07399](https://arxiv.org/abs/2303.07399?context=cs) · RTMW: [arXiv 2407.08634](https://arxiv.org/abs/2407.08634v1) · MMPose (Apache 2.0): [PyPI](https://pypi.org/project/mmpose/) · rtmlib: [GitHub](https://github.com/Tau-J/rtmlib) · checkpoint licence note: [Hugging Face RTMPose ONNX](https://huggingface.co/michele-xilo/rtmpose-rs)
- YOLO11 AGPL / Enterprise licence: [Hugging Face Ultralytics YOLO11](https://huggingface.co/ultralytics/yolo11)
- MediaPipe Pose Landmarker: [Google docs](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) · commercial-use question: [Google AI forum](https://discuss.ai.google.dev/t/commercial-use-of-mediapipe-pose-landmarker-full/184033)
- OpenPose licence: [licence text](https://huggingface.co/OzzyGT/openpose/blob/main/LICENSE) · commercial price report: [Vuo forum](https://community.vuo.org/t/have-you-seen-openpose/6070) · sports exclusion (unverified): [HN thread](https://hn.nuxtjs.org/item/23360997)
- SMPL licensing: [Meshcapade body models](https://meshcapade.com/assets/body-models) · [Meshcapade avatar tech](https://meshcapade.com/assets/avatar-tech) · [mmhuman3d additional licences](https://mmhuman3d.readthedocs.io/en/latest/additional_licenses.html)
- COCO-trained weights caveat: [LibreYOLO pose model card](https://huggingface.co/LibreYOLO/LibreECl-pose-obj2coco)
- Jetson deployment: [RTMPose benchmark](https://cdn05042023.gitlink.org.cn/OpenMMLab/mmpose/src/branch/main/projects/rtmpose/benchmark) · [YOLO-NAS Pose on Jetson](https://huggingface.co/pesi/YOLO-NAS-Pose-JetPack5)

**Golf**
- GolfDB / SwingNet: [arXiv 1903.06528](https://arxiv.org/abs/1903.06528v1) · [GolfDB repo listing](https://awesome.ecosyste.ms/projects/github.com%2Fwmcnally%2Fgolfdb) · newer event model: [ECNU](https://pure.ecnu.edu.cn/en/publications/learning-golf-swing-key-events-from-gaussian-soft-labels-using-mu/)
- Markerless golf (MeTRAbs): [MIT thesis 2025](https://dspace.mit.edu/handle/1721.1/162530) · IMU vs motion capture X-factor: [Sensors 2023](https://www.mdpi.com/1424-8220/23/20/8433/html) · X-factor method: [Sports Biomechanics](https://lida.sport-iat.de/twm/Record/4020265?lng=en)
- Sportsbox AI acquisition: [Business Wire, Apr 2026](https://www.businesswire.com/news/home/20260407643695/en/) · Foresight integration: [PR Newswire](https://prnewswire.com/news-releases/foresight-sports-and-sportsbox-ai-industry-first-launch-monitor-technology-integrated-with-3d-motion-swing-capture-available-now-302173803.html) · engineering vendor: [LITSLINK](https://litslink.com/case-studies/ai-golf-swing-analyzer)
- Trackman third-party connection: [Swing Catalyst](https://support.swingcatalyst.com/hc/en-us/articles/200967918) · [SAM BalanceLab](https://www.scienceandmotion.com/download/BalanceLab/BL3-TM4-Integration.pdf)

**Gym**
- Open projects: [SquatCoachAI](https://github.com/Code-Sey/SquatCoachAI) · [FormCheck](https://github.com/ctsc/FormCheck) · [ATG.AI](https://github.com/RanGlad12/ATG.AI)
- Datasets: [Fitness-AQA](https://github.com/ParitoshParmar/Fitness-AQA) · [Fitness-AQA on Zenodo](https://zenodo.org/records/7310289) · [FLEX](https://arxiv.org/html/2506.03198v1)
- Bar speed validity: [Pueo et al. 2021](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7866505/) · [PLOS ONE 2024 smartphone apps](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11575817/) · [Kinovea 240 fps](https://www.jhse.ua.es/article/view/2021-v16-n4-smartphone-high-speed-camera-kinovea-velocity-based-) · [Metric vendor validation](https://www.metric.coach/articles/concurrent-validity-of-novel-smartphone-based-apps-monitoring-barbell-velocity-in-powerlifting-exercises)
- SDK vendors: [KinesteX](https://github.com/KinesteX/KinesteX-SDK-ReactNative) · [QuickPose JointTrack](https://www.g2.com/sellers/jointtrack) · [PoseTracker API](https://www.futurepedia.io/tool/posetracker-api)

**Physio**
- OpenCap gait accuracy: [Frontiers 2025 review](https://public-pages-files-2025.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1674133/pdf) · [knee OA study](https://pubmed.ncbi.nlm.nih.gov/41323870/) · [OpenCap vs OptoGait](https://iris.univr.it/retrieve/d8b27222-7805-4ce3-814e-233808d23caa/sensors-26-01234-v2.pdf) · [markerless clinical scoping review](https://arxiv.org/pdf/2609.18667) · licence listing: [stanfordnmbl repos](https://github.fontlos.workers.dev/orgs/stanfordnmbl/repositories?type=all)
- MediaPipe vs goniometer: [JMIR Rehab 2026](https://preprints.jmir.org/preprint/102399) · [Sensors 2022](https://doaj.org/article/cf3606f816154bdca8756d5fb872f5a2)
- Timed Up and Go / sit-to-stand video: [PMC 2025 subtasks](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12762308/) · [Savoie et al. (UNB)](https://unbscholar.lib.unb.ca/items/8735d161-e881-44f1-b01f-164e71d45498) · [sit-to-stand comparison](https://typeset.io/pdf/a-comparison-of-four-approaches-to-evaluate-the-sit-to-stand-4mudzqjsfz.pdf)
- Regulation: [Exponent on FDA Jan 2026 guidance](https://www.exponent.com/article/fda-clarifies-oversight-wearables-and-cds-software) · [AAMI summary](https://aami.org/?p=14713) · [General wellness policy](https://innolitics.com/articles/fda-guidance-general-wellness-policy-for-low-risk-devices/) · 510(k) examples: [K192474](https://fda.innolitics.com/device/K192474.md), [K150462](https://510k.innolitics.com/search/K150462)
