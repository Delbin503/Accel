import { PartyPopper, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { roleLabel, siteLabels, type InviteContext } from "./shared";

export function WelcomeModal({
  open,
  firstName,
  invite,
  onEnter,
}: {
  open: boolean;
  firstName: string;
  invite: InviteContext;
  onEnter: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent
        className="w-[440px] max-w-[95vw] overflow-hidden p-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Brand banner */}
        <div className="flex flex-col items-center bg-primary-muted px-6 pb-5 pt-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <PartyPopper className="size-7" />
          </div>
          <DialogTitle className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Welcome to Accel{firstName ? `, ${firstName}` : ""}!
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-md text-muted-foreground">
            Your account is all set. You've joined{" "}
            <strong className="text-foreground">{invite.orgName}</strong> as a{" "}
            <strong className="text-foreground">{roleLabel(invite.role)}</strong>.
          </DialogDescription>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-lg border border-border bg-card p-3.5">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
              You now have access to
            </p>
            <p className="text-sm text-foreground">{siteLabels(invite.siteIds)}</p>
          </div>

          <Button onClick={onEnter} className="mt-4 w-full gap-1.5" size="lg">
            Enter dashboard
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
