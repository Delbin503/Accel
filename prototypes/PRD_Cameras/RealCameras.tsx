import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import CamerasPage from "@/pages/site/cameras";
import { CameraTableSkeleton, ErrorState, type ForcedState, type DrawerAsync } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Cameras</PageHeader.Title>
        <PageHeader.Description>
          Manage cameras across all sites — RTSP feeds, NVR linkage, and boundary zones.
        </PageHeader.Description>
      </PageHeader.Content>
      {!loading && (
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="size-4" />
            Add Camera
          </Button>
        </PageHeader.Actions>
      )}
    </PageHeader>
  );
}

export default function RealCameras({
  forced,
  onResolveForced,
  drawerAsync,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
  drawerAsync: DrawerAsync;
}) {
  // Populated and empty states both render the real, fully-working page (KPIs,
  // filter toolbar, camera table scaffold, add/edit camera, NVR channel linking,
  // detection-zone editor, detail sheet). Empty just zeroes the dataset so the
  // inline "No cameras yet" block shows where the rows would be.
  // drawerAsync forces the camera drawer's detail-fetch state for previewing.
  if (forced === "normal" || forced === "empty")
    return (
      <CamerasPage
        key={forced}
        forcedState={forced === "empty" ? "empty" : "normal"}
        drawerAsync={drawerAsync}
      />
    );

  return (
    <div className="flex flex-col gap-5">
      <StateHeader loading={forced === "loading"} />
      {forced === "loading" && <CameraTableSkeleton />}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
