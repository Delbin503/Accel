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
}
