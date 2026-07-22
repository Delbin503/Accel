import * as React from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import UserManagementPage from "@/pages/user-management";
import { UserTableSkeleton, ErrorState, type ForcedState } from "./shared";

/* Header shown for the non-populated states so they read like the real page. */
function StateHeader({ loading = false }: { loading?: boolean }) {
  return (
    <PageHeader>
      <PageHeader.Content>
        <PageHeader.Title>User Management</PageHeader.Title>
        <PageHeader.Description>
          Manage workspace members — roles, site access, and authentication.
        </PageHeader.Description>
      </PageHeader.Content>
      {!loading && (
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" disabled>
            <UserPlus className="size-4" />
            Invite Users
          </Button>
        </PageHeader.Actions>
      )}
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
  // Empty state keeps the full page scaffold (seat usage, KPIs, filters, table
  // header) with zeroed data instead of hiding everything behind a splash.
  // key forces a remount so the empty/populated data initializer re-runs on toggle.
  if (forced === "normal" || forced === "empty")
    return <UserManagementPage key={forced} forcedState={forced === "empty" ? "empty" : "normal"} />;

  return (
    <div className="flex flex-col gap-4">
      <StateHeader loading={forced === "loading"} />
      {forced === "loading" && <UserTableSkeleton />}
      {forced === "error" && <ErrorState onRetry={onResolveForced} />}
    </div>
  );
}
