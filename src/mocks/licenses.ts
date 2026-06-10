import type { UserRole } from "@/types/users";

/* ── Plan tiers ──────────────────────────────────────────────────────────
   Each plan is purchased per-site. A workspace with multiple sites needs
   one subscription per site. Pricing is per-site, per-month.              */

export type PlanTier = "starter" | "professional" | "enterprise";

export interface Plan {
  tier: PlanTier;
  name: string;
  tagline: string;
  pricePerMonth: number;          // per site
  pricePerYear: number;           // per site, with annual discount
  cameraLimit: number | "unlimited";
  nvrLimit: number | "unlimited";
  userLimit: number | "unlimited";
  retentionDays: number;          // recording retention
  highlight?: boolean;            // marketing highlight
  features: string[];
  excludedFeatures?: string[];    // for comparison clarity
}

export const PLANS: Record<PlanTier, Plan> = {
  starter: {
    tier: "starter",
    name: "Starter",
    tagline: "For small teams getting started",
    pricePerMonth: 149,
    pricePerYear: 1_490, // ~17% off
    cameraLimit: 5,
    nvrLimit: 1,
    userLimit: 10,
    retentionDays: 30,
    features: [
      "Up to 5 cameras per site",
      "Up to 10 users",
      "30-day recording retention",
      "Real-time detection feed",
      "Standard rule library",
      "Email notifications",
      "Email support (next business day)",
    ],
    excludedFeatures: [
      "Advanced AI models",
      "Multi-site dashboard",
      "API access",
      "SSO / SAML",
    ],
  },
  professional: {
    tier: "professional",
    name: "Professional",
    tagline: "For growing operations",
    pricePerMonth: 399,
    pricePerYear: 3_990,
    cameraLimit: 25,
    nvrLimit: 3,
    userLimit: 50,
    retentionDays: 90,
    highlight: true,
    features: [
      "Up to 25 cameras per site",
      "Up to 50 users",
      "90-day recording retention",
      "Real-time detection feed",
      "Full rule library + custom rules",
      "Advanced AI model deployment",
      "Webhooks + Slack + PagerDuty",
      "Priority support (4 hr response)",
      "Multi-site dashboard",
    ],
    excludedFeatures: [
      "Unlimited cameras",
      "API access",
      "SSO / SAML",
      "Dedicated success manager",
    ],
  },
  enterprise: {
    tier: "enterprise",
    name: "Enterprise",
    tagline: "For large deployments at scale",
    pricePerMonth: 999,
    pricePerYear: 9_990,
    cameraLimit: "unlimited",
    nvrLimit: "unlimited",
    userLimit: "unlimited",
    retentionDays: 365,
    features: [
      "Unlimited cameras per site",
      "Unlimited users",
      "1-year recording retention",
      "Real-time detection feed",
      "Full rule library + custom rules",
      "All AI models + custom training",
      "Webhooks + Slack + PagerDuty + custom",
      "Dedicated 24/7 support",
      "Multi-site dashboard",
      "API access",
      "SSO / SAML / SCIM",
      "Dedicated success manager",
      "Custom data residency",
    ],
  },
};

/* ── Site subscriptions ─────────────────────────────────────────────────── */

export type SubscriptionStatus = "active" | "trial" | "past-due" | "cancelled" | "cancelling" | "payment_failed";

export interface SiteSubscription {
  id: string;
  siteId: string;
  siteName: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  billingCycle: "monthly" | "annual";
  seats: { owner: number; admin: number; user: number };
  startedAt: string;           // ISO
  startedDisplay: string;
  renewsAt: string;            // ISO
  renewsDisplay: string;
  monthlyCost: number;         // computed total
  cancellingAt?: string;       // ISO - set when status = "cancelling"
}

export const MOCK_SUBSCRIPTIONS: SiteSubscription[] = [
  {
    id: "SUB-2026-001",
    siteId: "astra-hq",
    siteName: "Astra HQ",
    planTier: "enterprise",
    status: "active",
    billingCycle: "annual",
    seats: { owner: 1, admin: 4, user: 12 },
    startedAt: "2025-03-15",
    startedDisplay: "15 Mar 2025",
    renewsAt: "2027-03-15",
    renewsDisplay: "15 Mar 2027",
    monthlyCost: 999 + (1 * 50 + 4 * 25 + 12 * 10),
  },
  {
    id: "SUB-2026-002",
    siteId: "fedex-changi",
    siteName: "FedEx Changi",
    planTier: "professional",
    status: "active",
    billingCycle: "annual",
    seats: { owner: 1, admin: 2, user: 8 },
    startedAt: "2025-06-22",
    startedDisplay: "22 Jun 2025",
    renewsAt: "2026-06-22",
    renewsDisplay: "22 Jun 2026",
    monthlyCost: 399 + (1 * 50 + 2 * 25 + 8 * 10),
  },
  {
    id: "SUB-2026-003",
    siteId: "sembawang-naval",
    siteName: "Sembawang Naval",
    planTier: "enterprise",
    status: "active",
    billingCycle: "monthly",
    seats: { owner: 0, admin: 3, user: 6 },
    startedAt: "2026-01-10",
    startedDisplay: "10 Jan 2026",
    renewsAt: "2026-07-10",
    renewsDisplay: "10 Jul 2026",
    monthlyCost: 999 + (0 * 50 + 3 * 25 + 6 * 10),
  },
  {
    id: "SUB-2026-004",
    siteId: "astra-jakarta",
    siteName: "Astra Jakarta",
    planTier: "starter",
    status: "trial",
    billingCycle: "monthly",
    seats: { owner: 0, admin: 1, user: 2 },
    startedAt: "2026-05-20",
    startedDisplay: "20 May 2026",
    renewsAt: "2026-06-19",
    renewsDisplay: "19 Jun 2026 (Trial)",
    monthlyCost: 149 + (0 * 50 + 1 * 25 + 2 * 10),
  },
];

/* ── Seat pricing per role ──────────────────────────────────────────────── */

export interface SeatTier {
  role: UserRole;
  label: string;
  description: string;
  pricePerMonth: number;
}

export const SEAT_PRICING: Record<UserRole, SeatTier> = {
  owner: {
    role: "owner",
    label: "Owner",
    description: "Full control — billing, ownership transfer, all permissions",
    pricePerMonth: 50,
  },
  admin: {
    role: "admin",
    label: "Admin",
    description: "Can grant any permission, manage users, configure rules and models",
    pricePerMonth: 25,
  },
  user: {
    role: "user",
    label: "User",
    description: "Site-scoped daily users — view dashboards, dismiss violations, run analyses",
    pricePerMonth: 10,
  },
};

/* ── Backward-compat: aggregated seat totals across all subscriptions ──── */

export const MOCK_SEATS: Record<UserRole, { role: UserRole; label: string; description: string; total: number; pricePerMonth: number }> = {
  owner: {
    role: "owner",
    label: "Owner",
    description: SEAT_PRICING.owner.description,
    total: MOCK_SUBSCRIPTIONS.reduce((s, x) => s + x.seats.owner, 0),
    pricePerMonth: SEAT_PRICING.owner.pricePerMonth,
  },
  admin: {
    role: "admin",
    label: "Admin",
    description: SEAT_PRICING.admin.description,
    total: MOCK_SUBSCRIPTIONS.reduce((s, x) => s + x.seats.admin, 0),
    pricePerMonth: SEAT_PRICING.admin.pricePerMonth,
  },
  user: {
    role: "user",
    label: "User",
    description: SEAT_PRICING.user.description,
    total: MOCK_SUBSCRIPTIONS.reduce((s, x) => s + x.seats.user, 0),
    pricePerMonth: SEAT_PRICING.user.pricePerMonth,
  },
};

export const ORG_LICENSE_INFO = {
  plan: "Multi-site",
  billingCycle: "Mixed",
  nextInvoiceDate: "01 Jul 2026",
  nextInvoiceAmount: MOCK_SUBSCRIPTIONS.reduce((s, x) => s + x.monthlyCost, 0),
  paymentMethod: "Visa ending 4242",
  contractEndDate: "—",
};

/* ── Invoices (now span multiple subscriptions) ────────────────────────── */

export interface Invoice {
  id: string;
  issuedDisplay: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  periodDisplay: string;
  /** Sites this invoice covers (sums per-site subscription billing). */
  siteNames?: string[];
}

export const MOCK_INVOICES: Invoice[] = [
  { id: "INV-2026-006", issuedDisplay: "01 Jun 2026", amount: 2280, status: "failed",  periodDisplay: "Jun 2026", siteNames: ["Astra HQ", "FedEx Changi", "Sembawang Naval", "Astra Jakarta"] },
  { id: "INV-2026-005", issuedDisplay: "01 May 2026", amount: 2230, status: "paid",    periodDisplay: "May 2026", siteNames: ["Astra HQ", "FedEx Changi", "Sembawang Naval", "Astra Jakarta"] },
  { id: "INV-2026-004", issuedDisplay: "01 Apr 2026", amount: 2080, status: "paid",    periodDisplay: "Apr 2026", siteNames: ["Astra HQ", "FedEx Changi", "Sembawang Naval"] },
  { id: "INV-2026-003", issuedDisplay: "01 Mar 2026", amount: 1980, status: "paid",    periodDisplay: "Mar 2026", siteNames: ["Astra HQ", "FedEx Changi", "Sembawang Naval"] },
  { id: "INV-2026-002", issuedDisplay: "01 Feb 2026", amount: 1980, status: "paid",    periodDisplay: "Feb 2026", siteNames: ["Astra HQ", "FedEx Changi", "Sembawang Naval"] },
  { id: "INV-2026-001", issuedDisplay: "01 Jan 2026", amount: 1980, status: "paid",    periodDisplay: "Jan 2026", siteNames: ["Astra HQ", "FedEx Changi", "Sembawang Naval"] },
  { id: "INV-2025-012", issuedDisplay: "01 Dec 2025", amount: 1480, status: "paid",    periodDisplay: "Dec 2025", siteNames: ["Astra HQ", "FedEx Changi"] },
];

/* ── Helper: get a plan by tier ─────────────────────────────────────────── */

export function getPlan(tier: PlanTier): Plan {
  return PLANS[tier];
}

export function formatCameraLimit(n: number | "unlimited"): string {
  return n === "unlimited" ? "Unlimited cameras" : `Up to ${n} cameras`;
}

export function formatUserLimit(n: number | "unlimited"): string {
  return n === "unlimited" ? "Unlimited users" : `Up to ${n} users`;
}
