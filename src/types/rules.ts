import type { RuleConfig } from "@/types/ruleTemplates";

export type RowType = "WHEN" | "IN" | "AND" | "OR" | "THEN" | "During" | "FOR";
export type RuleSeverity = "critical" | "medium" | "low";

export interface ConditionRow {
  id: string;
  type: RowType;
  field: string;
  operator: string;
  value: string;
  unit: string;
}

export interface RuleData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  /**
   * Display projection of `config` — the WHEN/IN/AND/FOR/THEN rows shown on
   * rule cards and in the plain-English summary. Recompiled whenever the rule
   * is saved from the builder.
   */
  conditions: ConditionRow[];
  /**
   * Parameters the rule was built from. Absent on rules authored before the
   * builder became parameterised.
   */
  config?: RuleConfig;
  severity: RuleSeverity;
  createdAt: string;
  createdAtDisplay: string;
  createdTimeDisplay: string;
}
