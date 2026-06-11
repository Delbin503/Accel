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

/** Accel brand mark — matches the sidebar logo (orange play triangle + wordmark). */
export function AccelMark({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-9" : "size-7";
  const mark = size === "lg" ? "size-5" : "size-4";
  const word = size === "lg" ? "text-xl" : "text-base";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex ${box} items-center justify-center rounded-md bg-primary`}>
        <svg viewBox="0 0 14 14" className={`${mark} fill-primary-foreground`} aria-hidden>
          <polygon points="2,1 13,7 2,13" />
        </svg>
      </div>
      <span className={`${word} font-bold tracking-tight text-foreground`}>Accel</span>
    </div>
  );
}
