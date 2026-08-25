import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Onboarding "You're all set" modal.
 *
 * Shown after the final Finish & Enter Dashboard click in both the On-Cloud
 * and On-Premise sign-up flows. Confirms the setup completed, then hands the
 * user off to the dashboard when they click Enter Dashboard.
 */
export function SetupCompleteModal({
  open,
  onEnter,
  workspaceName,
}: {
  open: boolean;
  onEnter: () => void;
  workspaceName?: string;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-[440px] gap-0 border-border bg-card p-0 sm:max-w-[440px]"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Setup complete</DialogTitle>

        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          {/* Server icon with success ring */}
          <div className="relative mb-5 flex size-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-success/40" />
            <div className="absolute inset-1.5 rounded-full border border-success/25" />
            <div className="relative flex size-12 items-center justify-center rounded-xl border border-success/40 bg-success/10">
              <Check className="size-6 text-success" strokeWidth={2.5} />
            </div>
          </div>

          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-2xs font-bold uppercase tracking-wider text-success">
            System Setup Complete
          </span>

          <h2 className="text-xl font-bold text-foreground">You're all set</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Your {workspaceName ? `${workspaceName} workspace` : "Accel workspace"} is
            configured and ready for the first live monitoring session.
          </p>

          <Button onClick={onEnter} className="mt-6 h-10 w-full gap-1.5 text-sm">
            Enter dashboard <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
