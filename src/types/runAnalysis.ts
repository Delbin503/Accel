export type FlowStep = "select" | "upload" | "result";

export type RunStatus = "passed" | "failed" | "warning";

export type RunState = "completed" | "failed";

export type AnalysisVerdict = "approved" | "rejected" | "pending";

export interface RunFailure {
  reason: string;
  code: string;
  detail?: string;
}

export type StepResultStatus = "passed" | "failed";

export type LogEventLevel = "info" | "passed" | "failed" | "warning";

export interface VLMOption {
  id: string;
  name: string;
  params: string;
  speed: "fast" | "balanced" | "slow";
  description?: string;
}

export interface StepResult {
  stepId: string;
  label: string;
  modelLabel: string;
  status: StepResultStatus;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  level: LogEventLevel;
  title: string;
  detail?: string;
}

export interface FinalResultEntry {
  id: string;
  timestamp: string;
  status: StepResultStatus;
  title: string;
}

export interface TriggeredRuleSummary {
  id: string;
  ruleName: string;
  detectionType: string;
  confidence: "high" | "medium" | "low";
  count: number;
}

export interface AnalysisResult {
  stepsPassed: number;
  stepsTotal: number;
  rulesTriggered: number;
  rulesTotal: number;
  score: number;
  status: RunStatus;
  stepResults: StepResult[];
  activityLog: ActivityLogEntry[];
  finalResults: FinalResultEntry[];
  triggeredRules: TriggeredRuleSummary[];
  vlmReasoning: string;
  clipDurationSeconds: number;
}

/**
 * A run-level rollup across every model in the run. Deliberately NOT a
 * RunStatus: when models disagree there is no single pass/fail that is honest,
 * and averaging their scores produces a number that describes nothing.
 */
export type RunRollupStatus = "passed" | "mixed" | "failed";

/**
 * One model's execution inside a run. A run may carry 1-3 of these; each keeps
 * its own score, status and full AnalysisResult so nothing is merged away.
 */
export interface ModelRun {
  modelId: string;
  modelName: string;
  vlmId: string;
  vlmName: string;
  score: number;
  status: RunStatus;
  /** A model can crash mid-pipeline while its siblings complete. */
  runState: RunState;
  failure?: RunFailure;
  result: AnalysisResult;
}

/** A single finding lifted out of a model run, tagged with its source. */
export interface UnifiedFinding {
  id: string;
  modelId: string;
  modelName: string;
  status: StepResultStatus;
  title: string;
  timestamp: string;
}

export interface PastAnalysis {
  id: string;
  name: string;
  modelId: string;
  modelName: string;
  vlmId: string;
  vlmName: string;
  score: number;
  status: RunStatus;
  tags: string[];
  createdAt: string;
  createdAtDisplay: string;
  result: AnalysisResult;
  /** Whether the analysis pipeline completed or technically failed mid-run. */
  runState: RunState;
  /** Populated only when runState === "failed". */
  failure?: RunFailure;
  /** User decision after reviewing the result. */
  verdict: AnalysisVerdict;
  /** ISO timestamp recorded when verdict moves out of "pending". */
  verdictAt?: string;
  /** Display string for verdictAt. */
  verdictAtDisplay?: string;
  /** How long the analysis pipeline took (rough display, e.g. "32s"). */
  runtimeDisplay?: string;
  /** Display for completion timestamp (e.g. "25 May 2026, 08:24"). */
  completedAtDisplay?: string;
  /** Who started this run. */
  startedBy?: string;
  /**
   * Every model executed in this run. Optional for back-compat: legacy
   * single-model records omit it and fall back to the flat fields above.
   */
  modelRuns?: ModelRun[];
}
