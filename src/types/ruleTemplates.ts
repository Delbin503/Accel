/* The rule form is built around object classes. A rule names the classes it
   watches, and each class carries its own values for whichever parameters the
   operator kept on the rule. */

/** A per-class parameter the operator fills in. */
export type RuleParameterId = "confidence" | "duration" | "count_threshold";

export type DurationUnit = "seconds" | "minutes";

/**
 * Parameters for one object class. Every class on a rule carries its own set —
 * both which parameters apply and what they are set to — so a rule watching
 * seven classes tunes seven independently.
 */
export interface ClassParams {
  /** Parameters present on this class, in display order. */
  fields: RuleParameterId[];
  /** Percent (0–100) in the form; emitted to the payload as a 0–1 fraction. */
  confidence: number;
  duration: number;
  durationUnit: DurationUnit;
  countThreshold: number;
}

/** What a rule stores so the form can be rehydrated for editing. */
export interface RuleConfig {
  /** Object classes the rule watches, in display order. */
  objectClasses: string[];
  /** Parameters keyed by object class. */
  perClass: Record<string, ClassParams>;
  /** Model step the rule belongs to, when authored from Model Management. */
  stepId?: string;
  /** Event-based conditions authored in the builder. Absent on older rules. */
  conditions?: RuleCondition[];
}

/* ── Rule conditions ──────────────────────────────────────────────────────
   A rule's conditions are instances of the event templates in
   `mocks/ruleTemplates`. Each condition names the event it watches and carries
   its own values, so one rule can combine several events.

   These sit alongside `objectClasses` / `perClass` rather than replacing them:
   the rule cards, the WHEN/IN/AND summary and Model Management still read
   those, and they are derived from the conditions on save.
   ────────────────────────────────────────────────────────────────────────── */

/** A parameter an event template can declare. */
export type ConditionParamId =
  | "object_class"
  | "confidence"
  | "zone"
  | "duration"
  | "count_threshold";

/** How the platform classifies what an event represents. */
export type DetectionType = "unauth" | "loiter" | "movement" | "compliance";

/** One entry in the event-template catalog. */
export interface EventTemplate {
  /** Stable id shown on the condition card, e.g. "object_enters_zone". */
  id: string;
  /** Display name, e.g. "Object Enters Zone". */
  name: string;
  /** Event the engine emits, e.g. "enter_zone". */
  event: string;
  /** Capabilities the event needs from the pipeline. */
  requires: string[];
  /** Parameters the template declares — the starting selection in the form. */
  parameters: ConditionParamId[];
  defaultDetectionType: DetectionType;
}

/** One authored condition on a rule. */
export interface RuleCondition {
  /** Unique within the rule. */
  id: string;
  /** Which event template this condition instantiates. */
  templateId: string;
  /** Parameters this condition carries. Object class and confidence are always present. */
  parameters: ConditionParamId[];
  objectClasses: string[];
  /** Percent (0–100). */
  confidence: number;
  /** Optional — a condition may watch the whole frame. */
  zone?: string;
  duration: number;
  durationUnit: DurationUnit;
  countThreshold: number;
}
