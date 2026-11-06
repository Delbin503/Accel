import { ACCOUNT_SUBSCRIPTION, accountMonthly } from "@/mocks/licenses";
import { MOCK_DEPLOYMENTS } from "@/mocks/deployments";
import { MOCK_SITES_FULL } from "@/mocks/sites";

/**
 * Mock values for the gallery's inline confirms — the ConfirmDialogs pages
 * build in place (user menu, model deployment, floor plan, billing). Shared by
 * the gallery entries (new) and the old versions so both show the same data.
 */

export const PLAN = ACCOUNT_SUBSCRIPTION.planName;
export const RENEWS = ACCOUNT_SUBSCRIPTION.renewsDisplay;
export const SITE_COUNT = ACCOUNT_SUBSCRIPTION.sites.length;
const monthly = accountMonthly(ACCOUNT_SUBSCRIPTION.seats);
export const MONTHLY_TOTAL = `$${monthly.toLocaleString()}/month`;

export const REMOVE_MODEL = "SOP Compliance";
export const REMOVE_ROWS = MOCK_DEPLOYMENTS.filter((d) => d.modelName === REMOVE_MODEL).slice(0, 3);
export const REMOVE_ACTIVE = REMOVE_ROWS.filter((d) => d.status === "active").length;

export const FLOOR_PLAN_SITE = MOCK_SITES_FULL[0].name;
