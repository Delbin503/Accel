import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import CamerasPage from "@/pages/site/cameras";
import { CameraTableSkeleton, ErrorState, EmptyState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Cameras</PageHeader.Title>
        <PageHeader.Description>
          Manage cameras across all sites — RTSP feeds, NVR linkage, and boundary zones.
        </PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="size-4" />
          Add Camera
        </Button>
      </PageHeader.Actions>
    </PageHeader>
  );
}

export default function RealCameras({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (KPIs, camera table,
  // add/edit camera, NVR channel linking, detection-zone editor, detail sheet).
  if (forced === "normal") return <CamerasPage />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader />
      {forced === "loading" && <CameraTableSkeleton />}
      {forced === "empty" && (
        <EmptyState onAdd={() => toast.message("Switch to “Populated” to use the full Add Camera flow.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
