import type {
  VLMOption,
  PastAnalysis,
  ModelRun,
  RunFailure,
  ActivityLogEntry,
  FinalResultEntry,
  StepResult,
  TriggeredRuleSummary,
} from "@/types/runAnalysis";

export const MOCK_VLMS: VLMOption[] = [
  { id: "vlm_qwen3vl",  name: "Qwen3-VL",      params: "256K ctx",    speed: "balanced", description: "Long surveillance-style footage; native long context, second-level indexing" },
  { id: "vlm_qwen25vl", name: "Qwen2.5-VL",    params: "7B Params",   speed: "fast",     description: "Open-source video support; dynamic resolution, self-hostable" },
  { id: "vlm_gemini25", name: "Gemini 2.5 Pro", params: "Proprietary", speed: "balanced", description: "Strong video understanding; zero hosting effort" },
  { id: "vlm_tarsier2", name: "Tarsier2",      params: "7B Params",   speed: "balanced", description: "Purpose-built long-video QA for CCTV/surveillance footage" },
];

const SAMPLE_LOG: ActivityLogEntry[] = [
  { id: "lg1",  timestamp: "00:00", level: "info",   title: "Video loaded — site_inspection_2026-05-21.mp4", detail: "Duration 32:31 · 1080p" },
  { id: "lg2",  timestamp: "00:02", level: "info",   title: "Model — SOP Compliance",                          detail: "4 steps · 2 rules" },
  { id: "lg3",  timestamp: "00:04", level: "info",   title: "Scanning frames…",                                 detail: "30 fps · 1.2k frames" },
  { id: "lg4",  timestamp: "00:08", level: "passed", title: "Step 1 — Chin strap fastened",                     detail: "Confidence 92%" },
  { id: "lg5",  timestamp: "00:14", level: "passed", title: "Step 2 — Chin strap firmly fastened",              detail: "Confidence 88%" },
  { id: "lg6",  timestamp: "00:18", level: "failed", title: "Step 3 — Helmet not detected",                     detail: "Worker HF-02 · Confidence 76%" },
  { id: "lg7",  timestamp: "00:21", level: "failed", title: "Rule — Helmet Detection triggered",                 detail: "PPE compliance violation" },
  { id: "lg8",  timestamp: "00:24", level: "passed", title: "Step 4 — Strap inspection clean",                   detail: "Confidence 81%" },
  { id: "lg9",  timestamp: "00:26", level: "failed", title: "Step 5 — Bolt group not verified",                  detail: "Confidence below threshold" },
  { id: "lg10", timestamp: "00:30", level: "warning", title: "Low light detected — confidence reduced",           detail: "Zones B / C" },
  { id: "lg11", timestamp: "00:32", level: "info",   title: "Analysis complete",                                  detail: "Total runtime 32 s" },
];

const SAMPLE_FINAL: FinalResultEntry[] = [
  { id: "fr1", timestamp: "00:08", status: "passed", title: "Step 1 — Chin strap fastened" },
  { id: "fr2", timestamp: "00:14", status: "passed", title: "Step 2 — Chin strap firmly fastened" },
  { id: "fr3", timestamp: "00:18", status: "failed", title: "Step 3 — Helmet not detected" },
  { id: "fr4", timestamp: "00:21", status: "failed", title: "Rule — Helmet Detection triggered" },
  { id: "fr5", timestamp: "00:24", status: "passed", title: "Step 4 — Strap inspection clean" },
  { id: "fr6", timestamp: "00:26", status: "failed", title: "Step 5 — Bolt group not verified" },
];

const SAMPLE_STEPS: StepResult[] = [
  { stepId: "s1", label: "Chin strap properly fastened",  modelLabel: "Model_12", status: "passed" },
  { stepId: "s2", label: "Chin strap properly fastened",  modelLabel: "Model_12", status: "passed" },
  { stepId: "s3", label: "Chin strap properly fastened",  modelLabel: "Model_12", status: "failed" },
  { stepId: "s4", label: "Chin strap properly fastened",  modelLabel: "Model_12", status: "passed" },
  { stepId: "s5", label: "Bolt group properly verified",  modelLabel: "Model_12", status: "failed" },
];

const SAMPLE_TRIGGERED: TriggeredRuleSummary[] = [
  { id: "tr1", ruleName: "High Confidence Alert Rule",  detectionType: "Object Detection",   confidence: "high",   count: 5 },
  { id: "tr2", ruleName: "Zone Boundary Breach Rule",   detectionType: "Object Detection",   confidence: "high",   count: 12 },
  { id: "tr3", ruleName: "Zone Boundary Breach Rule",   detectionType: "Object Detection",   confidence: "medium", count: 3 },
  { id: "tr4", ruleName: "Unlisted Detection Rule",     detectionType: "Object Detection",   confidence: "low",    count: 1 },
];

const SAMPLE_VLM_REASONING =
  "Scene: The video footage depicts a worksite environment with two personnel visible in the scene. At 00:18, worker HF-02 is detected as standing figures with clearly identifiable head regions. The head region bounding boxes were estimated as [212.45, 280.10] and [380.60, 445.20] respectively. At 00:18 the model identified that HF-02 is not wearing any approved head protection — no hard hat, bump cap or similar helmet variant is present. This is flagged as a PPE compliance violation. HF-02, however, is confirmed to be wearing a hard hat at 00:26 with high confidence (96%). Overall, one out of two workers is non-compliant with the helmet policy at this site.";

function makeResult(stepsPassed: number, rulesTriggered: number, score: number, status: PastAnalysis["status"]): PastAnalysis["result"] {
  return {
    stepsPassed,
    stepsTotal: 5,
    rulesTriggered,
    rulesTotal: 4,
    score,
    status,
    stepResults: SAMPLE_STEPS,
    activityLog: SAMPLE_LOG,
    finalResults: SAMPLE_FINAL,
    triggeredRules: SAMPLE_TRIGGERED,
    vlmReasoning: SAMPLE_VLM_REASONING,
    clipDurationSeconds: 8,
  };
}

type Seed = Omit<PastAnalysis, "runState" | "verdict" | "runtimeDisplay" | "completedAtDisplay" | "startedBy">;

function withDefaults(seed: Seed, overrides: Partial<PastAnalysis> = {}): PastAnalysis {
  return {
    ...seed,
    runState: "completed",
    verdict: "pending",
    runtimeDisplay: "32s",
    completedAtDisplay: seed.createdAtDisplay,
    startedBy: "Delbin Arkar",
    ...overrides,
  };
}

/* ── Per-model findings ───────────────────────────────────────────────────── */

const STEP_LIBRARY: { title: string; timestamp: string }[] = [
  { title: "Step 1 — Chin strap fastened",         timestamp: "00:08" },
  { title: "Step 2 — Chin strap firmly fastened",  timestamp: "00:14" },
  { title: "Step 3 — Helmet present",              timestamp: "00:18" },
  { title: "Step 4 — Strap inspection clean",      timestamp: "00:24" },
  { title: "Step 5 — Bolt group verified",         timestamp: "00:26" },
  { title: "Step 6 — Muzzle direction safe",       timestamp: "00:29" },
];

const RULE_LIBRARY: { title: string; timestamp: string }[] = [
  { title: "Rule — Helmet Detection triggered",      timestamp: "00:21" },
  { title: "Rule — Zone Boundary Breach triggered",  timestamp: "00:23" },
  { title: "Rule — Unlisted Detection triggered",    timestamp: "00:28" },
];

/**
 * Findings for one model. The first `round(steps × passRate)` steps pass and
 * the rest fail, so two models given different pass rates disagree about the
 * *same named step* — which is the comparison the unified findings panel exists
 * to show. Previously every model in a run reported an identical list, so the
 * panel could only ever repeat itself.
 *
 * Deterministic on purpose: a fixture must render the same on every load.
 */
export function buildFindings(steps: number, rules: number, passRate: number): FinalResultEntry[] {
  const n = Math.max(1, Math.min(steps, STEP_LIBRARY.length));
  const passCount = Math.max(0, Math.min(n, Math.round(n * passRate)));

  const stepRows: FinalResultEntry[] = STEP_LIBRARY.slice(0, n).map((s, i) => ({
    id: `fr-s${i + 1}`,
    timestamp: s.timestamp,
    status: i < passCount ? "passed" : "failed",
    title: s.title,
  }));

  // A rule only trips when a step it guards failed, so a clean model reports none.
  const ruleCount = Math.max(0, Math.min(rules, n - passCount, RULE_LIBRARY.length));
  const ruleRows: FinalResultEntry[] = RULE_LIBRARY.slice(0, ruleCount).map((r, i) => ({
    id: `fr-r${i + 1}`,
    timestamp: r.timestamp,
    status: "failed",
    title: r.title,
  }));

  return [...stepRows, ...ruleRows];
}

/* ── Multi-model fixtures ─────────────────────────────────────────────────── */

const VLM = { id: "vlm_qwen3vl", name: "Qwen3-VL" };

/** One model's execution. `crash` skips the result and marks the model failed. */
function makeModelRun(
  modelId: string,
  modelName: string,
  opts: { stepsPassed: number; rules: number; score: number; status: PastAnalysis["status"] } | { crash: RunFailure }
): ModelRun {
  const base = { modelId, modelName, vlmId: VLM.id, vlmName: VLM.name };
  if ("crash" in opts) {
    return {
      ...base,
      score: 0,
      status: "failed",
      runState: "failed",
      failure: opts.crash,
      // A crashed model still carries an empty-shaped result so every consumer
      // can read `.result` without a null check.
      result: makeResult(0, 0, 0, "failed"),
    };
  }
  const STEPS = 5;
  return {
    ...base,
    score: opts.score,
    status: opts.status,
    runState: "completed",
    result: {
      ...makeResult(opts.stepsPassed, opts.rules, opts.score, opts.status),
      // Findings track this model's own pass rate, so siblings disagree.
      finalResults: buildFindings(STEPS, opts.rules, opts.stepsPassed / STEPS),
    },
  };
}

/** Build the run-level record the way handleStartAnalysis does. */
function multiRun(
  id: string,
  name: string,
  createdAtDisplay: string,
  runs: ModelRun[],
  overrides: Partial<PastAnalysis> = {}
): PastAnalysis {
  const passed = runs.filter((r) => r.runState === "completed" && r.status === "passed").length;
  const rollup = passed === runs.length ? "passed" : passed === 0 ? "failed" : "mixed";
  const allCrashed = runs.every((r) => r.runState === "failed");
  const lead = runs[0];
  return {
    id,
    name,
    modelId: lead.modelId,
    modelName: `${runs.length} models`,
    vlmId: VLM.id,
    vlmName: VLM.name,
    score: lead.score,
    status: rollup === "passed" ? "passed" : rollup === "failed" ? "failed" : "warning",
    tags: allCrashed
      ? ["Failed", "Script Error"]
      : [rollup === "passed" ? "Passed" : rollup === "failed" ? "Failed" : "Mixed", "Tested"],
    createdAt: "2026-05-24T16:00:00",
    createdAtDisplay,
    result: lead.result,
    runState: allCrashed ? "failed" : "completed",
    failure: allCrashed ? lead.failure : undefined,
    verdict: "pending",
    runtimeDisplay: allCrashed ? "—" : `${28 + runs.length * 6}s`,
    completedAtDisplay: createdAtDisplay,
    startedBy: "Delbin Arkar",
    modelRuns: runs,
    ...overrides,
  };
}

const MULTI_MODEL_ANALYSES: PastAnalysis[] = [
  // All three agree — the clean case.
  multiRun("ANY_008", "Bay 3 PPE Sweep — 3 model comparison", "24 May 2026, 16:40", [
    makeModelRun("Mdl_001", "SOP Compliance",           { stepsPassed: 5, rules: 1, score: 94, status: "passed" }),
    makeModelRun("Mdl_003", "Helmet Detection V1",      { stepsPassed: 5, rules: 2, score: 89, status: "passed" }),
    makeModelRun("Mdl_002", "Muzzle Detection Protocol", { stepsPassed: 4, rules: 1, score: 82, status: "passed" }),
  ], { verdict: "approved", verdictAt: "2026-05-24T17:02:00", verdictAtDisplay: "24 May 2026, 17:02" }),

  // Models disagree — the case RunRollupStatus("mixed") exists for.
  multiRun("ANY_009", "Loading Dock Helmet Check — 3 models", "24 May 2026, 15:12", [
    makeModelRun("Mdl_003", "Helmet Detection V1",      { stepsPassed: 5, rules: 1, score: 91, status: "passed" }),
    makeModelRun("Mdl_001", "SOP Compliance",           { stepsPassed: 2, rules: 4, score: 54, status: "failed" }),
    makeModelRun("Mdl_002", "Muzzle Detection Protocol", { stepsPassed: 3, rules: 3, score: 71, status: "warning" }),
  ]),

  // One model dies mid-pipeline, the other completes — run stays readable.
  multiRun("ANY_010", "Gate C Compliance — partial run", "24 May 2026, 13:48", [
    makeModelRun("Mdl_001", "SOP Compliance", { stepsPassed: 4, rules: 2, score: 86, status: "passed" }),
    makeModelRun("Mdl_002", "Muzzle Detection Protocol", {
      crash: {
        code: "VLM_TIMEOUT",
        reason: "VLM inference exceeded the 2× footage duration SLA",
        detail: "Qwen3-VL stopped responding 41s into this model's pass. Its sibling completed, so the run is still usable.",
      },
    }),
  ]),

  // Every model crashed — the only case that fails the run outright.
  multiRun("ANY_011", "Perimeter Sweep — pipeline error", "24 May 2026, 11:05", [
    makeModelRun("Mdl_001", "SOP Compliance", {
      crash: { code: "VLM_UNAVAILABLE", reason: "Selected VLM is currently unreachable", detail: "The VLM service did not respond within the connection timeout." },
    }),
    makeModelRun("Mdl_003", "Helmet Detection V1", {
      crash: { code: "VLM_UNAVAILABLE", reason: "Selected VLM is currently unreachable", detail: "The VLM service did not respond within the connection timeout." },
    }),
  ]),
];

export const MOCK_PAST_ANALYSES: PastAnalysis[] = [
  withDefaults({ id: "ANY_001", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_001", modelName: "SOP Compliance",         vlmId: "vlm_002", vlmName: "MiniCPM-V",  score: 88, status: "passed",  tags: ["Passed", "Tested"],   createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(3, 2, 88, "passed") },
    { verdict: "approved", verdictAt: "2026-05-25T09:01:00", verdictAtDisplay: "25 May 2026, 09:01" }),
  withDefaults({ id: "ANY_002", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_003", modelName: "Helmet Detection V1",    vlmId: "vlm_001", vlmName: "LLaVA-1.6",  score: 65, status: "failed",  tags: ["Failed", "Tested"],   createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(2, 4, 65, "failed") },
    { verdict: "rejected", verdictAt: "2026-05-25T08:35:00", verdictAtDisplay: "25 May 2026, 08:35" }),
  withDefaults({ id: "ANY_003", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_001", modelName: "SOP Compliance",         vlmId: "vlm_002", vlmName: "MiniCPM-V",  score: 43, status: "failed",  tags: ["Failed", "Tested"],   createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(1, 4, 43, "failed") }),
  withDefaults({ id: "ANY_004", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_001", modelName: "SOP Compliance",         vlmId: "vlm_004", vlmName: "InternVL2", score: 78, status: "warning", tags: ["Warning", "Tested"],  createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(3, 3, 78, "warning") },
    { runState: "failed", failure: { code: "VLM_TIMEOUT", reason: "VLM inference exceeded the 2× footage duration SLA", detail: "InternVL2 was unresponsive after 64s. Try a faster model or shorter clip." } }),
  withDefaults({ id: "ANY_005", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_001", modelName: "SOP Compliance",         vlmId: "vlm_002", vlmName: "MiniCPM-V",  score: 75, status: "passed",  tags: ["Passed", "Tested"],   createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(4, 2, 75, "passed") }),
  withDefaults({ id: "ANY_006", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_003", modelName: "Helmet Detection V1",    vlmId: "vlm_003", vlmName: "Qwen2-VL",  score: 78, status: "warning", tags: ["Warning", "Tested"],  createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(3, 3, 78, "warning") }),
  withDefaults({ id: "ANY_007", name: "Cargo Helmet Detection Analysis", modelId: "Mdl_001", modelName: "SOP Compliance",         vlmId: "vlm_002", vlmName: "MiniCPM-V",  score: 88, status: "passed",  tags: ["Passed", "Tested"],   createdAt: "2026-05-25T08:24:00", createdAtDisplay: "25 May 2026, 08:24", result: makeResult(4, 2, 88, "passed") },
    { verdict: "approved", verdictAt: "2026-05-25T09:14:00", verdictAtDisplay: "25 May 2026, 09:14" }),

  /* ── Multi-model runs ──────────────────────────────────────────────────────
     Without these, the only way to reach the multi-model result view is to
     push a fresh run through the whole flow on every reload — which leaves the
     history rows, the model/VLM filters and the rollup states untestable. The
     four below cover the rollup matrix (passed / mixed / failed) plus the
     crash-isolation case: one model dying mid-pipeline while its siblings
     complete, which is still a readable run.

     Flat fields mirror what handleStartAnalysis writes for a real multi-model
     run — "N models" as the name, the lead model's score and result, the
     rollup mapped onto RunStatus — so a fixture and a live run are
     indistinguishable to every existing table and filter. ─────────────────── */
  ...MULTI_MODEL_ANALYSES,
];
