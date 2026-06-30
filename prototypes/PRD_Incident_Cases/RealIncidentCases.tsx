import IncidentCasesPage from "@/pages/incident-cases";
import type { ForcedState } from "./shared";

export default function RealIncidentCases({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // The real page renders each data-state inside its own chrome (header + KPIs +
  // filters), so loading / empty / error keep the real layout. The same forced
  // state also drives the Case drawer: open a case, then switch to Loading /
  // Error to preview the drawer's own states.
  return <IncidentCasesPage forcedState={forced} onRetry={onResolveForced} />;
}
