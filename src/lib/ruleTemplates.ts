import { ALL_FIELDS, DEFAULT_CLASS_PARAMS, EVENT_TEMPLATES } from "@/mocks/ruleTemplates";
import type { ConditionRow, RuleData } from "@/types/rules";
import type {
  ClassParams,
  ConditionParamId,
  EventTemplate,
  RuleCondition,
  RuleConfig,
  RuleParameterId,
} from "@/types/ruleTemplates";

/* ── Config helpers ──────────────────────────────────────────────────────── */

/** A fresh config — callers mutate their own, never a shared default. */
export function newConfig(): RuleConfig {
  return { objectClasses: [], perClass: {} };
}

export function newClassParams(): ClassParams {
  return { ...DEFAULT_CLASS_PARAMS, fields: [...DEFAULT_CLASS_PARAMS.fields] };
}

/** Values for one class, falling back to the defaults if it has none yet. */
export function paramsFor(config: RuleConfig, cls: string): ClassParams {
  return config.perClass[cls] ?? DEFAULT_CLASS_PARAMS;
}

/** Parameters this class does not carry yet — what its `+` menu offers. */
export function availableFields(params: ClassParams): RuleParameterId[] {
  return ALL_FIELDS.filter((f) => !params.fields.includes(f));
}

/** Keeps a class's parameters in display order after one is added. */
export function withField(params: ClassParams, field: RuleParameterId): ClassParams {
  return { ...params, fields: ALL_FIELDS.filter((f) => f === field || params.fields.includes(f)) };
}

export function withoutField(params: ClassParams, field: RuleParameterId): ClassParams {
  return { ...params, fields: params.fields.filter((f) => f !== field) };
}

/**
 * Compiles a rule config into the WHEN/IN/AND/FOR/THEN rows the rule list and
 * model cards still render. The config stays the source of truth; these rows
 * are the display projection of it.
 *
 * Per-class values collapse to a range when the classes disagree — the rows are
 * a summary, not the authoring surface.
 */
export function configToRows(config: RuleConfig, name: string): ConditionRow[] {
  const classes = config.objectClasses;
  const rows: ConditionRow[] = [];
  let n = 0;
  const row = (r: Omit<ConditionRow, "id">): ConditionRow => ({ id: `cfg-${++n}`, ...r });

  /** Classes carrying a given parameter. */
  const carrying = (f: RuleParameterId) => classes.filter((c) => paramsFor(config, c).fields.includes(f));

  /** "80" when every carrying class agrees, "70–90" when they don't. */
  function span(f: RuleParameterId, pick: (p: ClassParams) => number): string {
    const values = carrying(f).map((c) => pick(paramsFor(config, c)));
    if (values.length === 0) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    return min === max ? String(min) : `${min}–${max}`;
  }

  rows.push(
    row({
      type: "WHEN",
      field: classes.length > 0 ? classes.join(", ") : name || "Detection",
      operator: "",
      value: "",
      unit: "",
    })
  );

  if (carrying("confidence").length > 0) {
    rows.push(row({ type: "AND", field: "Confidence level", operator: "at least", value: span("confidence", (p) => p.confidence), unit: "%" }));
  }
  if (carrying("count_threshold").length > 0) {
    rows.push(row({ type: "AND", field: "Object count", operator: "at least", value: span("count_threshold", (p) => p.countThreshold), unit: "objects" }));
  }
  const durationClasses = carrying("duration");
  if (durationClasses.length > 0) {
    const anyMinutes = durationClasses.some((c) => paramsFor(config, c).durationUnit === "minutes");
    rows.push(
      row({
        type: "FOR",
        field: "",
        operator: "more than",
        value: span("duration", (p) => p.duration),
        unit: anyMinutes ? "Minutes" : "Seconds",
      })
    );
  }
  rows.push(row({ type: "THEN", field: "Trigger Alert", operator: "", value: "", unit: "" }));
  return rows;
}

/** First number in a row value — "80" and "70–90" both yield 80. */
function firstNumber(value: string): number | null {
  const m = value.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

/**
 * Config for a rule authored before the builder became condition-based. Those
 * rules only stored the WHEN/IN/AND/FOR/THEN display rows, so we read the zone,
 * confidence and duration back out of them and seed a single condition — the
 * form then opens populated instead of empty.
 *
 * Object classes are the one thing those rules never recorded, so that field
 * starts empty and the operator picks it.
 */
export function inferConfig(rule: RuleData): RuleConfig {
  const rows = rule.conditions ?? [];
  const zone = rows.find((r) => r.type === "IN")?.field?.trim() || undefined;
  const confidenceRow = rows.find((r) => /confidence/i.test(r.field));
  const durationRow = rows.find((r) => r.type === "FOR");

  const template =
    templateFor(zone ? "object_enters_zone" : "object_detected") ?? EVENT_TEMPLATES[0];
  const seeded = newCondition(template);

  const confidence = confidenceRow ? firstNumber(confidenceRow.value) : null;
  const duration = durationRow ? firstNumber(durationRow.value) : null;

  const condition: RuleCondition = {
    ...seeded,
    confidence: confidence ?? seeded.confidence,
    zone,
    duration: duration ?? seeded.duration,
    durationUnit: /min/i.test(durationRow?.unit ?? "") ? "minutes" : seeded.durationUnit,
    parameters: Array.from(
      new Set<ConditionParamId>([
        ...seeded.parameters,
        ...(zone ? (["zone"] as ConditionParamId[]) : []),
        ...(duration !== null ? (["duration"] as ConditionParamId[]) : []),
      ])
    ),
  };

  return { ...newConfig(), conditions: [condition] };
}

/* ── Conditions ──────────────────────────────────────────────────────────── */

let conditionSeq = 0;

/** A condition seeded from a template — its declared parameters, default values. */
export function newCondition(template: EventTemplate): RuleCondition {
  return {
    id: `cond-${++conditionSeq}-${Math.random().toString(36).slice(2, 6)}`,
    templateId: template.id,
    // Object class and confidence are always carried, whatever the template declares.
    parameters: Array.from(new Set<ConditionParamId>(["object_class", "confidence", ...template.parameters])),
    objectClasses: [],
    confidence: DEFAULT_CLASS_PARAMS.confidence,
    zone: undefined,
    duration: DEFAULT_CLASS_PARAMS.duration,
    durationUnit: DEFAULT_CLASS_PARAMS.durationUnit,
    countThreshold: DEFAULT_CLASS_PARAMS.countThreshold,
  };
}

export function templateFor(templateId: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Projects the authored conditions back onto `objectClasses` / `perClass`, which
 * the rule cards, the WHEN/IN/AND summary and Model Management still read.
 * A class appearing in several conditions takes the strictest values.
 */
export function configFromConditions(config: RuleConfig): RuleConfig {
  const conditions = config.conditions ?? [];
  if (conditions.length === 0) return config;

  const objectClasses: string[] = [];
  const perClass: Record<string, ClassParams> = {};

  for (const c of conditions) {
    for (const cls of c.objectClasses) {
      if (!objectClasses.includes(cls)) objectClasses.push(cls);
      const prev = perClass[cls];
      const fields = new Set<RuleParameterId>(prev?.fields ?? []);
      if (c.parameters.includes("confidence")) fields.add("confidence");
      if (c.parameters.includes("duration")) fields.add("duration");
      if (c.parameters.includes("count_threshold")) fields.add("count_threshold");
      perClass[cls] = {
        ...newClassParams(),
        ...prev,
        fields: ALL_FIELDS.filter((f) => fields.has(f)),
        // Strictest wins: highest confidence, longest dwell, lowest count to trip.
        confidence: Math.max(prev?.confidence ?? 0, c.confidence),
        duration: Math.max(prev?.duration ?? 0, c.duration),
        durationUnit: c.durationUnit,
        countThreshold: Math.min(prev?.countThreshold ?? Number.MAX_SAFE_INTEGER, c.countThreshold),
      };
    }
  }
  return { ...config, objectClasses, perClass };
}
