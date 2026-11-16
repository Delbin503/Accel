/* Dev-only screen keys for the State Tester (prototype-only). */
export type OnPremScreen =
  | "signin"
  | "verify"
  | "forgot"
  | "license"
  | "owner"
  | "site"
  | "members"
  | "done";

/** Each screen → the MemoryRouter path the jumper navigates to. */
export const ONPREM_SCREENS: { key: OnPremScreen; label: string; path: string }[] = [
  { key: "signin",  label: "Sign In",   path: "/on-premise/signin" },
  { key: "verify",  label: "Verify",    path: "/on-premise/signin/verify" },
  { key: "forgot",  label: "Forgot Pw", path: "/on-premise/forgot-password" },
  { key: "license", label: "License",   path: "/on-premise/setup" },
  { key: "owner",   label: "Owner",     path: "/on-premise/setup/owner" },
  { key: "site",    label: "Site",      path: "/on-premise/setup/site" },
  { key: "members", label: "Members",   path: "/on-premise/setup/operators" },
  { key: "done",    label: "Done",      path: "/done" },
];

export type AsyncMode = "idle" | "loading" | "error";
