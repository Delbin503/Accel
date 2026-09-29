import { create } from "zustand";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import type { Severity } from "@/types/detection";
import {
  KIND_LABEL,
  makeDetection,
  seedDetections,
  toDetectionEvent,
  type DetectionKind,
  type TrmsDetection,
} from "./trmsData";

/* One store for every TRMS detection. Live Monitoring raises them, Alert Log
   triages them — both read this, so the toast you click in one is the row you
   land on in the other.

   PROTOTYPE-ONLY BRIDGE: the real Incident Cases drawer resolves a case's
   linked detections against the shared `MOCK_EVENTS` array. This prototype
   loads as its own page, so it mirrors TRMS detections into that array to let
   the unmodified drawer render them. Nothing outside this page load sees it. */

function mirrorToCaseModule(detections: TrmsDetection[]) {
  MOCK_EVENTS.splice(0, MOCK_EVENTS.length, ...detections.map(toDetectionEvent));
}

const ESCALATOR = { name: "Sze Hui", id: "USR-001" };

interface TrmsState {
  detections: TrmsDetection[];
  /** Raises a new live detection and returns it. */
  raise: (kind: DetectionKind) => TrmsDetection;
  dismiss: (ids: string[]) => void;
  /** Opens one case for the given detections and returns its id. */
  escalate: (ids: string[]) => string | null;
}

let liveSeed = 40;

export const useTrmsStore = create<TrmsState>((set, get) => ({
  detections: seedDetections(),

  raise: (kind) => {
    const d = makeDetection(kind, liveSeed++, new Date());
    const next = [d, ...get().detections];
    mirrorToCaseModule(next);
    set({ detections: next });
    return d;
  },

  dismiss: (ids) => {
    const next = get().detections.map((d) =>
      ids.includes(d.id) && d.status === "pending" ? { ...d, status: "dismissed" as const } : d
    );
    mirrorToCaseModule(next);
    set({ detections: next });
  },

  escalate: (ids) => {
    const picked = get().detections.filter((d) => ids.includes(d.id) && d.status === "pending");
    if (picked.length === 0) return null;

    const rank: Record<Severity, number> = { critical: 3, medium: 2, low: 1 };
    const worst = picked.reduce((a, b) => (rank[b.severity] > rank[a.severity] ? b : a));
    const stations = [...new Set(picked.map((d) => d.stationId))];

    // Mirror first, so the case drawer can resolve these the moment it opens.
    mirrorToCaseModule(get().detections);
    const caseId = useIncidentCasesStore.getState().createCase({
      title:
        picked.length === 1
          ? `${KIND_LABEL[worst.kind]} — ${worst.subject}`
          : `${picked.length} detections — ${stations.join(", ")}`,
      severity: worst.severity,
      site: "trms",
      siteDisplay: "IMT Camp",
      assignedTo: ESCALATOR,
      incidentIds: picked.map((d) => d.id),
      notes: `Escalated from the Alert Log. Stations: ${stations.join(", ")}.`,
    });

    const next = get().detections.map((d) =>
      picked.some((p) => p.id === d.id) ? { ...d, status: "escalated" as const, caseId } : d
    );
    mirrorToCaseModule(next);
    set({ detections: next });
    return caseId;
  },
}));

/* ── Boot: TRMS-only cases, pre-escalated from today's history ───────── */

(function boot() {
  const state = useTrmsStore.getState();
  mirrorToCaseModule(state.detections);
  // The case list should hold TRMS cases only — not the site-security demo set.
  useIncidentCasesStore.setState({ cases: [] });

  const critical = state.detections.filter((d) => d.severity === "critical");
  critical.slice(0, 2).forEach((d) => state.escalate([d.id]));
})();
