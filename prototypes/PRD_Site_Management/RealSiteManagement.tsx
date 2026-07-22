import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import SiteOverviewPage from "@/pages/site/overview";
import { SiteTableSkeleton, ErrorState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Site Management</PageHeader.Title>
        <PageHeader.Description>
          Manage all sites — upload floor plans, draw areas, and place cameras.
        </PageHeader.Description>
      </PageHeader.Content>
      {!loading && (
        <PageHeader.Actions>
          <Button className="gap-1.5" disabled>
            <Plus className="size-3.5" />
            Add Site
          </Button>
        </PageHeader.Actions>
      )}
    </PageHeader>
  );
}

export default function RealSiteManagement({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (KPIs, site table, create
  // wizard, floor-plan / area drawing, detail drawer).
  // Empty state keeps the full page scaffold (KPIs, filters, table header) with
  // zeroed data instead of hiding everything behind a splash.
  // key forces a remount so the empty/populated data initializer re-runs on toggle.
  if (forced === "normal" || forced === "empty")
    return <SiteOverviewPage key={forced} forcedState={forced === "empty" ? "empty" : "normal"} />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader loading={forced === "loading"} />
      {forced === "loading" && <SiteTableSkeleton />}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
