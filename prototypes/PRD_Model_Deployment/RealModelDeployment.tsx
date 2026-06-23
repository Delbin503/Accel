import ModelDeploymentPage from "@/pages/model-deployment";
import type { ForcedState } from "./shared";

export default function RealModelDeployment({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // The real page renders each data-state inside its own chrome (header + the
  // Deploy / Models tabs), so loading / empty / error keep the real layout.
  // Deploy failures surface as a toast from the deploy action (try deploying
  // the "Muzzle Detection Protocol" model) — not as a forced page state.
  return <ModelDeploymentPage forcedState={forced} onRetry={onResolveForced} />;
}
