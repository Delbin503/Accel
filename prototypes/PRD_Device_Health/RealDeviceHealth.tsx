import DeviceHealthPage from "@/pages/device-health";
import type { ForcedState } from "./shared";

export default function RealDeviceHealth({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // The real page renders each data-state inside its own chrome (header +
  // health-score + KPIs + filters), so loading / empty / error keep the real
  // layout. Rows link out to Cameras / NVR (outside this prototype).
  return <DeviceHealthPage forcedState={forced} onRetry={onResolveForced} />;
}
