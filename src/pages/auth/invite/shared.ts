import type { UserRole } from "@/types/users";
import { USER_ROLE_LABELS, USER_SITES } from "@/mocks/users";

/**
 * What the invite link carries (admin-assigned, decoded server-side from the
 * one-time token). The invitee cannot change these during setup.
 */
export interface InviteContext {
  orgName: string;
  inviterName: string;
  email: string;
  role: UserRole;
  siteIds: string[];
}

/** Stand-in for the decoded invite token — mirrors what the Invite modal sends. */
export const MOCK_INVITE: InviteContext = {
  orgName: "Astra Corp",
  inviterName: "Jordan Lee",
  email: "alex.tan@astra.com",
  role: "admin",
  siteIds: ["astra", "fedex"],
};

export function siteLabels(siteIds: string[]): string {
  if (siteIds.length === USER_SITES.length) return "All sites";
  return siteIds
    .map((id) => USER_SITES.find((s) => s.value === id)?.label ?? id)
    .join(", ");
}

export function roleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role];
}
