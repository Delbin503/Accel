/* ── Accel Cloud subscription tiers ──────────────────────────────────────
   Cloud-based SaaS pricing shown on the sign-up plan picker. Prices are in
   SGD, excl. GST. Enterprise is intentionally omitted here — it is a
   "contact us" tier surfaced as a note beneath the cards.                  */

export type CloudPlanId = "starter-cloud" | "standard-cloud" | "professional-cloud";

export interface CloudPlan {
  id: CloudPlanId;
  name: string;
  tagline: string;
  /** Per-site monthly price in SGD. 0 marks the free trial tier. */
  pricePerMonth: number;
  /** Per-site annual price in SGD (≈ 2 months free). 0 for the free tier. */
  pricePerYear: number;
  free?: boolean;
  trialDays?: number;
  /** Small print rendered under the price on the free tier. */
  footnote?: string;
  highlight?: boolean;
  features: string[];
}

export const CLOUD_PLANS: CloudPlan[] = [
  {
    id: "starter-cloud",
    name: "Starter Cloud",
    tagline: "Evaluation / proof of concept",
    pricePerMonth: 0,
    pricePerYear: 0,
    free: true,
    trialDays: 14,
    footnote: "No credit card required · +14 days when you refer 3 users",
    features: [
      "1 site · 1 camera",
      "1 owner seat",
      "30-day cloud retention",
      "10 min/mo Run Analysis",
      "Live wall + detection feed (view only)",
      "Online documentation support",
    ],
  },
  {
    id: "standard-cloud",
    name: "Standard Cloud",
    tagline: "For a single small site",
    pricePerMonth: 599,
    pricePerYear: 5_990,
    features: [
      "1 site · up to 10 cameras",
      "5 seats (1 owner + 4)",
      "30-day cloud retention",
      "125 min/mo Run Analysis · rollover",
      "Incident cases + basic rule library",
      "Build up to 5 models",
      "Email support (business hours)",
    ],
  },
  {
    id: "professional-cloud",
    name: "Professional Cloud",
    tagline: "For multi-site operations",
    pricePerMonth: 2_499,
    pricePerYear: 24_990,
    highlight: true,
    features: [
      "Up to 5 sites · 50 cameras",
      "15 seats (1 owner + 14)",
      "90-day cloud retention",
      "1,000 min/mo Run Analysis · rollover",
      "Full VLM model selection",
      "Detection zones + full rule library",
      "Build up to 20 models",
      "SLA + dedicated CSM",
    ],
  },
];

export function getCloudPlan(id: CloudPlanId): CloudPlan {
  return CLOUD_PLANS.find((p) => p.id === id) ?? CLOUD_PLANS[0];
}

/** Maps a cloud plan onto the nearest legacy PlanTier for mock subscription records. */
export const CLOUD_PLAN_TO_TIER: Record<CloudPlanId, "starter" | "professional" | "enterprise"> = {
  "starter-cloud": "starter",
  "standard-cloud": "professional",
  "professional-cloud": "enterprise",
};
