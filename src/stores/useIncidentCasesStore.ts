import { create } from "zustand";
import type { IncidentCase, CaseStatus, CaseAssignee, CaseActivity, ActivityType } from "@/types/incidents";
import type { Severity } from "@/types/detection";
import { MOCK_CASES } from "@/mocks/incidentCases";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

let _counter = 143;
let _actCounter = 9000;

function nextCaseId() {
  return `CASE-2026-${String(_counter++).padStart(4, "0")}`;
}

function nextActId() {
  return `act-dyn-${_actCounter++}`;
}

function nowDisplay() {
  const d = new Date();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function elapsedSince(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "0m";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return remHrs > 0 ? `${days}d ${remHrs}h` : `${days}d`;
}

function makeActivity(
  type: ActivityType,
  title: string,
  description: string,
  createdAt: string
): CaseActivity {
  return {
    id: nextActId(),
    type,
    timestamp: new Date().toISOString(),
    timestampDisplay: nowDisplay(),
    elapsed: elapsedSince(createdAt),
    title,
    description,
  };
}

const STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  "in-review": "In Review",
  "action-taken": "Action Taken",
  closed: "Closed",
};

/* ─── Store ──────────────────────────────────────────────────────────────── */

interface CreateCaseParams {
  title: string;
  severity: Severity;
  site: string;
  siteDisplay: string;
  assignedTo: CaseAssignee;
  incidentIds: string[];
  notes: string;
}

interface EditCaseParams {
  title: string;
  severity: Severity;
  notes: string;
}

interface IncidentCasesState {
  cases: IncidentCase[];
  createCase: (params: CreateCaseParams) => string;
  updateStatus: (caseId: string, status: CaseStatus) => void;
  reassign: (caseId: string, assignedTo: CaseAssignee) => void;
  linkEvents: (caseId: string, eventIds: string[]) => void;
  editCase: (caseId: string, params: EditCaseParams) => void;
  deleteCase: (caseId: string) => void;
}

export const useIncidentCasesStore = create<IncidentCasesState>((set) => ({
  cases: MOCK_CASES,

  createCase: (params) => {
    const id = nextCaseId();
    const now = new Date().toISOString();
    const nowDisp = nowDisplay();
    const incidentDesc =
      params.incidentIds.length > 0
        ? `${params.incidentIds.length} incident${params.incidentIds.length > 1 ? "s" : ""} linked at creation: ${params.incidentIds.join(", ")}.`
        : "No incidents linked at creation.";
    const newCase: IncidentCase = {
      id,
      title: params.title,
      severity: params.severity,
      status: "open",
      site: params.site,
      siteDisplay: params.siteDisplay,
      assignedTo: params.assignedTo,
      incidentIds: params.incidentIds,
      notes: params.notes,
      activity: [
        {
          id: nextActId(),
          type: "created",
          timestamp: now,
          timestampDisplay: nowDisp,
          elapsed: "0m",
          title: `Case created by ${params.assignedTo.name}`,
          description: incidentDesc,
        },
      ],
      createdAt: now,
      createdAtDisplay: nowDisp,
      updatedAt: now,
      updatedAtDisplay: nowDisp,
    };
    set((state) => ({ cases: [newCase, ...state.cases] }));
    return id;
  },

  updateStatus: (caseId, status) => {
    const now = new Date().toISOString();
    const nowDisp = nowDisplay();
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id !== caseId) return c;
        const entry = makeActivity(
          "status",
          `Status → ${STATUS_LABELS[status]}`,
          `Case status changed from ${STATUS_LABELS[c.status]} to ${STATUS_LABELS[status]}.`,
          c.createdAt
        );
        return {
          ...c,
          status,
          updatedAt: now,
          updatedAtDisplay: nowDisp,
          activity: [...c.activity, entry],
        };
      }),
    }));
  },

  reassign: (caseId, assignedTo) => {
    const now = new Date().toISOString();
    const nowDisp = nowDisplay();
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id !== caseId) return c;
        const entry = makeActivity(
          "reassign",
          `Reassigned to ${assignedTo.name}`,
          `Case transferred from ${c.assignedTo.name} (${c.assignedTo.id}) to ${assignedTo.name} (${assignedTo.id}).`,
          c.createdAt
        );
        return {
          ...c,
          assignedTo,
          updatedAt: now,
          updatedAtDisplay: nowDisp,
          activity: [...c.activity, entry],
        };
      }),
    }));
  },

  linkEvents: (caseId, eventIds) => {
    const now = new Date().toISOString();
    const nowDisp = nowDisplay();
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id !== caseId) return c;
        const entry = makeActivity(
          "link",
          `${eventIds.length} incident${eventIds.length > 1 ? "s" : ""} linked`,
          `Added: ${eventIds.join(", ")}.`,
          c.createdAt
        );
        return {
          ...c,
          incidentIds: [...new Set([...c.incidentIds, ...eventIds])],
          updatedAt: now,
          updatedAtDisplay: nowDisp,
          activity: [...c.activity, entry],
        };
      }),
    }));
  },

  editCase: (caseId, params) => {
    const now = new Date().toISOString();
    const nowDisp = nowDisplay();
    set((state) => ({
      cases: state.cases.map((c) => {
        if (c.id !== caseId) return c;
        const changes: string[] = [];
        if (params.title !== c.title) changes.push("title updated");
        if (params.severity !== c.severity)
          changes.push(`severity changed to ${params.severity}`);
        if (params.notes !== c.notes) changes.push("notes updated");
        const entry = makeActivity(
          "edit",
          "Case details updated",
          changes.length > 0 ? changes.join(", ").replace(/^\w/, (s) => s.toUpperCase()) + "." : "No changes recorded.",
          c.createdAt
        );
        return {
          ...c,
          title: params.title,
          severity: params.severity,
          notes: params.notes,
          updatedAt: now,
          updatedAtDisplay: nowDisp,
          activity: [...c.activity, entry],
        };
      }),
    }));
  },

  deleteCase: (caseId) => {
    set((state) => ({ cases: state.cases.filter((c) => c.id !== caseId) }));
  },
}));
