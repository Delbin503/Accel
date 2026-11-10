# Product Design Brief: Training Assessment Module

**Product:** Sigmawave VMS  
**Module:** Training Assessment  
**Document purpose:** UI/UX design requirements and user flow

> Source: ChatGPT conversation "Performance Analysis Use Cases" (shared 2026-11-07), https://chatgpt.com/share/6aebf0ae-d294-83ec-a2a1-67462cfd1b9b

## 1. Product Overview

Training Assessment is an AI-powered application module within Sigmawave's Video Management System (VMS).

Its purpose is to analyse individuals or groups performing specific activities using video footage. The system uses AI to evaluate movement, posture, techniques, behaviours and performance against predefined assessment criteria.

The module grows out of an existing military shooting After Action Review (AAR) system. We are focusing on four use cases:

| Use case | What is assessed | Likely customers | Camera / setup notes |
|---|---|---|---|
| **Golf swing performance** | Swing posture and spine angle, hip and shoulder rotation, weight transfer, swing plane and follow-through, consistency across swings. | Golf academies, clubs, driving ranges, indoor training facilities, coaches. | Needs high-frame-rate cameras at set angles (e.g. front and side view). Standard security CCTV is unlikely to be enough. |
| **Industrial workplace safety** | Lifting posture, bending and twisting, repetitive movements, unsafe movements, PPE compliance, procedure compliance. | Manufacturing, warehouses, logistics operators, safety consultants. | Usually works with existing CCTV and continuous recording. Extra cameras optional for better posture visibility. Multiple workers at once. |
| **Gym / weightlifting technique assessment** | Squat, deadlift and other lifts: joint angles, body alignment, repetition counting, consistency and form breakdown from fatigue. | Gyms, personal training studios, fitness chains, sports performance centres. | Fixed cameras covering lifting areas. Movements are fairly standard, so a good first proof of concept. |
| **Physiotherapy / rehabilitation** | Walking and gait, joint range of motion, posture correction, before-and-after progress across sessions. | Physiotherapy clinics, rehabilitation centres, hospitals. | Needs stronger privacy controls and clinical validation. Progress over time matters more than one-off scores. |

The module should support all four through configurable assessment models rather than a separate application for each use case.

## 2. Core Product Concept

The system should follow a **Configure Once, Deploy Whenever Required** approach.

Users should not need to configure an assessment from scratch every time they want to conduct an assessment.

Instead, they configure an assessment model once, save it, and reuse it whenever required.

The product should have three main stages:

### Stage 1: Create & Configure Assessment Model

One-time setup for each use case.

Users configure:
- Assessment name and description.
- Industry and activity type.
- Required AI capabilities/models.
- Camera and hardware requirements.
- Assessment environment and camera positions.
- Participant detection and tracking settings.
- Assessment criteria and evaluation rules.
- Scoring and reporting configuration.

Once configured and validated, the assessment model is saved for future deployment.

### Stage 2: Deploy & Activate Assessment Model

Users select an existing assessment model and activate it at a particular location or camera group.

The deployment process should be simple:
1. Select a saved assessment model.
2. Select the deployment location.
3. Select or confirm the relevant camera group.
4. Verify deployment settings.
5. Activate the assessment model.

The system should automatically apply the saved configuration.

### Stage 3: Run Assessment & Review Results

Once deployed, the system can analyse activities captured by the selected video sources.

Users should be able to:
- Start or create an assessment session.
- Analyse multiple participants simultaneously.
- View group-level performance.
- Drill down into individual performance.
- Review video evidence and timestamps.
- Generate assessment reports.
- Compare performance across previous sessions.

## 3. Important Product Terminology

The designer should maintain a clear distinction between the following concepts.

| Term | Definition |
|---|---|
| Assessment Model | A reusable configuration defining what is being assessed and how the AI evaluates it. |
| Deployment | An activated instance of an assessment model at a specific location or camera group. |
| Assessment Session | A particular training or activity session being analysed. |
| Assessment Results | The findings and evaluation generated from an assessment session. |

**Example:**

One Industrial Safety Assessment model can be deployed at multiple warehouse zones. Each deployment can generate multiple assessment sessions, with separate group and individual results.

## 4. Proposed Navigation Structure

The Training Assessment module should have the following main navigation sections:

| Navigation | Function |
|---|---|
| Assessment Dashboard | Overview of active deployments, ongoing sessions and recent assessment results. |
| Assessment Models | Create, configure, edit and manage reusable assessment models. |
| Active Deployments | View, activate, deactivate and manage deployed assessment models. |
| Assessment Sessions | View and manage ongoing and completed assessment sessions. |
| Results & Reports | Review group and individual results, historical performance and reports. |

Hardware Management should remain a separate core VMS function, with reusable hardware profiles available for assessment configuration.

## 5. Detailed User Flow

### A. Assessment Model Creation

The designer should create a guided setup wizard.

**Step 1 – Basic Information**
- Assessment model name.
- Industry/category.
- Description.
- Activity/use case.

**Step 2 – AI Configuration**
- Select required AI capabilities.
- Select relevant AI models.
- Configure detection and tracking requirements.
- Configure activity recognition requirements.

**Step 3 – Hardware & Environment Setup**
- Select registered cameras.
- Select or create hardware profiles.
- Assign camera positions and viewing angles.
- Configure camera calibration where required.
- Verify camera coverage.

**Step 4 – Participant Configuration**
- Configure participant identification.
- Support pre-registered participants.
- Support automatic person detection.
- Support temporary tracking IDs.
- Configure group/team identification where required.

**Step 5 – Assessment Criteria**
- Define evaluation criteria.
- Configure performance benchmarks.
- Define scoring rules.
- Set thresholds and expected behaviours.
- Configure assessment output.

**Step 6 – Reporting Configuration**
- Individual performance reports.
- Group performance reports.
- Video evidence and timestamps.
- Performance scores.
- Recommendations and improvement areas.

**Step 7 – Test & Save**
- Preview the configuration.
- Run a test analysis.
- Validate camera coverage and AI output.
- Save the assessment model.

### B. Assessment Model Deployment

Once a model has been configured, users should be able to deploy it without repeating the entire setup.

Proposed flow:

1. Select an assessment model.
2. Select deployment location.
3. Assign camera group.
4. Verify deployment configuration.
5. Activate deployment.

Users should also be able to deactivate or reactivate deployments.

### C. Assessment Session

Within an active deployment:

1. Create or start a new assessment session.
2. Define the session name and relevant time period.
3. Select the participants or participant group, where applicable.
4. Select the relevant recorded footage or live video source.
5. Run AI analysis.
6. Monitor analysis progress.
7. Complete the assessment session.
8. Review generated results.

**Important:** The VMS already supports continuous video recording. Users should be able to select existing recordings and relevant time ranges instead of having to start and stop video recording for every assessment.

## 6. Multi-Person Assessment Requirements

Multi-person assessment should be considered a core capability of the module.

The system must support analysing multiple individuals within the same video footage and generating both group-level and individual-level results.

Two participant identification approaches should be supported:

**Option A – Pre-registered participants**
- Participant ID.
- Name or identifier.
- Group/team assignment.
- Optional profile information.

**Option B – Automatic participant detection**
- AI automatically detects individuals.
- Assigns temporary tracking IDs (Person 001, Person 002, etc.).
- Tracks individuals across video frames.
- Allows users to manually correct participant assignments.

The system should also account for tracking loss, occlusion and people crossing paths to reduce incorrect attribution of assessment results.

## 7. Assessment Results & Dashboard

The results interface should have two levels.

**A. Group Performance Overview**

Display:
- Total number of participants.
- Number of completed assessments.
- Overall group performance.
- Group performance trends.
- Participants requiring further review.
- Common mistakes or deviations.

**B. Individual Performance Breakdown**

When a user selects a participant, display:
- Individual performance score.
- Movement and posture analysis.
- Activity-specific evaluation.
- Video clips with timestamps.
- Errors and deviations.
- Recommendations for improvement.
- Historical performance comparisons.

The interface should allow users to move easily between the group overview and individual participant results.

## 8. Important System Capabilities

The following AI capabilities should be considered in the product architecture:

| AI Capability | Purpose |
|---|---|
| Person Detection | Identify individuals in video footage. |
| Person Tracking | Track individuals across video frames. |
| Person Re-identification | Reconnect individual identities after occlusion or camera changes. |
| Pose Estimation | Analyse body posture and movement. |
| Action Recognition | Identify activities being performed. |
| Object Detection | Detect relevant objects, equipment or tools. |
| Movement Analysis | Evaluate movement patterns and techniques. |
| Behaviour Analysis | Identify specific behaviours or deviations. |

These are underlying AI capabilities, not separate user-facing assessment modules.

An assessment model combines the relevant AI capabilities with its own criteria and evaluation rules.

## 9. Key UX/UI Design Considerations

1. **Reusable configuration:** Users should configure each assessment model once and reuse it.
2. **Simple deployment:** Deployment should require minimal steps.
3. **Industry flexibility:** The same overall workflow should work across golf, industrial safety, gym and physiotherapy, and future use cases.
4. **Multi-person support:** The interface must support group assessment and individual drill-down.
5. **Video-centric interface:** Users should be able to view video footage alongside AI findings and timestamps.
6. **VMS integration:** Leverage existing cameras, recordings and hardware management functions.
7. **Conditional configuration:** Only show hardware and AI configuration options relevant to the selected assessment model.
8. **Clear status indicators:** Distinguish between draft models, configured models, active deployments, ongoing sessions and completed sessions.
9. **Configuration versioning:** Changes to a saved assessment model should not unintentionally alter historical assessment results.

## 10. Suggested Design Deliverables

The designer should focus on the following screens and interactions:

| Priority | Screen / Feature | Design Requirement |
|---|---|---|
| High | Assessment Dashboard | Overview of models, deployments and sessions. |
| High | Assessment Models Listing | View, create, edit and manage models. |
| High | Assessment Model Setup Wizard | Complete one-time configuration workflow. |
| High | Assessment Model Details | View saved configuration and deployment options. |
| High | Deployment Setup | Select location and camera group, then activate. |
| High | Active Deployments | Manage deployed models. |
| High | Assessment Session Interface | Select footage, participants and run analysis. |
| High | Group Results Dashboard | View overall group performance. |
| High | Individual Results View | Drill down into individual assessment results. |
| Medium | Assessment Reports | Generate and view reports. |
| Medium | Historical Performance | Compare performance across sessions. |
| Medium | Participant Management | Manage registered participants and groups. |

## 11. Recommended Initial Design Scope

For the first design iteration, prioritise the complete end-to-end journey:

1. Create and configure an assessment model.
2. Save the model.
3. Deploy the saved model.
4. Run an assessment session.
5. Analyse multiple participants.
6. Review group and individual results.

Advanced benchmarking, detailed historical analytics and sophisticated report customisation can be designed as subsequent enhancements.

**Overall design objective:** Create a reusable, scalable Training Assessment module within the VMS where users can configure an assessment use case once, deploy it whenever needed, analyse multiple individuals simultaneously and review their performance through AI-generated insights and video evidence.
