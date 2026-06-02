import type { RuleData, ConditionRow, RowType } from "@/types/rules";

function rc(id: string, type: RowType, field: string, operator = "", value = "", unit = ""): ConditionRow {
  return { id, type, field, operator, value, unit };
}

export const MOCK_RULES: RuleData[] = [
  {
    id: "Rul_001",
    name: "SOP Compliance Rule",
    description: "Triggers when SOP compliance checks fail during scheduled operations window.",
    tags: ["Object Detection", "Zone", "PPE", "Intrusion", "Behaviour", "Time-based", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "SOP Compliance Violation"),
      rc("r2", "IN", "Armoury-B"),
      rc("r3", "AND", "Confidence level", "more than", "80", "%"),
      rc("r4", "THEN", "Trigger Alert"),
      rc("r5", "During", "Always Active"),
    ],
    severity: "critical",
    createdAt: "2026-05-25T08:24:23",
    createdAtDisplay: "25 May 2026, 08:24",
    createdTimeDisplay: "08:24:23 AM",
  },
  {
    id: "Rul_002",
    name: "Helmet Detection Rule",
    description: "Detects personnel without required helmets in designated hazardous areas.",
    tags: ["PPE", "Zone", "Object Detection", "Intrusion", "Behaviour", "Time-based", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "Helmet Absence"),
      rc("r2", "IN", "Construction Zone A"),
      rc("r3", "AND", "Confidence level", "more than", "75", "%"),
      rc("r4", "THEN", "Trigger Alert"),
    ],
    severity: "critical",
    createdAt: "2026-05-25T08:24:23",
    createdAtDisplay: "25 May 2026, 08:24",
    createdTimeDisplay: "08:24:23 AM",
  },
  {
    id: "Rul_003",
    name: "Perimeter Intrusion",
    description: "Person enters restricted zone outside authorized operating hours.",
    tags: ["Intrusion", "Zone", "Object Detection", "Behaviour", "PPE", "Time-based", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "Person Detection"),
      rc("r2", "IN", "Restricted Perimeter"),
      rc("r3", "AND", "Confidence level", "more than", "85", "%"),
      rc("r4", "THEN", "Trigger Alert"),
      rc("r5", "During", "Outside Business Hours"),
    ],
    severity: "critical",
    createdAt: "2026-05-25T08:24:23",
    createdAtDisplay: "25 May 2026, 08:24",
    createdTimeDisplay: "08:24:23 AM",
  },
  {
    id: "Rul_004",
    name: "Muzzle Direction Violation",
    description: "Weapon pointed outside safe firing arc for a sustained period.",
    tags: ["Object Detection", "Zone", "Behaviour", "Intrusion", "PPE", "Time-based", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "Muzzle Direction Violation"),
      rc("r2", "IN", "Camp Area"),
      rc("r3", "AND", "Confidence level", "more than", "3", "%"),
      rc("r4", "OR", "Confidence level", "less than", "3", "%"),
      rc("r5", "THEN", "Trigger Alert"),
      rc("r6", "THEN", "Sound Alarm"),
      rc("r7", "During", "Always Active"),
      rc("r8", "FOR", "", "more than", "3", "Seconds"),
    ],
    severity: "critical",
    createdAt: "2026-05-24T14:11:07",
    createdAtDisplay: "24 May 2026, 14:11",
    createdTimeDisplay: "02:11:07 PM",
  },
  {
    id: "Rul_005",
    name: "Unattended Object",
    description: "Stationary object left unattended longer than the configured threshold.",
    tags: ["Object Detection", "Zone", "Behaviour", "Time-based", "Intrusion", "PPE", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "Object Detection"),
      rc("r2", "IN", "Loading Bay A"),
      rc("r3", "FOR", "", "more than", "30", "Seconds"),
      rc("r4", "THEN", "Log Event"),
    ],
    severity: "medium",
    createdAt: "2026-05-23T10:55:00",
    createdAtDisplay: "23 May 2026, 10:55",
    createdTimeDisplay: "10:55:00 AM",
  },
  {
    id: "Rul_006",
    name: "Crowd Density Alert",
    description: "Triggers when the number of persons in a zone exceeds safe capacity thresholds.",
    tags: ["Object Detection", "Zone", "Behaviour", "Intrusion", "PPE", "Time-based", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "Person Detection"),
      rc("r2", "IN", "Lobby Zone"),
      rc("r3", "AND", "Object count", "more than", "15", "persons"),
      rc("r4", "THEN", "Trigger Alert"),
    ],
    severity: "critical",
    createdAt: "2026-05-22T09:30:00",
    createdAtDisplay: "22 May 2026, 09:30",
    createdTimeDisplay: "09:30:00 AM",
  },
  {
    id: "Rul_007",
    name: "After-Hours Access",
    description: "Detects personnel access attempts outside permitted operating windows.",
    tags: ["Time-based", "Zone", "Intrusion", "Object Detection", "Behaviour", "PPE", "Low", "Medium", "Critical"],
    conditions: [
      rc("r1", "WHEN", "Person Detection"),
      rc("r2", "IN", "Pier 4 Storage-C"),
      rc("r3", "AND", "Confidence level", "more than", "80", "%"),
      rc("r4", "THEN", "Trigger Alert"),
      rc("r5", "During", "Outside Business Hours"),
    ],
    severity: "critical",
    createdAt: "2026-05-21T16:45:00",
    createdAtDisplay: "21 May 2026, 16:45",
    createdTimeDisplay: "04:45:00 PM",
  },
];

export const ALL_TAGS = [
  "Object Detection",
  "Zone",
  "PPE",
  "Intrusion",
  "Behaviour",
  "Time-based",
  "Low",
  "Medium",
  "High",
  "Critical",
];

export const DETECTION_TYPES = [
  "Person Detection",
  "Helmet Absence",
  "Muzzle Direction Violation",
  "SOP Compliance Violation",
  "Object Detection",
  "Vehicle Detection",
  "Crowd Detection",
  "Fire Detection",
];

export const ZONES_LIST = [
  "Armoury-B",
  "Pier 4 Storage-C",
  "Loading Bay A",
  "Camp Area",
  "Construction Zone A",
  "Restricted Perimeter",
  "Server Room 3",
  "Lobby Zone",
];

export const CONDITIONS_LIST = [
  "Confidence level",
  "Object count",
  "Dwell time",
  "Speed",
  "Distance from boundary",
];

export const ACTIONS_LIST = [
  "Trigger Alert",
  "Record Clip",
  "Snapshot",
  "Log Event",
  "Sound Alarm",
];

export const SCHEDULES_LIST = [
  "Always Active",
  "Business Hours",
  "Outside Business Hours",
  "Weekends Only",
  "Night Shift",
  "Custom Hours",
];

export const OPERATORS_LIST = ["more than", "less than", "at least", "at most", "equal to"];

export const UNITS_LIST = ["Seconds", "Minutes", "Hours", "%", "persons", "objects"];

export const TEMPLATES: {
  name: string;
  model: string;
  description: string;
  tags: string[];
  conditions: Omit<ConditionRow, "id">[];
  severity: "critical" | "medium" | "low";
}[] = [
  {
    name: "Muzzle Direction Violation",
    model: "Model_12",
    description: "Weapon pointed outside safe firing arc for a sustained period.",
    severity: "critical",
    tags: ["PPE", "Behaviour", "Zone", "Critical"],
    conditions: [
      { type: "WHEN", field: "Muzzle Direction Violation", operator: "", value: "", unit: "" },
      { type: "IN", field: "Camp Area", operator: "", value: "", unit: "" },
      { type: "AND", field: "Confidence level", operator: "more than", value: "80", unit: "%" },
      { type: "THEN", field: "Trigger Alert", operator: "", value: "", unit: "" },
      { type: "FOR", field: "", operator: "more than", value: "3", unit: "Seconds" },
    ],
  },
  {
    name: "Perimeter Intrusion",
    model: "Model_12",
    description: "Person enters restricted zone outside authorized hours.",
    severity: "critical",
    tags: ["Intrusion", "Zone", "Time-based", "Critical"],
    conditions: [
      { type: "WHEN", field: "Person Detection", operator: "", value: "", unit: "" },
      { type: "IN", field: "Restricted Perimeter", operator: "", value: "", unit: "" },
      { type: "AND", field: "Confidence level", operator: "more than", value: "85", unit: "%" },
      { type: "THEN", field: "Trigger Alert", operator: "", value: "", unit: "" },
      { type: "During", field: "Outside Business Hours", operator: "", value: "", unit: "" },
    ],
  },
  {
    name: "Unattended Object",
    model: "Model_12",
    description: "Stationary object left unattended longer than threshold.",
    severity: "medium",
    tags: ["Object Detection", "Behaviour", "Time-based", "Medium"],
    conditions: [
      { type: "WHEN", field: "Object Detection", operator: "", value: "", unit: "" },
      { type: "IN", field: "Loading Bay A", operator: "", value: "", unit: "" },
      { type: "FOR", field: "", operator: "more than", value: "30", unit: "Seconds" },
      { type: "THEN", field: "Log Event", operator: "", value: "", unit: "" },
    ],
  },
];
