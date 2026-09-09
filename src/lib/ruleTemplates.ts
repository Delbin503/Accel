import {
  DEFAULT_FIELDS,
  DEFAULT_TEMPLATE_PARAMS,
  RULE_ACTION,
  RULE_TEMPLATES,
  ZONE_OPTIONS,
  zoneLabel,
} from "@/mocks/ruleTemplates";
import type { ConditionRow, RuleData, RuleSeverity } from "@/types/rules";
import type {
  GeneratedRulePayload,
  RuleConfig,
  RuleParameterId,
  RuleTemplateDef,
} from "@/types/ruleTemplates";

/* ── Config helpers ──────────────────────────────────────────────────────── */

export const EMPTY_CONFIG: RuleConfig = {
  fields: [...DEFAULT_FIELDS],
  params: { ...DEFAULT_TEMPLATE_PARAMS },
};

/**
 * Resolves the manifest template whose parameters the rule's field set matches
 * most closely. The operator never picks one — this is what gives the payload
 * its `ruleTemplateId`, trigger `event` and `detectionType`.
 */
export function resolveTemplate(fields: RuleParameterId[]): RuleTemplateDef {
  const has = (f: RuleParameterId) => fields.includes(f);
  let id = "object_detected";
  if (has("count_threshold")) id = "object_count";
  else if (has("zone") && has("duration")) id = "object_stays_in_zone";
  else if (has("zone")) id = "object_enters_zone";
  return RULE_TEMPLATES.find((t) => t.id === id) ?? RULE_TEMPLATES[0];
}

/**
 * Compiles a rule config into the WHEN/IN/AND/FOR/THEN rows the rule list,
 * model cards and plain-English summary already render. The config stays the
 * source of truth; these rows are the display projection of it.
 */
export function configToRows(config: RuleConfig, name: string): ConditionRow[] {
  const p = config.params;
  const has = (f: RuleParameterId) => config.fields.includes(f);
  const rows: ConditionRow[] = [];
  let n = 0;
  const row = (r: Omit<ConditionRow, "id">): ConditionRow => ({ id: `cfg-${++n}`, ...r });

  const trigger = has("object_class") && p.objectClasses.length > 0
    ? p.objectClasses.join(", ")
    : name || "Detection";
  rows.push(row({ type: "WHEN", field: trigger, operator: "", value: "", unit: "" }));

  if (has("zone")) {
    rows.push(row({ type: "IN", field: zoneLabel(p.zoneId), operator: "", value: "", unit: "" }));
  }
  if (has("confidence")) {
    rows.push(row({ type: "AND", field: "Confidence level", operator: "at least", value: String(p.confidence), unit: "%" }));
  }
  if (has("count_threshold")) {
    rows.push(row({ type: "AND", field: "Object count", operator: "at least", value: String(p.countThreshold), unit: "objects" }));
  }
  if (has("duration")) {
    rows.push(
      row({
        type: "FOR",
        field: "",
        operator: "more than",
        value: String(p.duration),
        unit: p.durationUnit === "minutes" ? "Minutes" : "Seconds",
      })
    );
  }
  rows.push(row({ type: "THEN", field: "Trigger Alert", operator: "", value: "", unit: "" }));
  return rows;
}

/**
 * Best-effort config for a rule authored before the form was parameterised.
 * Reads what it can off the legacy condition rows, and includes only the fields
 * that rule actually used, so editing an old rule opens a populated form.
 */
export function inferConfig(rule: RuleData): RuleConfig {
  const rows = rule.conditions;
  const zoneRow = rows.find((r) => r.type === "IN");
  const confRow = rows.find((r) => r.field.toLowerCase().includes("confidence"));
  const durRow = rows.find((r) => r.type === "FOR");
  const countRow = rows.find((r) => r.field.toLowerCase().includes("count"));

  const matchedZone = zoneRow
    ? ZONE_OPTIONS.find((z) => z.label.toLowerCase() === zoneRow.field.toLowerCase())
    : undefined;

  // Object class is always offered — legacy rules never recorded one, so it
  // opens empty for the operator to fill in.
  const fields: RuleParameterId[] = ["object_class"];
  if (confRow) fields.push("confidence");
  if (zoneRow) fields.push("zone");
  if (countRow) fields.push("count_threshold");
  if (durRow) fields.push("duration");

  return {
    fields,
    params: {
      objectClasses: [],
      confidence: confRow ? Number(confRow.value) || DEFAULT_TEMPLATE_PARAMS.confidence : DEFAULT_TEMPLATE_PARAMS.confidence,
      zoneId: matchedZone?.id ?? DEFAULT_TEMPLATE_PARAMS.zoneId,
      duration: durRow ? Number(durRow.value) || DEFAULT_TEMPLATE_PARAMS.duration : DEFAULT_TEMPLATE_PARAMS.duration,
      durationUnit: durRow?.unit.toLowerCase().startsWith("min") ? "minutes" : "seconds",
      countThreshold: countRow ? Number(countRow.value) || DEFAULT_TEMPLATE_PARAMS.countThreshold : DEFAULT_TEMPLATE_PARAMS.countThreshold,
    },
  };
}

/** Builds the payload the backend receives. Mirrors the Accel BE rule shape. */
export function buildPayload({
  config,
  name,
  severity,
  ruleId,
}: {
  config: RuleConfig;
  name: string;
  severity: RuleSeverity;
  ruleId: string;
}): GeneratedRulePayload {
  const p = config.params;
  const has = (f: RuleParameterId) => config.fields.includes(f);
  const template = resolveTemplate(config.fields);
  const label = name || template.name;

  const payload: GeneratedRulePayload = {
    ruleId,
    stepId: config.stepId ?? "—",
    name: label,
    severity,
    enabled: true,
    ruleTemplateId: template.id,
    detectionType: template.defaultDetectionType,
    typeLabel: label,
    trigger: {
      event: template.event,
      object: { type: "class", classes: has("object_class") ? p.objectClasses : [] },
    },
    conditions: [],
    actions: [{ type: RULE_ACTION }],
  };

  if (has("zone")) payload.location = { type: "zone", zoneId: p.zoneId };
  if (has("confidence")) {
    payload.conditions.push({ type: "confidence", operator: ">=", value: Number((p.confidence / 100).toFixed(2)) });
  }
  if (has("count_threshold")) {
    payload.conditions.push({ type: "count", operator: ">=", value: p.countThreshold });
  }
  if (has("duration")) {
    payload.duration = { operator: ">", value: p.duration, unit: p.durationUnit };
  }
  return payload;
}

/** Fields the operator must still fill in before the rule can be saved. */
export function missingParameters(config: RuleConfig): string[] {
  const missing: string[] = [];
  if (config.fields.includes("object_class") && config.params.objectClasses.length === 0) {
    missing.push("Pick at least one object class.");
  }
  return missing;
}
