import type {
  ClassParams,
  ConditionParamId,
  EventTemplate,
  RuleParameterId,
} from "@/types/ruleTemplates";

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

/* ── Event templates ─────────────────────────────────────────────────────
   The catalogue the rule builder's conditions are built from. Mirrors the
   `rule_templates` spec: each entry names the event the engine emits, what the
   pipeline must support, and which parameters the event declares.
   ────────────────────────────────────────────────────────────────────────── */

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "object_detected",
    name: "Object Detected",
    event: "detected",
    requires: [],
    parameters: ["object_class", "confidence"],
    defaultDetectionType: "unauth",
  },
  {
    id: "object_enters_zone",
    name: "Object Enters Zone",
    event: "enter_zone",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "confidence", "zone"],
    defaultDetectionType: "unauth",
  },
  {
    id: "object_stays_in_zone",
    name: "Object Stays in Zone",
    event: "dwell",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "confidence", "zone", "duration"],
    defaultDetectionType: "loiter",
  },
  {
    id: "object_exits_zone",
    name: "Object Exits Zone",
    event: "exit_zone",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "zone"],
    defaultDetectionType: "movement",
  },
  {
    id: "object_lost_in_zone",
    name: "Object Lost in Zone",
    event: "object_lost",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "zone", "duration"],
    defaultDetectionType: "movement",
  },
  {
    id: "object_count",
    name: "Object Count",
    event: "count",
    requires: ["zone"],
    parameters: ["object_class", "zone", "count_threshold"],
    defaultDetectionType: "unauth",
  },
  {
    id: "object_absent",
    name: "Object Absent",
    event: "absent",
    requires: ["zone"],
    parameters: ["object_class", "zone", "duration"],
    defaultDetectionType: "compliance",
  },
];

/** Boundary zones a condition can be scoped to. Zone is always optional. */
export const RULE_ZONES: string[] = [
  "Armoury-B",
  "Loading Bay 3",
  "HQ Lobby",
  "Perimeter North",
  "Server Room",
  "Checkpoint C1",
];

/**
 * Labels for the condition parameters. Object class and confidence are always
 * carried, so they render as locked chips in the parameter picker.
 */
export const CONDITION_PARAM_META: Record<
  ConditionParamId,
  { label: string; locked?: boolean }
> = {
  object_class:    { label: "Object Classes", locked: true },
  confidence:      { label: "Confidence",     locked: true },
  zone:            { label: "Zone" },
  duration:        { label: "Duration" },
  count_threshold: { label: "Count Threshold" },
};
