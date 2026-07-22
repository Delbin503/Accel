import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import ModelManagementPage from "@/pages/model-management";
import { ModelSkeleton, ErrorState, NoResultsState, type ForcedState } from "./shared";

function StateHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Model Management</PageHeader.Title>
        <PageHeader.Description>
          Build and manage AI detection models with sequenced verification steps and attached rules.
        </PageHeader.Description>
      </PageHeader.Content>
      {!loading && (
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="size-4" />
            Add New Model
          </Button>
        </PageHeader.Actions>
      )}
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
  // detection rules, extract-from-model, create/edit flows). Empty routes through
  // the same page with an emptied dataset so the full scaffold stays visible.
  if (forced === "normal" || forced === "empty")
    return <ModelManagementPage key={forced} forcedState={forced === "empty" ? "empty" : "normal"} />;

  return (
    <div className="flex flex-col gap-4">
      <StateHeader loading={forced === "loading"} />
      {forced === "loading" && <ModelSkeleton />}
      {forced === "noresults" && (
        <NoResultsState onClear={() => toast.message("Switch to “Populated” to use the live filters.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
