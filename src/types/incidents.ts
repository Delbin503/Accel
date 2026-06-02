import type { Severity } from "./detection";

export type CaseStatus = "open" | "in-review" | "action-taken" | "closed";

export type ActivityType =
  | "created"
  | "acknowledged"
  | "status"
  | "note"
  | "reassign"
  | "link"
  | "sla"
  | "edit";

export interface CaseActivity {
  id: string;
  type: ActivityType;
  timestamp: string;
  timestampDisplay: string;
  elapsed: string;
  title: string;
  description?: string;
}

export interface CaseAssignee {
  name: string;
  id: string;
}

export interface IncidentCase {
  id: string;
  title: string;
  severity: Severity;
  status: CaseStatus;
  site: string;
  siteDisplay: string;
  assignedTo: CaseAssignee;
  incidentIds: string[];
  notes: string;
  activity: CaseActivity[];
  createdAt: string;
  createdAtDisplay: string;
  updatedAt: string;
  updatedAtDisplay: string;
}
