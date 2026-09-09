import type { RuleSeverity } from "@/types/rules";

/* The rule form collects a free set of parameters — the operator includes only
   the fields the rule needs. Which fields are present decides the trigger event
   and detection type of the payload the Accel backend consumes; the manifest
   templates below are the lookup table for that derivation, not a picker. */

/** A parameter a template asks the operator to fill in. */
export type RuleParameterId =
  | "object_class"
  | "confidence"
  | "zone"
  | "duration"
  | "count_threshold";

/** A model capability a template depends on. */
export type RuleRequirement = "tracking" | "zone";

/** Backend detection classification a template defaults to. */
export type DetectionType = "unauth" | "loiter" | "movement" | "compliance";

export interface RuleTemplateDef {
  id: string;
  name: string;
  /** Engine event the trigger fires on. */
  event: string;
  requires: RuleRequirement[];
  parameters: RuleParameterId[];
  defaultDetectionType: DetectionType;
  /** Plain-English gloss shown under the template name in the picker. */
  description: string;
}

export type DurationUnit = "seconds" | "minutes";

/** Values collected by the form. Only the keys the template declares are used. */
export interface RuleTemplateParams {
  objectClasses: string[];
  /** Percent (0–100) in the form; emitted to the payload as a 0–1 fraction. */
  confidence: number;
  zoneId: string;
  duration: number;
  durationUnit: DurationUnit;
  countThreshold: number;
}

/** What a rule stores so the form can be rehydrated for editing. */
export interface RuleConfig {
  /**
   * Parameters included in this rule, in form order. Operators remove a field
   * they do not need and add it back from the field picker.
   */
  fields: RuleParameterId[];
  params: RuleTemplateParams;
  /** Model step the rule belongs to, when authored from Model Management. */
  stepId?: string;
}

/* ── Backend payload ─────────────────────────────────────────────────────── */

export interface GeneratedRulePayload {
  ruleId: string;
  stepId: string;
  name: string;
  severity: RuleSeverity;
  enabled: boolean;
  ruleTemplateId: string;
  detectionType: DetectionType;
  typeLabel: string;
  trigger: {
    event: string;
    object: { type: "class"; classes: string[] };
  };
  location?: { type: "zone"; zoneId: string };
  conditions: { type: string; operator: string; value: number }[];
  actions: { type: string }[];
  duration?: { operator: string; value: number; unit: DurationUnit };
}
