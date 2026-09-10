import { ALL_FIELDS, DEFAULT_CLASS_PARAMS } from "@/mocks/ruleTemplates";
import type { ConditionRow, RuleData } from "@/types/rules";
import type { ClassParams, RuleConfig, RuleParameterId } from "@/types/ruleTemplates";

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

/**
 * Config for a rule authored before the form became class-based. Those rules
 * never recorded object classes, and parameters now hang off classes — so the
 * form opens empty and the operator picks the classes it watches.
 */
export function inferConfig(_rule: RuleData): RuleConfig {
  void _rule;
  return newConfig();
}
