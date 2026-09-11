import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Command as CommandIcon,
  Pin,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import {
  QUICK_ACTIONS,
  actionsForRole,
  actionById,
  type QuickAction,
  type QuickActionGroup,
} from "@/lib/quickActions";
import { useQuickActionsStore } from "@/stores/useQuickActionsStore";
import { useAuthStore, type UserRole } from "@/stores/useAuthStore";
import { useCommandPaletteStore } from "@/stores/useCommandPaletteStore";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. The settings surface for the ⌘K palette's Quick Actions:
   which actions exist, which are pinned, in what order, and how the palette
   behaves. Writes straight into the real `useQuickActionsStore`, so every
   change is visible in the palette the moment you press ⌘K.
   ────────────────────────────────────────────────────────────────────────── */

const GROUP_ORDER: QuickActionGroup[] = ["Monitor", "Manage", "Deploy", "System", "Account"];

const ROLES: { value: UserRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "operator", label: "Operator" },
  { value: "viewer", label: "Viewer" },
];

/* ─── Pinned order ──────────────────────────────────────────────────────── */

function PinnedRow({
  action,
  index,
  total,
}: {
  action: QuickAction;
  index: number;
  total: number;
}) {
  const movePin = useQuickActionsStore((s) => s.movePin);
  const unpin = useQuickActionsStore((s) => s.unpin);
  const Icon = action.icon;

  return (
    <li className="flex items-center gap-2.5 rounded-md border border-border bg-background px-3 py-2">
      <span className="w-4 shrink-0 text-2xs tabular-nums text-muted-foreground">{index + 1}</span>
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      <span className="min-w-0 flex-1">
        <span className="block truncate text-base text-foreground">{action.label}</span>
        <span className="block truncate text-2xs text-muted-foreground">{action.group}</span>
      </span>

      <Button
        size="icon"
        variant="ghost"
        aria-label={`Move ${action.label} up`}
        disabled={index === 0}
        onClick={() => movePin(action.id, -1)}
      >
        <ArrowUp className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Move ${action.label} down`}
        disabled={index === total - 1}
        onClick={() => movePin(action.id, 1)}
      >
        <ArrowDown className="size-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        aria-label={`Unpin ${action.label}`}
        onClick={() => unpin(action.id)}
      >
        <X className="size-3.5" />
      </Button>
    </li>
  );
}

/* ─── Availability ──────────────────────────────────────────────────────── */

function ActionRow({ action, previewRole }: { action: QuickAction; previewRole: UserRole }) {
  const disabledIds = useQuickActionsStore((s) => s.disabledIds);
  const pinnedIds = useQuickActionsStore((s) => s.pinnedIds);
  const maxPins = useQuickActionsStore((s) => s.maxPins);
  const toggleEnabled = useQuickActionsStore((s) => s.toggleEnabled);
  const togglePin = useQuickActionsStore((s) => s.togglePin);

  const Icon = action.icon;
  const enabled = !disabledIds.includes(action.id);
  const pinned = pinnedIds.includes(action.id);
  const visibleToRole = !action.roles || action.roles.includes(previewRole);
  const pinFull = !pinned && pinnedIds.length >= maxPins;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5",
        !visibleToRole && "opacity-50"
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-base text-foreground">{action.label}</p>
        <p className="truncate text-2xs text-muted-foreground">
          {action.kind === "command" ? "Command" : "Navigation"} · {action.to}
        </p>
      </div>

      {action.roles && (
        <StatusBadge tone={visibleToRole ? "info" : "neutral"} dot={false} className="shrink-0">
          {action.roles.join(" / ")}
        </StatusBadge>
      )}

      <Button
        size="sm"
        variant={pinned ? "secondary" : "ghost"}
        disabled={!enabled || (pinFull && !pinned)}
        onClick={() => togglePin(action.id)}
        className="shrink-0 gap-1.5"
        title={pinFull && !pinned ? `Pin limit reached (${maxPins})` : undefined}
      >
        <Pin className="size-3.5" />
        {pinned ? "Pinned" : "Pin"}
      </Button>

      <Switch
        checked={enabled}
        onCheckedChange={() => toggleEnabled(action.id)}
        aria-label={`${enabled ? "Disable" : "Enable"} ${action.label}`}
        className="shrink-0"
      />
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────────────────── */

export function QuickActionsSection() {
  const pinnedIds = useQuickActionsStore((s) => s.pinnedIds);
  const disabledIds = useQuickActionsStore((s) => s.disabledIds);
  const maxPins = useQuickActionsStore((s) => s.maxPins);
  const showRecents = useQuickActionsStore((s) => s.showRecents);
  const setMaxPins = useQuickActionsStore((s) => s.setMaxPins);
  const setShowRecents = useQuickActionsStore((s) => s.setShowRecents);
  const resetPreferences = useQuickActionsStore((s) => s.resetPreferences);
  const clearRecents = useQuickActionsStore((s) => s.clearRecents);
  const recents = useQuickActionsStore((s) => s.recents);

  const role = useAuthStore((s) => s.user?.role) ?? "owner";
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const openPalette = useCommandPaletteStore((s) => s.openPalette);

  const pinned = pinnedIds
    .map((id) => actionById(id))
    .filter((a): a is QuickAction => !!a);

  const visibleCount = actionsForRole(role).filter((a) => !disabledIds.includes(a.id)).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Behaviour ------------------------------------------------------- */}
      <SectionCard
        title="Palette behaviour"
        description={`${visibleCount} of ${QUICK_ACTIONS.length} actions available to the ${role} role`}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openPalette("actions")}>
              <CommandIcon className="size-3.5" />
              Test palette
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={resetPreferences}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label className="text-md">Maximum pinned actions</Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Past six, the pinned row stops being a shortcut and becomes a second nav.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {[3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPins(n)}
                  className={cn(
                    "size-8 rounded-md border text-base transition-colors duration-[var(--duration-fast)] ease-standard",
                    n === maxPins
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <Label className="text-md">Lead with recents</Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Show the last five things opened above the pinned actions ({recents.length} stored).
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button size="sm" variant="ghost" onClick={clearRecents} disabled={recents.length === 0}>
                Clear
              </Button>
              <Switch checked={showRecents} onCheckedChange={setShowRecents} aria-label="Lead with recents" />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <Label className="text-md">Preview as role</Label>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Role-gated actions are hidden from the palette, not shown-and-refused.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => user && setUser({ ...user, role: r.value })}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-sm transition-colors duration-[var(--duration-fast)] ease-standard",
                    r.value === role
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Pinned order ---------------------------------------------------- */}
      <SectionCard
        title="Pinned actions"
        description={`${pinned.length} of ${maxPins} slots used — this is the order the palette shows`}
      >
        {pinned.length === 0 ? (
          <EmptyState
            icon={Pin}
            title="Nothing pinned"
            description="Pin an action below, or from the palette itself with the pin icon on any row."
          />
        ) : (
          <ol className="flex flex-col gap-2">
            {pinned.map((a, i) => (
              <PinnedRow key={a.id} action={a} index={i} total={pinned.length} />
            ))}
          </ol>
        )}
      </SectionCard>

      {/* Availability ---------------------------------------------------- */}
      <SectionCard
        title="Available actions"
        description="Switch an action off to remove it from the palette for everyone."
        flushBody
      >
        <div className="divide-y divide-border">
          {GROUP_ORDER.map((group) => {
            const rows = QUICK_ACTIONS.filter((a) => a.group === group);
            if (rows.length === 0) return null;
            return (
              <div key={group}>
                <div className="flex items-center gap-2 bg-muted/40 px-4 py-1.5">
                  <Sparkles className="size-3 text-muted-foreground" />
                  <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {rows.map((a) => (
                    <ActionRow key={a.id} action={a} previewRole={role} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
