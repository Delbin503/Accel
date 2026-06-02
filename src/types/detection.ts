export type Severity = "critical" | "medium" | "low";
export type EventStatus = "pending" | "escalated" | "dismissed";
export type DetectionType = "movement" | "unauth" | "loiter" | "compliance" | "tailgate" | "ppe";
export type FpReason =
  | "wrong-class"
  | "wrong-person"
  | "known-exemption"
  | "staged"
  | "threshold"
  | "other";

export interface DismissedEvent {
  event: DetectionEvent;
  dismissedAt: string;       // ISO datetime string
  dismissedAtDisplay: string; // "19 May 2026, 14:31"
  dismissedBy: string;
  reason: FpReason;
  notes: string;
  suppressionRule: boolean;
}

export type BBoxVariant = "default" | "person" | "vehicle";

export interface BBox {
  top: string;
  left: string;
  width: string;
  height: string;
  label: string;
  variant: BBoxVariant;
}

export interface DetectionEvent {
  id: string;
  severity: Severity;
  status: EventStatus;
  type: DetectionType;
  typeLabel: string;
  useCaseId: string;
  useCaseTitle: string;
  model: string;
  modelKey: string;
  /* Template-string summary format:
     [[text]] = orange monospace ref chip
     **text** = bold
     !!text!! = warning-colored anomaly text              */
  summary: string;
  vlmReasoning: string;
  site: string;
  siteDisplay: string;
  area: string;
  areaDisplay: string;
  camera: string;
  time: string;
  date: string;
  dateDisplay: string;
  confidence: number;
  precision: number;
  bboxes: BBox[];
  caseId?: string;
  isManual?: boolean;
  assetId?: string;
  personId?: string;
  vehicleId?: string;
  modelTrainedDate: string;
  modelTrainingSamples: string;
  modelMaP: string;
  syntheticPct: number;
}
