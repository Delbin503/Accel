import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import ModelManagementPage from "@/pages/model-management";
import { ModelSkeleton, ErrorState, EmptyState, NoResultsState, type ForcedState } from "./shared";

function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Model Management</PageHeader.Title>
        <PageHeader.Description>
          Build and manage AI detection models with sequenced verification steps and attached rules.
        </PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="size-4" />
          Add New Model
        </Button>
      </PageHeader.Actions>
    </PageHeader>
  );
}

export default function RealModelManagement({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (models, sequence builder,
  // detection rules, extract-from-model, create/edit flows).
  if (forced === "normal") return <ModelManagementPage />;

  return (
    <div className="flex flex-col gap-4">
      <StateHeader />
      {forced === "loading" && <ModelSkeleton />}
      {forced === "empty" && (
        <EmptyState onCreate={() => toast.message("Switch to “Populated” to use the full create flow.")} />
      )}
      {forced === "noresults" && (
        <NoResultsState onClear={() => toast.message("Switch to “Populated” to use the live filters.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
