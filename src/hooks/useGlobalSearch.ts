import * as React from "react";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import { MOCK_RULES } from "@/mocks/rulesLibrary";
import { MOCK_USERS } from "@/mocks/users";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { MOCK_RECORDINGS } from "@/mocks/recordings";

/* ─── Result shape ──────────────────────────────────────────────────────── */

export type SearchResultType =
  | "camera"
  | "site"
  | "nvr"
  | "case"
  | "detection"
  | "recording"
  | "model"
  | "rule"
  | "user";

export interface SearchResult {
  /** Stable key, also used as the recents key. */
  key: string;
  id: string;
  type: SearchResultType;
  label: string;
  sublabel?: string;
  /** Route to push on select. */
  to: string;
  /** Router location state, for pages that open a drawer from it. */
  state?: Record<string, unknown>;
  /** True for rows that stand in for a filtered list rather than one record. */
  isSavedQuery?: boolean;
}

export interface SearchGroup {
  type: SearchResultType;
  label: string;
  results: SearchResult[];
  /** Total matches before the per-group cap. */
  total: number;
  seeAll?: { label: string; to: string };
}

export const TYPE_LABELS: Record<SearchResultType, string> = {
  camera: "Cameras",
  site: "Sites & Areas",
  nvr: "NVR Devices",
  case: "Incident Cases",
  detection: "Detections",
  recording: "Recordings",
  model: "Models",
  rule: "Rules",
  user: "Users",
};

/** Prefix filters — `cam:lobby` searches cameras only. */
const PREFIXES: Record<string, SearchResultType> = {
  cam: "camera",
  camera: "camera",
  site: "site",
  area: "site",
  nvr: "nvr",
  case: "case",
  incident: "case",
  event: "detection",
  detection: "detection",
  rec: "recording",
  recording: "recording",
  model: "model",
  rule: "rule",
  user: "user",
};

export const PREFIX_HINTS = ["cam:", "site:", "case:", "rule:", "model:", "user:"];

const MIN_QUERY_LENGTH = 2;
const PER_GROUP = 5;
const DEBOUNCE_MS = 200;

/* ─── Matching ──────────────────────────────────────────────────────────── */

/** All whitespace-separated tokens must appear somewhere in the haystack. */
export function matches(haystack: string, term: string): boolean {
  const hay = haystack.toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
}

export interface ParsedQuery {
  /** The text left after stripping a `type:` prefix. */
  term: string;
  /** Restrict results to this type, when a prefix was used. */
  only: SearchResultType | null;
  /** The raw prefix the user typed, for the scope chip. */
  prefix: string | null;
}

export function parseQuery(raw: string): ParsedQuery {
  const match = /^([a-z]+):\s*(.*)$/i.exec(raw.trim());
  if (match) {
    const only = PREFIXES[match[1].toLowerCase()];
    if (only) return { term: match[2], only, prefix: `${match[1].toLowerCase()}:` };
  }
  return { term: raw.trim(), only: null, prefix: null };
}

/* ─── Hook ──────────────────────────────────────────────────────────────── */

export interface GlobalSearch {
  /** Post-prefix search term, already debounced. */
  term: string;
  only: SearchResultType | null;
  prefix: string | null;
  /** True once the debounced term is long enough to search. */
  isActive: boolean;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  groups: SearchGroup[];
  /** Total results across all groups, before per-group caps. */
  total: number;
}

/**
 * Federated search across every searchable entity.
 *
 * Today this fans out over in-memory mocks/stores behind a debounce, which is
 * why the loading and error branches exist at all — the moment there is a real
 * `/search` endpoint this hook is the only file that changes. Callers must keep
 * rendering all four states (loading / error / empty / results).
 */
export function useGlobalSearch(rawQuery: string): GlobalSearch {
  const cameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);
  const cases = useIncidentCasesStore((s) => s.cases);

  const [debounced, setDebounced] = React.useState("");
  const [error, setError] = React.useState<Error | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  const parsed = React.useMemo(() => parseQuery(rawQuery), [rawQuery]);
  const term = parsed.term.trim();
  const isActive = term.length >= MIN_QUERY_LENGTH;

  // Debounce. When the endpoint is real this timeout becomes the fetch, and the
  // try/catch below becomes its rejection handler — nothing else moves.
  React.useEffect(() => {
    if (!isActive) return;
    const id = setTimeout(() => {
      try {
        setDebounced(term);
        setError(null);
      } catch (e) {
        setError(e as Error);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [term, isActive, attempt]);

  /* Results lag the input by one debounce; that gap IS the loading state. */
  const isLoading = isActive && debounced !== term;

  const retry = React.useCallback(() => setAttempt((a) => a + 1), []);

  const groups = React.useMemo<SearchGroup[]>(() => {
    const term = isActive ? debounced : "";
    if (!term || isLoading) return [];

    const wanted = (type: SearchResultType) => parsed.only === null || parsed.only === type;
    const out: SearchGroup[] = [];

    const push = (
      type: SearchResultType,
      all: SearchResult[],
      seeAll?: { label: string; to: string }
    ) => {
      if (all.length === 0) return;
      out.push({
        type,
        label: TYPE_LABELS[type],
        results: all.slice(0, PER_GROUP),
        total: all.length,
        seeAll: all.length > PER_GROUP ? seeAll : undefined,
      });
    };

    /* Cameras — the drawer opens from router state on /site/cameras. */
    if (wanted("camera")) {
      const hits = cameras
        .filter((c) => matches(`${c.id} ${c.name} ${c.siteName} ${c.areaName} ${c.ipAddress}`, term))
        .map<SearchResult>((c) => ({
          key: `camera:${c.id}`,
          id: c.id,
          type: "camera",
          label: c.name,
          sublabel: `${c.siteName} · ${c.areaName} · ${c.status}`,
          to: "/site/cameras",
          state: { openCameraId: c.id },
        }));
      push("camera", hits, { label: "See all cameras", to: "/site/cameras" });
    }

    /* Sites and their areas — /site/:siteId opens the site drawer. */
    if (wanted("site")) {
      const hits: SearchResult[] = [];
      for (const s of sites) {
        if (matches(`${s.name} ${s.address} ${s.id}`, term)) {
          hits.push({
            key: `site:${s.id}`,
            id: s.id,
            type: "site",
            label: s.name,
            sublabel: `${s.areas.length} areas · ${s.address}`,
            to: `/site/${s.id}`,
          });
        }
        for (const area of s.areas) {
          if (matches(`${area.name} ${s.name}`, term)) {
            hits.push({
              key: `site:${s.id}:${area.id}`,
              id: area.id,
              type: "site",
              label: area.name,
              sublabel: `Area in ${s.name}`,
              to: `/site/${s.id}`,
            });
          }
        }
      }
      push("site", hits, { label: "See all sites", to: "/site/overview" });
    }

    /* NVRs — /site/nvr?nvr=<id> opens the device drawer. */
    if (wanted("nvr")) {
      const hits = MOCK_NVRS.filter((n) =>
        matches(`${n.id} ${n.name} ${n.model} ${n.siteName} ${n.areaName} ${n.ipAddress}`, term)
      ).map<SearchResult>((n) => ({
        key: `nvr:${n.id}`,
        id: n.id,
        type: "nvr",
        label: n.name,
        sublabel: `${n.model} · ${n.siteName} · ${n.channelsInUse}/${n.channelCount} channels`,
        to: `/site/nvr?nvr=${encodeURIComponent(n.id)}`,
      }));
      push("nvr", hits, { label: "See all NVR devices", to: "/site/nvr" });
    }

    /* Incident cases — real detail route. */
    if (wanted("case")) {
      const hits = cases
        .filter((c) => matches(`${c.id} ${c.title} ${c.siteDisplay} ${c.assignedTo.name}`, term))
        .map<SearchResult>((c) => ({
          key: `case:${c.id}`,
          id: c.id,
          type: "case",
          label: c.title,
          sublabel: `${c.id} · ${c.severity} · ${c.status} · ${c.siteDisplay}`,
          to: `/incidents/${encodeURIComponent(c.id)}`,
        }));
      push("case", hits, { label: "See all incident cases", to: "/incidents" });
    }

    /* Models. */
    if (wanted("model")) {
      const hits = MOCK_MODELS.filter((m) =>
        matches(`${m.id} ${m.name} ${m.description} ${m.tags.join(" ")}`, term)
      ).map<SearchResult>((m) => ({
        key: `model:${m.id}`,
        id: m.id,
        type: "model",
        label: m.name,
        sublabel: `${m.steps.length} steps · ${m.tags.slice(0, 3).join(", ")}`,
        to: `/models?model=${encodeURIComponent(m.id)}`,
      }));
      push("model", hits, { label: "See all models", to: "/models" });
    }

    /* Rules. */
    if (wanted("rule")) {
      const hits = MOCK_RULES.filter((r) =>
        matches(`${r.id} ${r.name} ${r.description} ${r.tags.join(" ")}`, term)
      ).map<SearchResult>((r) => ({
        key: `rule:${r.id}`,
        id: r.id,
        type: "rule",
        label: r.name,
        sublabel: `${r.severity} · ${r.tags.slice(0, 3).join(", ")}`,
        to: `/rules?edit=${encodeURIComponent(r.id)}`,
      }));
      push("rule", hits, { label: "See all rules", to: "/rules" });
    }

    /* Users. */
    if (wanted("user")) {
      const hits = MOCK_USERS.filter((u) =>
        matches(`${u.fullName} ${u.email} ${u.role} ${u.departments.join(" ")}`, term)
      ).map<SearchResult>((u) => ({
        key: `user:${u.id}`,
        id: u.id,
        type: "user",
        label: u.fullName,
        sublabel: `${u.email} · ${u.role} · ${u.status}`,
        to: `/users?user=${encodeURIComponent(u.id)}`,
      }));
      push("user", hits, { label: "See all users", to: "/users" });
    }

    /* Detections — far too many to list flat, so the row IS the filtered feed. */
    if (wanted("detection")) {
      // Field set deliberately mirrors the Detection Feed's own search, so the
      // count shown here is the count the user lands on.
      const hits = MOCK_EVENTS.filter((e) =>
        matches(
          `${e.id} ${e.typeLabel} ${e.areaDisplay} ${e.siteDisplay} ${e.assetId ?? ""} ${e.personId ?? ""}`,
          term
        )
      );
      if (hits.length > 0) {
        const exact = hits.find((e) => e.id.toLowerCase() === term.toLowerCase());
        const saved: SearchResult[] = [];
        if (exact) {
          saved.push({
            key: `detection:${exact.id}`,
            id: exact.id,
            type: "detection",
            label: exact.id,
            sublabel: `${exact.typeLabel} · ${exact.camera} · ${exact.dateDisplay}`,
            to: `/detection-feed?event=${encodeURIComponent(exact.id)}&range=all`,
          });
        }
        const q = encodeURIComponent(term);
        saved.push(
          {
            key: `detection:query:today:${term}`,
            id: `query-today`,
            type: "detection",
            label: `“${term}” detections · Today`,
            sublabel: `Open the feed filtered to today`,
            to: `/detection-feed?q=${q}&range=today`,
            isSavedQuery: true,
          },
          {
            key: `detection:query:all:${term}`,
            id: `query-all`,
            type: "detection",
            label: `“${term}” detections · All time`,
            sublabel: `${hits.length} matching event${hits.length === 1 ? "" : "s"}`,
            to: `/detection-feed?q=${q}&range=all`,
            isSavedQuery: true,
          }
        );
        out.push({
          type: "detection",
          label: TYPE_LABELS.detection,
          results: saved,
          total: hits.length,
        });
      }
    }

    /* Recordings — same reasoning as detections. */
    if (wanted("recording")) {
      // Mirrors the Recordings page search fields for the same reason.
      const hits = MOCK_RECORDINGS.filter((r) =>
        matches(`${r.id} ${r.cameraName} ${r.cameraId} ${r.areaName} ${r.siteName} ${r.dateLabel}`, term)
      );
      if (hits.length > 0) {
        out.push({
          type: "recording",
          label: TYPE_LABELS.recording,
          results: [
            {
              key: `recording:query:${term}`,
              id: "query",
              type: "recording",
              label: `“${term}” recordings`,
              sublabel: `${hits.length} matching recording${hits.length === 1 ? "" : "s"}`,
              to: `/recordings?q=${encodeURIComponent(term)}`,
              isSavedQuery: true,
            },
          ],
          total: hits.length,
        });
      }
    }

    return out;
  }, [debounced, isActive, isLoading, parsed.only, cameras, sites, cases]);

  const total = React.useMemo(() => groups.reduce((sum, g) => sum + g.total, 0), [groups]);

  return {
    term: isActive ? debounced : "",
    only: parsed.only,
    prefix: parsed.prefix,
    isActive,
    isLoading,
    error,
    retry,
    groups,
    total,
  };
}
