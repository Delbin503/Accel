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
  conditions: ConditionRow[];
  severity: RuleSeverity;
  createdAt: string;
  createdAtDisplay: string;
  createdTimeDisplay: string;
}
