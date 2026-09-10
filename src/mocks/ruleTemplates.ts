import type { ClassParams, RuleParameterId } from "@/types/ruleTemplates";

/** Object classes the deployed models can emit. */
export const OBJECT_CLASSES: string[] = [
  "person",
  "MXX-1200",
  "weapon",
  "helmet",
  "chin_strap",
  "bolt_group",
  "vehicle",
  "bag",
  "forklift",
];

/** Every parameter a class can carry, in display order. */
export const ALL_FIELDS: RuleParameterId[] = ["confidence", "count_threshold", "duration"];

/** Parameters a newly added class starts with, and their starting values. */
export const DEFAULT_CLASS_PARAMS: ClassParams = {
  fields: [...ALL_FIELDS],
  confidence: 60,
  duration: 5,
  durationUnit: "seconds",
  countThreshold: 3,
};

/** Field labels and hints, keyed by parameter. */
export const PARAMETER_META: Record<RuleParameterId, { label: string; hint: string }> = {
  confidence:      { label: "Confidence",      hint: "Minimum detection confidence before the rule fires." },
  count_threshold: { label: "Count Threshold", hint: "Number of objects that trips the rule." },
  duration:        { label: "Duration",        hint: "How long the condition must hold before firing." },
};
