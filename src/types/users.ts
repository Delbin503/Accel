export type UserRole = "owner" | "admin" | "user";

export type UserStatus = "active" | "pending" | "suspended";

export interface Suspension {
  /** "permanent" | "7d" | "30d" | "custom" */
  preset: "permanent" | "7d" | "30d" | "custom";
  startedAtDisplay: string;
  endsAtDisplay: string;     // e.g. "May 26, 2026" or "Indefinite"
  suspendedBy: string;
  note?: string;
}

export interface SitePermission {
  siteId: string;
  siteName: string;
  cameraCount: number;
  grantedAtDisplay: string;
  grantedBy: string;
}

export type UserActivityKind =
  | "auth"
  | "events"
  | "cases"
  | "authorization"
  | "models"
  | "user"
  | "config"
  | "data-access"
  | "license"
  | "system"
  | "maintenance";

export interface UserActivity {
  id: string;
  kind: UserActivityKind;
  whenDisplay: string;
  text: string;
}

export interface UserData {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isCurrentUser?: boolean;

  phone?: string;
  department?: string;
  createdAtDisplay: string;
  lastActiveAt: string;
  lastActiveDisplay: string;
  lastSignInDisplay?: string;
  lastSignInRelative?: string;

  sitePermissions: SitePermission[];

  cases30d: number;
  slaMetPct: number;
  signIns30d: number;

  twoFactorEnabled: boolean;
  passwordChangedDisplay: string;

  suspension?: Suspension;

  activities: UserActivity[];
}
