import * as React from "react";
import { TooltipProvider } from "../packages/ui/src/components/ui/tooltip";
import { applyTheme } from "./theme";

/**
 * Puts the theme class on <html>, as the app does — tokens that resolve at the
 * root and portalled overlays (dialogs, popovers, tooltips) then match the theme.
 */
export function ThemeRoot({ theme, children }: { theme: string; children: React.ReactNode }) {
  // Toolbar theme switches re-render without a fresh beforeEach.
  React.useLayoutEffect(() => applyTheme(theme), [theme]);
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      {/* The app mounts one in AppLayout; stories need their own. */}
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
    </div>
  );
}
