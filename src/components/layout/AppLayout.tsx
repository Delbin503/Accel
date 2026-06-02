import { Outlet } from "react-router-dom";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { TooltipProvider } from "@/components/ui/tooltip";

/* ─── Skip-to-content ───────────────────────────────────────────────────── */

function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[200] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}

/* ─── Top header bar ────────────────────────────────────────────────────── */

function TopBar() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
      <SidebarTrigger
        className="text-muted-foreground hover:text-foreground"
        aria-label="Toggle sidebar"
      />
      <div className="flex-1" />
      <ThemeToggle />
    </header>
  );
}

/* ─── Root layout ───────────────────────────────────────────────────────── */

export function AppLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider defaultOpen={true}>
        <SkipToContent />

        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />

          {/* Main column */}
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />

            <main
              id="main-content"
              tabIndex={-1}
              className="flex-1 overflow-auto p-6 focus:outline-none"
            >
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
