import { create } from "zustand";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import type { ModelData as BaseModel, ModelStep } from "@/types/modelManagement";
import { USE_CASES, type UseCaseKey } from "./taData";

/* Models for the Training Assessment module. Model Management and Model
   Deployment both read this store, so a model created in one is there to
   deploy in the other.

   Adds what the app's model type doesn't have yet: a category on every model,
   and — on a Training Assessment model — its basic assessment info: the use
   case and the activities it assesses. */

export const TA_CATEGORY = "Performance & Posture";

export const MODEL_CATEGORIES = [
  TA_CATEGORY,
  "Human Detection",
  "Weapon Detection",
  "PPE Detection",
  "Object Detection",
  "Zone Monitoring",
] as const;

export type ModelCategory = (typeof MODEL_CATEGORIES)[number];

export type { ModelStep };

export interface AssessmentInfo {
  useCase: UseCaseKey;
  /** The activities this model assesses — swings by club, lifts, clinical tests. */
  activities: string[];
}

export interface ModelData extends BaseModel {
  category: ModelCategory;
  assessment?: AssessmentInfo;
}

/** A category's default icon, from the Model Management icon registry. */
export const CATEGORY_ICON: Record<ModelCategory, string> = {
  [TA_CATEGORY]: "activity",
  "Human Detection": "eye",
  "Weapon Detection": "crosshair",
  "PPE Detection": "shield",
  "Object Detection": "box",
  "Zone Monitoring": "radar",
};

/** The CV models an assessment model of each use case runs, in order. */
export const CV_STEPS: Record<UseCaseKey, [label: string, action: string, file: string][]> = {
  golf: [
    ["Person Re-ID · v1.4", "Find and follow each golfer in the bay", "person_reid_v14.onnx"],
    ["Pose 3D · v1.2", "Body, hands and feet keypoints from two views", "pose3d_v12.onnx"],
    ["Golf Swing Events · v1.0", "Address · takeaway · top · impact · finish", "golf_swing_events_v10.onnx"],
    ["Club & Ball Detector · v1.0", "Track the club head and the ball", "club_ball_v10.onnx"],
  ],
  gym: [
    ["Person Re-ID · v1.4", "Find and follow each lifter at the rack", "person_reid_v14.onnx"],
    ["Pose 2D · v1.2", "Body and feet keypoints from the side view", "pose2d_v12.onnx"],
    ["Barbell Detector · v1.0", "Track the barbell and plates", "barbell_v10.onnx"],
  ],
  physio: [
    ["Person Re-ID · v1.4", "Find and follow each patient", "person_reid_v14.onnx"],
    ["Pose 3D · v1.2", "Body and feet keypoints, left and right", "pose3d_v12.onnx"],
    ["Gait Events · v1.0", "Heel strike · toe off · test start and end", "gait_events_v10.onnx"],
    ["Walking Aid Detector · v1.0", "Cane · frame · crutches", "walking_aid_v10.onnx"],
  ],
};

export function stepsFor(useCase: UseCaseKey, prefix: string): ModelStep[] {
  return CV_STEPS[useCase].map(([label, actionLabel, file], i) => ({
    id: `${prefix}-s${i + 1}`,
    order: i + 1,
    label,
    actionLabel,
    modelFile: file,
    manifestFile: file.replace(".onnx", ".manifest.json"),
    batchSize: 8,
  }));
}

function assessmentModel(
  id: string, name: string, useCase: UseCaseKey, description: string, createdAt: string, createdAtDisplay: string,
): ModelData {
  const steps = stepsFor(useCase, id.toLowerCase());
  return {
    id, name, description, category: TA_CATEGORY,
    assessment: { useCase, activities: USE_CASES[useCase].defaultActivities },
    tags: ["Pose", "Coaching"],
    iconKey: "activity",
    steps,
    sequenceIds: steps.map((s) => s.id),
    attachedRuleIds: [],
    extractedRules: [],
    modelFile: steps[1].modelFile,
    manifestFile: steps[1].manifestFile,
    defaultConfidence: 70,
    createdAt, createdAtDisplay,
  };
}

const SEED_CATEGORY: Record<string, ModelCategory> = {
  Mdl_001: "Human Detection",
  Mdl_002: "Weapon Detection",
  Mdl_003: "PPE Detection",
};

const SEED: ModelData[] = [
  assessmentModel("Mdl_101", "Golf Swing Assessment", "golf", "Swing technique for junior squad clinics: pose, swing moments, club and ball.", "2026-10-02T09:00:00", "2 Oct 2026, 09:00"),
  assessmentModel("Mdl_102", "Strength Technique Assessment", "gym", "Barbell technique for PT clients and classes: depth, torso lean, knee tracking and bar path.", "2026-10-06T14:30:00", "6 Oct 2026, 14:30"),
  assessmentModel("Mdl_103", "Rehab Movement Assessment", "physio", "Decision support for knee rehab, not diagnosis: range of motion, gait and standard tests.", "2026-10-09T11:15:00", "9 Oct 2026, 11:15"),
  ...MOCK_MODELS.map((m) => ({ ...m, category: SEED_CATEGORY[m.id] ?? "Object Detection" })),
];

interface TaModelsState {
  models: ModelData[];
  setModels: (next: ModelData[] | ((prev: ModelData[]) => ModelData[])) => void;
}

export const useTaModelsStore = create<TaModelsState>((set) => ({
  models: SEED,
  setModels: (next) => set((s) => ({ models: typeof next === "function" ? next(s.models) : next })),
}));

export const isAssessment = (m: Pick<ModelData, "category">) => m.category === TA_CATEGORY;

/** An assessment model deploys once it has at least one step; it needs no rules. */
export function isDeployable(m: ModelData): boolean {
  if (m.sequenceIds.length === 0) return false;
  return isAssessment(m) || m.attachedRuleIds.length > 0;
}
