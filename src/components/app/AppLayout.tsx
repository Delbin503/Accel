import { Outlet } from "react-router-dom";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/app/AppSidebar";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import { DownloadsIndicator } from "@/components/app/DownloadsIndicator";
import { SystemStatusMenu } from "@/components/app/SystemStatusMenu";
import { UserMenu } from "@/components/app/UserMenu";
import { CommandPalette } from "@/components/app/CommandPalette";
import {
  GlobalSearchTrigger,
  QuickActionsTrigger,
} from "@/components/app/GlobalSearchTrigger";
import { TooltipProvider } from "@accel/ui/components/ui/tooltip";

/* ─── Skip-to-content ───────────────────────────────────────────────────── */

function SkipToContent() {
  return (
    <a
      data-slot="app-layout-skip-link"
      href="#main-content"
      className="fixed left-4 top-4 z-[var(--z-tooltip)] -translate-y-20 rounded-md bg-primary-fill px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}

/* ─── Top header bar ────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header data-slot="app-layout-top-bar" className="sticky top-0 z-[var(--z-sticky)] flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      {/* Desktop collapses from the sidebar's own edge button; on mobile the
          sidebar is a sheet, so it needs this trigger to open. */}
      <SidebarTrigger
        className="text-muted-foreground hover:text-foreground md:hidden"
        aria-label="Toggle sidebar"
      />
      <div data-slot="app-layout-search" className="mx-2 flex flex-1 justify-end md:justify-center">
        <GlobalSearchTrigger />
      </div>
      <QuickActionsTrigger />
      <ThemeToggle />
      <SystemStatusMenu />
<DownloadsIndicator />
      <NotificationsBell />
      <div data-slot="app-layout-divider" className="mx-1 h-5 w-px shrink-0 bg-border" />
      <UserMenu />
    </header>
  );
}

/* ─── Root layout ───────────────────────────────────────────────────────── */

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider defaultOpen={true}>
        <SkipToContent />
        <CommandPalette />

        <div data-slot="app-layout" className="flex min-h-screen w-full bg-background">
          <AppSidebar />

          {/* Main column */}
          <div data-slot="app-layout-main-column" className="flex min-w-0 flex-1 flex-col">
            <TopBar />

            <main
              data-slot="app-layout-main"
              id="main-content"
              tabIndex={-1}
              className="flex-1 overflow-auto p-page focus:outline-none"
            >
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
