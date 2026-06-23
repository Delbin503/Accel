import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ArrowUp } from "lucide-react";
import { AppSidebar, SidebarProvider, SidebarTrigger } from "@/components/layout/AppSidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import RealCameras from "./RealCameras";
import { StateTester } from "./StateTester";
import type { ForcedState, DrawerAsync } from "./shared";
import "./proto.css";

/* PROTOTYPE-ONLY: floating state tester — bottom-right (left of the back-to-top
   button), low opacity, reveals on hover. Excluded when promoting to src. */
function FloatingTester({
  value,
  onChange,
  drawer,
  onDrawer,
}: {
  value: ForcedState;
  onChange: (s: ForcedState) => void;
  drawer: DrawerAsync;
  onDrawer: (d: DrawerAsync) => void;
}) {
  return (
    <div className="fixed bottom-6 right-24 z-[100] opacity-30 transition-opacity duration-200 hover:opacity-100">
      <StateTester value={value} onChange={onChange} drawer={drawer} onDrawer={onDrawer} />
    </div>
  );
}

/* Back-to-top — icon-only circular button, bottom-right; appears after scrolling.
   Tracks both the inner <main> scroller and the window, since either can be the
   scroll container depending on content height. */
function BackToTop({ scrollRef }: { scrollRef: React.RefObject<HTMLElement | null> }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const el = scrollRef.current;
    const check = () => {
      const top = Math.max(el?.scrollTop ?? 0, window.scrollY, document.documentElement.scrollTop);
      setShow(top > 300);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    el?.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      el?.removeEventListener("scroll", check);
    };
  }, [scrollRef]);

  if (!show) return null;
  return (
    <button
      onClick={() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      aria-label="Back to top"
      title="Back to top"
      className="fixed bottom-6 right-6 z-[90] flex size-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:border-primary hover:text-primary"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

function App() {
  const [forced, setForced] = React.useState<ForcedState>("normal");
  const [drawerAsync, setDrawerAsync] = React.useState<DrawerAsync>("idle");
  const resolve = () => setForced("normal");
  const mainRef = React.useRef<HTMLElement>(null);

  return (
    <ThemeProvider defaultTheme="dark">
    <MemoryRouter initialEntries={["/site/cameras"]}>
      <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground" aria-label="Toggle sidebar" />
                <div className="flex-1" />
                <ThemeToggle />
              </header>
              <main ref={mainRef} id="main-content" className="flex-1 overflow-auto p-6 focus:outline-none">
                <Routes>
                  <Route path="/site/cameras" element={<RealCameras forced={forced} onResolveForced={resolve} drawerAsync={drawerAsync} />} />
                  <Route path="*" element={<NotInPrototype />} />
                </Routes>
              </main>
            </div>
          </div>
          <BackToTop scrollRef={mainRef} />
          <FloatingTester value={forced} onChange={setForced} drawer={drawerAsync} onDrawer={setDrawerAsync} />
          <Toaster position="top-right" theme="dark" />
        </SidebarProvider>
      </TooltipProvider>
      </QueryClientProvider>
    </MemoryRouter>
    </ThemeProvider>
  );
}

function NotInPrototype() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-24 text-center text-muted-foreground">
      <p className="text-sm font-medium text-foreground">Not part of this prototype</p>
      <p className="text-[12px]">This prototype only covers <strong className="text-foreground">Cameras</strong>.</p>
    </div>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
