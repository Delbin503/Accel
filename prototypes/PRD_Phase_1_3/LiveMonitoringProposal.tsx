import { ReidLiveMonitoring } from "./reid/ReidLiveMonitoring";

/* Phase 1.3 — Live Monitoring.

   The same page every Live Monitoring prototype uses, without the Re-ID
   module's weapon tracking: a wall narrowed by site and area, with detections
   in the side panel. A detection opens in the Detection Feed. */

export function LiveMonitoringProposal() {
  return <ReidLiveMonitoring tracking={false} />;
}
