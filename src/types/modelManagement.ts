export type StepFileType = "onnx" | "json";

export interface ModelStep {
  id: string;
  order: number;
  label: string;
  actionLabel: string;
  fileType: StepFileType;
  fileName: string;
}

export interface ModelData {
  id: string;
  name: string;
  description: string;
  tags: string[];
  iconKey: string;
  steps: ModelStep[];
  sequenceIds: string[];
  attachedRuleIds: string[];
  createdAt: string;
  createdAtDisplay: string;
}
