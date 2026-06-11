import * as React from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import UserManagementPage from "@/pages/user-management";
import { UserTableSkeleton, ErrorState, EmptyState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader() {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>User Management</PageHeader.Title>
        <PageHeader.Description>
          Manage workspace members — roles, site access, and authentication.
        </PageHeader.Description>
      </PageHeader.Content>
      <PageHeader.Actions>
        <Button size="sm" className="gap-1.5" disabled>
          <UserPlus className="size-4" />
          Invite Users
        </Button>
      </PageHeader.Actions>
    </PageHeader>
  );
}

export default function RealUserManagement({
  forced,
  onResolveForced,
}: {
  forced: ForcedState;
  onResolveForced: () => void;
}) {
  // Populated state is the real, fully-working page (seat usage, KPIs, table,
  // load-more, invite / change-role / transfer-ownership modals).
  if (forced === "normal") return <UserManagementPage />;

  return (
    <div className="flex flex-col gap-4">
      <StateHeader />
      {forced === "loading" && <UserTableSkeleton />}
      {forced === "empty" && (
        <EmptyState onInvite={() => toast.message("Switch to “Populated” to use the full invite flow.")} />
      )}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
