import { MOCK_USERS } from "@/mocks/users";

/* Dev-only screen keys for the State Tester (prototype-only). */
export type CloudScreen =
  | "signin"
  | "verify"
  | "suspended"
  | "signup"
  | "forgot"
  | "plan"
  | "payment"
  | "site"
  | "members"
  | "review";

/**
 * The suspended screen reads who suspended the account and why off router
 * state, which the real SignIn hands it. Jumping straight to it from the
 * tester has no such state, so the prototype supplies a representative
 * account — taken from the seeded users so it matches what User Management
 * shows for the same person.
 */
const suspendedUser = MOCK_USERS.find((u) => u.status === "suspended" && u.suspension);

export const SUSPENDED_DEMO_STATE = {
  email: suspendedUser?.email ?? "kelvin@bluesilo.studio",
  suspension: suspendedUser?.suspension,
};

/** Each screen → the MemoryRouter path the jumper navigates to. The wizard
 *  steps deep-link into the real SignUp flow via its `initialStep` prop.
 *  `state` is passed to navigate() for screens that need router state. */
export const CLOUD_SCREENS: { key: CloudScreen; label: string; path: string; state?: unknown }[] = [
  { key: "signin",    label: "Sign In",     path: "/signin" },
  { key: "verify",    label: "Verify",      path: "/signin/verify" },
  { key: "suspended", label: "Suspended",   path: "/account-suspended", state: SUSPENDED_DEMO_STATE },
  { key: "signup",    label: "Sign Up",     path: "/signup" },
  { key: "forgot",    label: "Forgot Pw",   path: "/forgot-password" },
  { key: "plan",      label: "Choose Plan", path: "/signup/plan" },
  { key: "payment",   label: "Payment",     path: "/signup/payment" },
  { key: "site",      label: "Create Site", path: "/signup/site" },
  { key: "members",   label: "Members",     path: "/signup/team" },
  { key: "review",    label: "Review",      path: "/signup/review" },
];

export type AsyncMode = "idle" | "loading" | "error";
