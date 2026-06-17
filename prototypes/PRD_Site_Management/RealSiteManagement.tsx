import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import SiteOverviewPage from "@/pages/site/overview";
import { SiteTableSkeleton, ErrorState, EmptyState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Site Management</PageHeader.Title>
        <PageHeader.Description>
          Manage all sites — upload floor plans, draw areas, and place cameras.
        </PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button className="gap-1.5" disabled>
          <Plus className="size-3.5" />
          Add Site
        </Button>
      </PageHeader.Actions>
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
  if (forced === "normal") return <SiteOverviewPage />;

  return (
    <div className="flex flex-col gap-5">
      <StateHeader />
      {forced === "loading" && <SiteTableSkeleton />}
      {forced === "empty" && (
        <EmptyState onAdd={() => toast.message("Switch to “Populated” to use the full Add Site wizard.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
