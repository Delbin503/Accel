import { PLANS, type PlanTier } from "@/mocks/licenses";

/* Usage the downgrade guard checks against a plan's limits (see ReduceUsageModal). */

export interface UsageSite {
  id: string;
  name: string;
  cameras: number;
}

export interface UsageMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "user";
}

export const limitOf = (v: number | "unlimited") => (v === "unlimited" ? Infinity : v);

/** Whether the account's usage is over the plan's limits — decides if the reduce-usage modal is needed. */
export function overLimits(tier: PlanTier, sites: UsageSite[], members: UsageMember[]) {
  const plan = PLANS[tier];
  const camLimit = limitOf(plan.cameraLimit);
  const userLimit = limitOf(plan.userLimit);
  return {
    sites: sites.length > limitOf(plan.siteLimit),
    cameras: sites.some((s) => s.cameras > camLimit),
    // Only members block the switch: unassigned paid seats drop on their own.
    seats: members.length > userLimit,
  };
}
