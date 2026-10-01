import { create } from "zustand";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import type { ModelData as BaseModel, ModelStep as BaseStep } from "@/types/modelManagement";

/* Models for the Re-ID module. Model Management and Model Deployment both read
   this store, so a model created in one is there to deploy in the other.

   Adds two things the app's model type doesn't have yet: a category on every
   model, and a calibration file on the steps of a Re-ID model. */

export const MODEL_CATEGORIES = [
  "RE-ID",
  "Weapon Detection",
  "Human Detection",
  "PPE Detection",
  "Object Detection",
  "Zone Monitoring",
] as const;

export type ModelCategory = (typeof MODEL_CATEGORIES)[number];

export const REID_CATEGORY: ModelCategory = "RE-ID";

/* Re-ID models calibrate per camera on deploy, so their steps are plain steps. */
export type ModelStep = BaseStep;

export interface ModelData extends Omit<BaseModel, "steps"> {
  category: ModelCategory;
  steps: ModelStep[];
}

/** A category's default icon, from the Model Management icon registry. */
export const CATEGORY_ICON: Record<ModelCategory, string> = {
  "RE-ID": "fingerprint",
  "Weapon Detection": "crosshair",
  "Human Detection": "eye",
  "PPE Detection": "shield",
  "Object Detection": "box",
  "Zone Monitoring": "radar",
};

const SEED_CATEGORY: Record<string, ModelCategory> = {
  Mdl_001: "Human Detection",
  Mdl_002: "Weapon Detection",
  Mdl_003: "PPE Detection",
};

const REID_MODEL: ModelData = {
  id: "Mdl_004",
  name: "Person Re-ID",
  description:
    "Follows the same person across cameras by appearance, placing them on one floor plan through the site's shared ArUco marker map.",
  category: "RE-ID",
  tags: ["Tracking", "Zone"],
  iconKey: "fingerprint",
  steps: [
    {
      id: "reid-s1",
      order: 1,
      label: "ReID_v1",
      actionLabel: "Match each person across overlapping cameras",
      modelFile: "person_reid.onnx",
      manifestFile: "person_reid.manifest.json",
      batchSize: 16,
    },
  ],
  sequenceIds: ["reid-s1"],
  attachedRuleIds: [],
  extractedRules: [],
  modelFile: "person_reid.onnx",
  manifestFile: "person_reid.manifest.json",
  defaultConfidence: 80,
  createdAt: "2026-09-29T10:00:00",
  createdAtDisplay: "29 Sep 2026, 10:00",
};

const SEED: ModelData[] = [
  REID_MODEL,
  ...MOCK_MODELS.map((m) => ({ ...m, category: SEED_CATEGORY[m.id] ?? "Object Detection" })),
];

interface ReidModelsState {
  models: ModelData[];
  setModels: (next: ModelData[] | ((prev: ModelData[]) => ModelData[])) => void;
}

export const useReidModelsStore = create<ReidModelsState>((set) => ({
  models: SEED,
  setModels: (next) => set((s) => ({ models: typeof next === "function" ? next(s.models) : next })),
}));

/** A Re-ID model deploys only once it has at least one step; it needs no rules. */
export function isDeployable(m: ModelData): boolean {
  if (m.sequenceIds.length === 0) return false;
  return m.category === REID_CATEGORY || m.attachedRuleIds.length > 0;
}
