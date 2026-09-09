import type {
  RuleParameterId,
  RuleTemplateDef,
  RuleTemplateParams,
} from "@/types/ruleTemplates";

/* Mirrors the `rule_templates:` block of a model manifest. In production this
   list is parsed from the manifest that ships alongside the model file. The
   form does not ask the operator to pick one — the template is resolved from
   the parameters the rule actually uses, so the payload carries a valid
   `ruleTemplateId`, `event` and `detectionType`. */
export const RULE_TEMPLATES: RuleTemplateDef[] = [
  {
    id: "object_detected",
    name: "Object Detected",
    event: "detected",
    requires: [],
    parameters: ["object_class", "confidence"],
    defaultDetectionType: "unauth",
    description: "Fires the moment a matching class is detected anywhere in frame.",
  },
  {
    id: "object_enters_zone",
    name: "Object Enters Zone",
    event: "enter_zone",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "confidence", "zone"],
    defaultDetectionType: "unauth",
    description: "Fires when a tracked object crosses into the selected zone.",
  },
  {
    id: "object_stays_in_zone",
    name: "Object Stays in Zone",
    event: "dwell",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "confidence", "zone", "duration"],
    defaultDetectionType: "loiter",
    description: "Fires when an object remains inside the zone beyond the dwell time.",
  },
  {
    id: "object_exits_zone",
    name: "Object Exits Zone",
    event: "exit_zone",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "confidence", "zone"],
    defaultDetectionType: "movement",
    description: "Fires when a tracked object leaves the selected zone.",
  },
  {
    id: "object_lost_in_zone",
    name: "Object Lost in Zone",
    event: "object_lost",
    requires: ["tracking", "zone"],
    parameters: ["object_class", "zone", "duration"],
    defaultDetectionType: "movement",
    description: "Fires when tracking on an object inside the zone is lost.",
  },
  {
    id: "object_count",
    name: "Object Count",
    event: "count",
    requires: ["zone"],
    parameters: ["object_class", "zone", "count_threshold"],
    defaultDetectionType: "unauth",
    description: "Fires when the number of objects in the zone crosses the threshold.",
  },
  {
    id: "object_absent",
    name: "Object Absent",
    event: "absent",
    requires: ["zone"],
    parameters: ["object_class", "zone", "duration"],
    defaultDetectionType: "compliance",
    description: "Fires when an expected object is missing from the zone.",
  },
];

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

/** Zones a rule can be scoped to. `zone-full-frame` is the whole camera view. */
export const ZONE_OPTIONS: { id: string; label: string }[] = [
  { id: "zone-full-frame",        label: "Full Frame" },
  { id: "zone-armoury-b",         label: "Armoury-B" },
  { id: "zone-pier-4-storage-c",  label: "Pier 4 Storage-C" },
  { id: "zone-loading-bay-a",     label: "Loading Bay A" },
  { id: "zone-camp-area",         label: "Camp Area" },
  { id: "zone-construction-a",    label: "Construction Zone A" },
  { id: "zone-restricted",        label: "Restricted Perimeter" },
  { id: "zone-server-room-3",     label: "Server Room 3" },
  { id: "zone-lobby",             label: "Lobby Zone" },
];

export function zoneLabel(zoneId: string): string {
  return ZONE_OPTIONS.find((z) => z.id === zoneId)?.label ?? zoneId;
}

/** Every rule fires an alert; the form does not expose other actions. */
export const RULE_ACTION = "alert";

/** Field labels and units, keyed by parameter. */
export const PARAMETER_META: Record<
  RuleParameterId,
  { label: string; hint: string }
> = {
  object_class:    { label: "Object Class",    hint: "Classes the model must detect for this rule to fire." },
  confidence:      { label: "Confidence",      hint: "Minimum detection confidence before the rule fires." },
  zone:            { label: "Zone",            hint: "Area of the camera view the rule applies to." },
  duration:        { label: "Duration",        hint: "How long the condition must hold before firing." },
  count_threshold: { label: "Count Threshold", hint: "Number of objects that trips the rule." },
};

/** Fields the form starts with, in display order. All are removable. */
export const DEFAULT_FIELDS: RuleParameterId[] = [
  "object_class",
  "confidence",
  "zone",
  "count_threshold",
  "duration",
];

export const DEFAULT_TEMPLATE_PARAMS: RuleTemplateParams = {
  objectClasses: [],
  confidence: 60,
  zoneId: "zone-full-frame",
  duration: 5,
  durationUnit: "seconds",
  countThreshold: 3,
};
