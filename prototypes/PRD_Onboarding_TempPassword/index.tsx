import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TempPasswordFlow, type TempPwStep } from "./TempPasswordFlow";
import { StateTester } from "./StateTester";
import "./proto.css";

function Shell() {
  const [step, setStep] = React.useState<TempPwStep>("signin");

  return (
    <div className="min-h-screen w-full bg-background">
      <TempPasswordFlow step={step} onStep={setStep} />

      {/* PROTOTYPE-ONLY floating step tester — low opacity, reveals on hover. */}
      <div className="fixed bottom-6 right-6 z-[100] opacity-30 transition-opacity duration-200 hover:opacity-100">
        <StateTester step={step} onStep={setStep} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/"]}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={200}>
            <Shell />
            <Toaster position="top-right" theme="dark" />
          </TooltipProvider>
        </QueryClientProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
