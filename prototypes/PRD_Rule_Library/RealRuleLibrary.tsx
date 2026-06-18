import * as React from "react";
import { LayoutTemplate, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import RulesLibraryPage from "@/pages/rules-library";
import { RuleSkeleton, ErrorState, EmptyState, NoResultsState, type ForcedState } from "./shared";

function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Rule Library</PageHeader.Title>
        <PageHeader.Description>
          Create and manage detection rules and alert conditions.
        </PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button variant="outline" size="sm" className="gap-1.5" disabled>
          <LayoutTemplate className="size-3.5" />
          View Templates
        </Button>
        <Button size="sm" className="gap-1.5" disabled>
          <Plus className="size-4" />
          Add Rule
        </Button>
      </PageHeader.Actions>
    </PageHeader>
  );
}

export default function RealRuleLibrary({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (rule cards, filters, sort,
  // rule builder, templates view, create/edit flows).
  if (forced === "normal") return <RulesLibraryPage />;

  return (
    <div className="flex flex-col gap-4">
      <StateHeader />
      {forced === "loading" && <RuleSkeleton />}
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
