import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import NvrDevicesPage from "@/pages/site/nvr";
import { NvrTableSkeleton, ErrorState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>NVR Devices</PageHeader.Title>
        <PageHeader.Description>
          Network Video Recorders storing camera footage — channel management, storage health, and cleanup.
        </PageHeader.Description>
      </PageHeader.Content>
      {!loading && (
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="size-4" />
            Add NVR
          </Button>
        </PageHeader.Actions>
      )}
    </PageHeader>
  );
}

export default function RealNvrDevices({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (KPIs, NVR table, channel
  // linking, storage health, export / cleanup flows, detail sheet).
  // Empty state keeps the full page scaffold (KPIs, filters, table header) with
  // zeroed data instead of hiding everything behind a splash.
  // key forces a remount so the empty/populated data initializer re-runs on toggle.
  if (forced === "normal" || forced === "empty")
    return <NvrDevicesPage key={forced} forcedState={forced === "empty" ? "empty" : "normal"} />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader loading={forced === "loading"} />
      {forced === "loading" && <NvrTableSkeleton />}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
