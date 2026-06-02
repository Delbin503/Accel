/* Deployment types — mirrors PRD § 4.6 (Deployment row) */

export type DeploymentStatus =
  | "active"
  | "paused"
  | "pending-camera"
  | "stopped"
  | "failed";

export interface DeploymentData {
  id: string;
  modelId: string;
  modelName: string;
  cameraId: string;
  cameraName: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  status: DeploymentStatus;
  deployedBy: string;
  deployedAt: string;
  deployedAtDisplay: string;
  /** ID of the RunAnalysis that approved this deployment. */
  lastValidationRunId: string | null;
  stoppedAt: string | null;
  stoppedAtDisplay: string | null;
  /** Count of DetectionEvents this deployment has produced (display only). */
  eventCount: number;
  /** Optional failure reason when status === "failed". */
  failureReason?: string;
}

/** Counts shown on Site / Area cards in the wizard. */
export interface SiteSummary {
  siteId: string;
  siteName: string;
  status: "online" | "offline";
  areaCount: number;
  cameraCount: number;
  deployedCount: number;
}

export interface AreaSummary {
  areaId: string;
  areaName: string;
  siteId: string;
  status: "online" | "offline";
  cameraCount: number;
  deployedCount: number;
}
