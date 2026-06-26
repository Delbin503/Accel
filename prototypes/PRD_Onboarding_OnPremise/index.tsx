import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import OnPremSignInPage from "@/pages/auth/onprem/OnPremSignIn";
import OnPremSignInVerifyPage from "@/pages/auth/onprem/OnPremSignInVerify";
import OnPremForgotPasswordPage from "@/pages/auth/onprem/OnPremForgotPassword";
import OnPremSetupPage from "@/pages/auth/onprem/OnPremSetup";
import { StateTester } from "./StateTester";
import {
  ONPREM_SCREENS,
  type OnPremScreen,
  type AsyncMode,
  LoadingPreview,
  ErrorPreview,
  DonePreview,
  NotInPrototype,
} from "./shared";
import "./proto.css";

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [asyncMode, setAsyncMode] = React.useState<AsyncMode>("idle");

  // Current screen is derived from the route (longest matching path wins).
  const screen: OnPremScreen | null =
    [...ONPREM_SCREENS]
      .sort((a, b) => b.path.length - a.path.length)
      .find((s) => location.pathname === s.path || location.pathname.startsWith(s.path + "/"))?.key ?? null;

  function goTo(s: OnPremScreen) {
    setAsyncMode("idle");
    navigate(ONPREM_SCREENS.find((x) => x.key === s)!.path);
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {asyncMode === "loading" ? (
        <LoadingPreview />
      ) : asyncMode === "error" ? (
        <ErrorPreview onRetry={() => setAsyncMode("idle")} />
      ) : (
        <Routes>
          <Route path="/on-premise" element={<Navigate to="/on-premise/signin" replace />} />
          <Route path="/on-premise/signin" element={<OnPremSignInPage />} />
          <Route path="/on-premise/signin/verify" element={<OnPremSignInVerifyPage />} />
          <Route path="/on-premise/forgot-password" element={<OnPremForgotPasswordPage />} />
          <Route path="/on-premise/setup" element={<OnPremSetupPage key="op-license" initialStep="license" />} />
          <Route path="/on-premise/setup/owner" element={<OnPremSetupPage key="op-owner" initialStep="owner" />} />
          <Route path="/on-premise/setup/site" element={<OnPremSetupPage key="op-site" initialStep="site" />} />
          <Route path="/on-premise/setup/operators" element={<OnPremSetupPage key="op-operators" initialStep="operators" />} />
          <Route path="/done" element={<DonePreview />} />
          {/* Real pages navigate("/") on completion. */}
          <Route path="/" element={<DonePreview />} />
          <Route path="*" element={<NotInPrototype />} />
        </Routes>
      )}

      {/* PROTOTYPE-ONLY floating tester — low opacity, reveals on hover. */}
      <div className="fixed bottom-6 right-6 z-[100] opacity-30 transition-opacity duration-200 hover:opacity-100">
        <StateTester screen={screen} onScreen={goTo} async={asyncMode} onAsync={setAsyncMode} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/on-premise/signin"]}>
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
