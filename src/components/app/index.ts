// Accel-specific components: they depend on app state, routing, mock data
// or product flows, so they are NOT part of the reusable design system.
// Reusable composites live in components/shared.
export { ThemeToggle } from "./ThemeToggle";
export { SystemStatusMenu } from "./SystemStatusMenu";
export { UserMenu } from "./UserMenu";
export { CommandPalette } from "./CommandPalette";
export { GlobalSearchTrigger, QuickActionsTrigger } from "./GlobalSearchTrigger";
export { SyncProgressModal } from "./SyncProgressModal";
export type { SyncProgressModalProps } from "./SyncProgressModal";
