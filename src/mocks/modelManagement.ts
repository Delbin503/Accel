import type { ModelData, ModelStep } from "@/types/modelManagement";

function ms(
  id: string,
  order: number,
  label: string,
  actionLabel: string,
  fileType: "onnx" | "json",
  fileName: string
): ModelStep {
  return { id, order, label, actionLabel, fileType, fileName };
}

export const MOCK_MODELS: ModelData[] = [
  {
    id: "Mdl_001",
    name: "SOP Compliance",
    description: "Sequential procedure verification for armoury and restricted zone compliance checks.",
    tags: ["Object Detection", "Zone", "PPE", "Intrusion", "Behaviour"],
    iconKey: "shield",
    steps: [
      ms("s1", 1, "Model_12", "Ensure unit strap is securely fastened",        "onnx", "unit_strap_check.onnx"),
      ms("s2", 2, "Model_12", "Check that chin strap is firmly fastened",       "onnx", "chin_strap_verify.onnx"),
      ms("s3", 3, "Model_12", "Make sure bolt group is correctly functioning",  "json", "bolt_group_verify.json"),
      ms("s4", 4, "Model_12", "Inspect unit strap for secure fastening",        "onnx", "strap_inspect.onnx"),
      ms("s5", 5, "Model_12", "Verify unit group is tightly secured",           "onnx", "group_verify.onnx"),
    ],
    sequenceIds: ["s1", "s2", "s3", "s4", "s5"],
    attachedRuleIds: ["Rul_001", "Rul_002"],
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
