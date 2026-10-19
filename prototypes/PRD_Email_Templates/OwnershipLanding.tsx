import * as React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ProtoBreadcrumb } from "../_shared/ProtoBreadcrumb";
import { NotificationsBell } from "@/components/shared/NotificationsBell";
import { SystemStatusMenu } from "@/components/shared/SystemStatusMenu";
import { UserMenu } from "@/components/shared/UserMenu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import DashboardPage from "@/pages/dashboard";
import { AcceptOwnershipModal, type OwnershipRequest } from "@/pages/user-management/AcceptOwnershipModal";

/* Where the "Accept ownership" button in the Ownership Transfer Request email
   takes the recipient: the app, with the confirmation modal already open over
   whatever page they land on (the dashboard here).

   No prototype chrome on the page itself. Closing the modal without answering
   returns to the email templates; answering returns there too, on the email that
   answer sends, so the whole loop can still be walked. */

const REQUEST: OwnershipRequest = {
  orgName: "Astra Corp",
  fromName: "Jordan Lee",
  currentRole: "Admin",
  expiresAt: "20 Oct 2026, 3:42 PM (SGT)",
};

/** The email each answer sends, by template id. */
const FOLLOW_UP = {
  accepted: "ownership-transfer",
  declined: "ownership-transfer-declined",
} as const;

export function OwnershipLanding({ onExit }: { onExit: (templateId?: string) => void }) {
  // The toast is raised after the templates page has mounted its own Toaster.
  const answer = (templateId: string, notify: () => void) => {
    onExit(templateId);
    window.setTimeout(notify, 50);
  };

  // The gallery may have been scrolled down to the button; the app opens at the top.
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <MemoryRouter initialEntries={["/"]}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <SidebarProvider defaultOpen={true}>
            <div className="flex min-h-screen w-full bg-background">
              <AppSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                  <SidebarTrigger className="text-muted-foreground hover:text-foreground md:hidden" aria-label="Toggle sidebar" />
                  <ProtoBreadcrumb className="md:ml-2" />
                  <div className="flex-1" />
                  <SystemStatusMenu />
                  <NotificationsBell />
                  <div className="mx-1 h-5 w-px shrink-0 bg-border" />
                  <UserMenu />
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <DashboardPage />
                </main>
              </div>
            </div>

            <AcceptOwnershipModal
              open
              onOpenChange={(next) => !next && onExit()}
              request={REQUEST}
              onAccept={() =>
                answer(FOLLOW_UP.accepted, () =>
                  toast.success(`You are now the Owner of ${REQUEST.orgName}`, {
                    description: `${REQUEST.fromName} is now an Admin. This is the confirmation email both of you get.`,
                  })
                )
              }
              onDecline={() =>
                answer(FOLLOW_UP.declined, () =>
                  toast("Ownership transfer declined", {
                    description: `${REQUEST.fromName} stays the Owner. This is the email they get.`,
                  })
                )
              }
            />
          </SidebarProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}
