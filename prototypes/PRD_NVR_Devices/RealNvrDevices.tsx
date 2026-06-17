import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import NvrDevicesPage from "@/pages/site/nvr";
import { NvrTableSkeleton, ErrorState, EmptyState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>NVR Devices</PageHeader.Title>
        <PageHeader.Description>
          Network Video Recorders storing camera footage — channel management, storage health, and cleanup.
        </PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="size-4" />
          Add NVR
        </Button>
      </PageHeader.Actions>
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
  if (forced === "normal") return <NvrDevicesPage />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader />
      {forced === "loading" && <NvrTableSkeleton />}
      {forced === "empty" && (
        <EmptyState onAdd={() => toast.message("Switch to “Populated” to use the full Add NVR flow.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
