import type {
  VLMOption,
  PastAnalysis,
  ActivityLogEntry,
  FinalResultEntry,
  StepResult,
  TriggeredRuleSummary,
} from "@/types/runAnalysis";

export const MOCK_VLMS: VLMOption[] = [
  { id: "vlm_001", name: "LLaVA-1.6",   params: "13B Params",  speed: "fast",       description: "Balanced multimodal reasoning" },
  { id: "vlm_002", name: "MiniCPM-V",   params: "8B Params",   speed: "fast",       description: "Optimised for surveillance footage" },
  { id: "vlm_003", name: "Qwen2-VL",    params: "7B Params",   speed: "fast",       description: "Strong at object grounding" },
  { id: "vlm_004", name: "InternVL2",   params: "26B Params",  speed: "balanced",   description: "High-fidelity scene description" },
  { id: "vlm_005", name: "CogVLM2",     params: "19B Params",  speed: "balanced",   description: "Long-form reasoning" },
  { id: "vlm_006", name: "Phi-3-Vision", params: "4B Params",  speed: "fast",       description: "Lightweight edge model" },
  { id: "vlm_007", name: "GPT-4o",      params: "—",           speed: "slow",       description: "Frontier accuracy, slower" },
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
];
