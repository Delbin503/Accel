import { SHARED_ENTRIES } from "./shared";
import { MONITOR_ENTRIES } from "./monitor";
import { MANAGE_ENTRIES } from "./manage";
import { DEPLOY_ENTRIES } from "./deploy";
import { SYSTEM_ENTRIES } from "./system";
import { AUTH_ENTRIES } from "./auth";
import type { ModalEntry } from "../types";

/** Every modal in the app, in sidebar order: Monitor → Manage → Deploy → System → Auth → Shared. */
export const MODAL_ENTRIES: ModalEntry[] = [
  ...MONITOR_ENTRIES,
  ...MANAGE_ENTRIES,
  ...DEPLOY_ENTRIES,
  ...SYSTEM_ENTRIES,
  ...AUTH_ENTRIES,
  ...SHARED_ENTRIES,
];
