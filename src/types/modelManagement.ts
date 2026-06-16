import type { RuleSeverity } from "@/types/rules";

export interface ModelStep {
  id: string;
  order: number;
  label: string;            // Model Title
  actionLabel: string;
  modelFile: string;        // CV model file (e.g. helmet.onnx)
  manifestFile: string;     // .json manifest
}

/**
 * A rule auto-extracted from a step's uploaded model file on parse. Surfaces in
 * the Detection Rules panel tagged "Model". Carries the same editable fields as
 * a Rule-Library rule so the cards look and behave alike. Two shapes are
 * possible: several discrete rules, or one rule with many conditions.
 */
export interface ExtractedRule {
  id: string;
  name: string;
  /** Unset until the user opens the rule on the builder page and picks a severity. */
  severity?: RuleSeverity;
  description: string;
  tags: string[];
  conditions: string[];
}

export interface ModelData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconKey: string;
  steps: ModelStep[];
  sequenceIds: string[];
  attachedRuleIds: string[];
  /** Rules auto-extracted from the uploaded model file (source: "model"). */
  extractedRules: ExtractedRule[];
  /** Uploaded CV model file name (e.g. helmet.onnx). */
  modelFile?: string;
  /** Uploaded manifest file name (.json). */
  manifestFile?: string;
  createdAt: string;
  createdAtDisplay: string;
}
