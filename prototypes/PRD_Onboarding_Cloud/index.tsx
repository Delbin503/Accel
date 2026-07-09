import * as React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import SignInPage from "@/pages/auth/SignIn";
import SignInVerifyPage from "@/pages/auth/SignInVerify";
import SignUpPage from "@/pages/auth/SignUp";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import { StateTester } from "./StateTester";
import {
  CLOUD_SCREENS,
  type CloudScreen,
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

  // Current screen is derived from the route (best-match by path).
  const screen: CloudScreen | null =
    [...CLOUD_SCREENS].reverse().find((s) => location.pathname.startsWith(s.path))?.key ?? null;

  function goTo(s: CloudScreen) {
    setAsyncMode("idle");
    navigate(CLOUD_SCREENS.find((x) => x.key === s)!.path);
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {asyncMode === "loading" ? (
        <LoadingPreview />
      ) : asyncMode === "error" ? (
        <ErrorPreview onRetry={() => setAsyncMode("idle")} />
      ) : (
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signin/verify" element={<SignInVerifyPage />} />
          <Route path="/signup" element={<SignUpPage key="su-account" />} />
          {/* Deep-link into the real SignUp wizard steps via initialStep. */}
          <Route path="/signup/plan" element={<SignUpPage key="su-plan" initialStep="plan" />} />
          <Route path="/signup/payment" element={<SignUpPage key="su-payment" initialStep="payment" />} />
          <Route path="/signup/site" element={<SignUpPage key="su-site" initialStep="site" />} />
          <Route path="/signup/team" element={<SignUpPage key="su-team" initialStep="team" />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/done" element={<DonePreview />} />
          {/* Real pages navigate("/") on completion. */}
          <Route path="/" element={<DonePreview />} />
          <Route path="*" element={<NotInPrototype />} />
        </Routes>
      )}

      {/* PROTOTYPE-ONLY floating tester — low opacity, reveals on hover. */}
      <div className="fixed top-6 right-6 z-[100] opacity-30 transition-opacity duration-200 hover:opacity-100">
        <StateTester screen={screen} onScreen={goTo} async={asyncMode} onAsync={setAsyncMode} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <MemoryRouter initialEntries={["/signin"]}>
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
