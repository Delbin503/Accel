import RunAnalysisPage from "@/pages/run-analysis";
import type { ForcedState } from "./shared";

export default function RealRunAnalysis({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // The real page renders each data-state inside its own chrome (model selector
  // + config panel + History button, and the Analysis History tab), so loading
  // / empty / no-results / error keep the real layout. A run failure surfaces as
  // a toast from the run action itself — not as a forced page state.
  return <RunAnalysisPage forcedState={forced} onRetry={onResolveForced} />;
}
