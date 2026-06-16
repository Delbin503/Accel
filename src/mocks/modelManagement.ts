import type { ModelData, ModelStep } from "@/types/modelManagement";

function ms(
  id: string,
  order: number,
  label: string,
  actionLabel: string,
  modelFile: string,
  manifestFile: string
): ModelStep {
  return { id, order, label, actionLabel, modelFile, manifestFile };
}

export const MOCK_MODELS: ModelData[] = [
  {
    id: "Mdl_001",
    name: "SOP Compliance",
    description: "Sequential procedure verification for armoury and restricted zone compliance checks.",
    tags: ["Object Detection", "Zone", "PPE", "Intrusion", "Behaviour"],
    iconKey: "shield",
    steps: [
      ms("s1", 1, "Model_12", "Ensure unit strap is securely fastened",        "unit_strap_check.onnx", "unit_strap_check.manifest.json"),
      ms("s2", 2, "Model_12", "Check that chin strap is firmly fastened",       "chin_strap_verify.onnx", "chin_strap_verify.manifest.json"),
      ms("s3", 3, "Model_12", "Make sure bolt group is correctly functioning",  "bolt_group_verify.pt",   "bolt_group_verify.manifest.json"),
      ms("s4", 4, "Model_12", "Inspect unit strap for secure fastening",        "strap_inspect.onnx",     "strap_inspect.manifest.json"),
      ms("s5", 5, "Model_12", "Verify unit group is tightly secured",           "group_verify.onnx",      "group_verify.manifest.json"),
    ],
    sequenceIds: ["s1", "s2", "s3", "s4", "s5"],
    attachedRuleIds: ["Rul_001", "Rul_002"],
    // Shape (a): multiple discrete rules extracted from the model file.
    extractedRules: [
      { id: "ext-001", name: "Helmet present", description: "Worker must be wearing an approved helmet in the zone.", tags: ["PPE", "Object Detection"], conditions: ["class = helmet", "confidence > 85%"] },
      { id: "ext-002", name: "Chin strap fastened", description: "Helmet chin strap must be fastened.", tags: ["PPE"], conditions: ["class = chin_strap", "state = fastened", "confidence > 80%"] },
      { id: "ext-003", name: "Bolt group seated", description: "Bolt group must be seated and closed before handling.", tags: ["Behaviour"], conditions: ["class = bolt_group", "state = closed"] },
    ],
    modelFile: "sop_compliance.onnx",
    manifestFile: "sop_compliance.manifest.json",
    createdAt: "2026-05-20T09:00:00",
    createdAtDisplay: "20 May 2026, 09:00",
  },
  {
    id: "Mdl_002",
    name: "Muzzle Detection Protocol",
    description: "Sequential procedure verification for weapon direction and muzzle safety monitoring.",
    tags: ["Object Detection", "Zone", "PPE", "Intrusion", "Behaviour"],
    iconKey: "crosshair",
    steps: [],
    sequenceIds: [],
    attachedRuleIds: ["Rul_003", "Rul_004"],
    // Shape (b): a single rule carrying a large block of conditions.
    extractedRules: [
      {
        id: "ext-010",
        name: "Muzzle safety policy",
        description: "Weapon muzzle must stay within safe direction limits and away from people.",
        tags: ["Object Detection", "Behaviour", "Safety"],
        conditions: [
          "class = weapon",
          "muzzle_angle between -15° and 15°",
          "not pointing at class = person",
          "distance_to_person > 1.5m",
          "trigger_discipline = true",
          "confidence > 90%",
          "dwell > 2s",
          "zone = handling_bay",
        ],
      },
    ],
    modelFile: "muzzle_protocol.pt",
    manifestFile: "muzzle_protocol.manifest.json",
    createdAt: "2026-05-18T14:30:00",
    createdAtDisplay: "18 May 2026, 14:30",
  },
  {
    id: "Mdl_003",
    name: "Helmet Detection V1",
    description: "Sequential procedure verification for PPE helmet compliance in construction zones.",
    tags: [],
    iconKey: "eye",
    steps: [],
    sequenceIds: [],
    attachedRuleIds: [],
    extractedRules: [],
    createdAt: "2026-05-15T11:00:00",
    createdAtDisplay: "15 May 2026, 11:00",
  },
];

export const MODEL_TAGS = [
  "Object Detection",
  "Zone",
  "PPE",
  "Intrusion",
  "Behaviour",
  "Time-based",
  "Safety",
  "Compliance",
];
