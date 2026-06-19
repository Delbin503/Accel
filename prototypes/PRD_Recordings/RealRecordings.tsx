import { PageHeader } from "@/components/layout/PageHeader";
import RecordingsPage from "@/pages/recordings";
import { RecordingsSkeleton, ErrorState, EmptyState, type ForcedState } from "./shared";

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
  if (forced === "normal") return <RecordingsPage />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader />
      {forced === "loading" && <RecordingsSkeleton />}
      {forced === "empty" && <EmptyState />}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
