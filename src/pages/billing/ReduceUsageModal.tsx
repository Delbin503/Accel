import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Building2, Camera, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@/components/shared/Modal";
import { PLANS, type PlanTier } from "@/mocks/licenses";
import { limitOf, type UsageMember, type UsageSite } from "./usageLimits";

/* Downgrade guard: the account uses more sites, cameras or members than the
   smaller plan allows. The plan is NOT changed. Each limit that's over says
   how much to reduce, and its Manage button opens the page where that's done
   (Site Management, Cameras, User Management). Once usage fits, the owner
   comes back and switches again. */

interface Overage {
  key: "sites" | "cameras" | "seats";
  icon: React.ElementType;
  title: string;
  used: number;
  limit: number;
  /** "max on a site" for the per-site camera limit. */
  unit?: string;
  hint: string;
  reduction: number;
  manageLabel: string;
  href: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Mount only while a downgrade is blocked. */
export function ReduceUsageModal({ tier, currentTier, sites, members, onClose }: {
  tier: PlanTier;
  currentTier: PlanTier;
  sites: UsageSite[];
  members: UsageMember[];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const plan = PLANS[tier];
  const siteLimit = limitOf(plan.siteLimit);
  const camLimit = limitOf(plan.cameraLimit);
  const userLimit = limitOf(plan.userLimit);

  const overSites = sites.filter((s) => s.cameras > camLimit);
  const camsOver = overSites.reduce((n, s) => n + (s.cameras - camLimit), 0);

  const items: Overage[] = [];
  if (sites.length > siteLimit) {
    const n = sites.length - siteLimit;
    items.push({
      key: "sites", icon: Building2, title: "Sites", used: sites.length, limit: siteLimit,
      hint: `Reduce sites by ${n} before switching to this plan.`,
      reduction: n, manageLabel: "Manage sites", href: "/site/overview",
    });
  }
  if (overSites.length > 0) {
    items.push({
      key: "cameras", icon: Camera, title: "Cameras per site", used: Math.max(...overSites.map((s) => s.cameras)), limit: camLimit, unit: "max on a site",
      hint: `Turn off ${plural(camsOver, "camera")} on ${overSites.map((s) => `${s.name} (${s.cameras})`).join(", ")} — the ${plan.name} plan allows ${camLimit} per site.`,
      reduction: camsOver, manageLabel: "Manage cameras", href: "/site/cameras",
    });
  }
  if (members.length > userLimit) {
    const n = members.length - userLimit;
    items.push({
      key: "seats", icon: Users, title: "Seats", used: members.length, limit: userLimit,
      hint: `Remove ${plural(n, "member")} before switching to this plan. Unassigned seats are dropped automatically.`,
      reduction: n, manageLabel: "Manage users", href: "/users",
    });
  }

  function manage(href: string) {
    onClose();
    navigate(href);
  }

  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Reduce usage before switching plans"
          description={`Your workspace is over the ${plan.name} plan limits.`}
        />
        <ModalBody className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your workspace is over the <strong className="text-foreground">{plan.name}</strong> plan limits. Resolve the limits below, then try switching again.
          </p>

          <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
            <p className="text-sm text-muted-foreground">
              The plan was not changed. Billing stays on <strong className="text-foreground">{PLANS[currentTier].name}</strong> until these limits are within range.
            </p>
          </div>

          {items.map((it) => (
            <section key={it.key} className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-start gap-3 px-3 py-3">
                <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-md border border-sev-critical/30 bg-sev-critical/10">
                  <it.icon className="size-4 text-sev-critical" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="text-md font-semibold text-foreground">{it.title}</p>
                    <p className="ml-auto shrink-0 font-mono text-sm font-semibold text-foreground">
                      {it.used} <span className="text-muted-foreground">/ {it.limit}</span>
                    </p>
                  </div>
                  {it.unit && <p className="text-right text-3xs uppercase tracking-wider text-muted-foreground">{it.unit}</p>}
                  <p className="mt-0.5 text-sm text-muted-foreground">{it.hint}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
                <p className="text-xs text-muted-foreground">
                  Required reduction: <strong className="font-semibold text-foreground">{it.reduction}</strong>
                </p>
                <Button size="sm" variant="outline" onClick={() => manage(it.href)} className="gap-1.5">
                  {it.manageLabel} <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </section>
          ))}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Stay on current plan</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
