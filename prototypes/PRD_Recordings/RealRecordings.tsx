import { PageHeader } from "@/components/layout/PageHeader";
import RecordingsPage from "@/pages/recordings";
import { RecordingsSkeleton, ErrorState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Recordings</PageHeader.Title>
        <PageHeader.Description>
          Browse all camera recordings — replay footage, link incidents and escalate to incident cases.
        </PageHeader.Description>
      </PageHeader.Content>
    </PageHeader>
  );
}

export default function RealRecordings({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (KPIs, date range, recording
  // card grid, detail drawer with player, bulk delete, escalate-to-case).
  // Empty state keeps the full page scaffold (KPIs, date range, filters, list
  // header) with zeroed data instead of hiding everything behind a splash.
  // key forces a remount so the empty/populated data initializer re-runs on toggle.
  if (forced === "normal" || forced === "empty")
    return <RecordingsPage key={forced} forcedState={forced === "empty" ? "empty" : "normal"} />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader />
      {forced === "loading" && <RecordingsSkeleton />}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
