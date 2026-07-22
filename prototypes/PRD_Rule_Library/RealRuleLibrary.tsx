import * as React from "react";
import { LayoutTemplate, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import RulesLibraryPage from "@/pages/rules-library";
import { RuleSkeleton, ErrorState, NoResultsState, type ForcedState } from "./shared";

function StateHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>Rule Library</PageHeader.Title>
        <PageHeader.Description>
          Create and manage detection rules and alert conditions.
        </PageHeader.Description>
      </PageHeader.Content>
      {!loading && (
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
      )}
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
  // Populated + empty both run through the real page (rule cards, filters, sort,
  // rule builder, templates view, create/edit flows). Empty just zeroes the data
  // so the full scaffold stays visible with an inline "No rules yet" block.
  if (forced === "normal" || forced === "empty")
    return <RulesLibraryPage key={forced} forcedState={forced === "empty" ? "empty" : "normal"} />;

  return (
    <div className="flex flex-col gap-4">
      <StateHeader loading={forced === "loading"} />
      {forced === "loading" && <RuleSkeleton />}
      {forced === "noresults" && (
        <NoResultsState onClear={() => toast.message("Switch to “Populated” to use the live filters.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
