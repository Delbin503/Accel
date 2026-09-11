import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CircleAlert,
  Cctv as CameraIcon,
  Film,
  FolderOpen,
  HardDrive,
  History,
  MapPin,
  Pin,
  PinOff,
  Search,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  useGlobalSearch,
  matches,
  parseQuery,
  TYPE_LABELS,
  type SearchResult,
  type SearchResultType,
} from "@/hooks/useGlobalSearch";
import { actionsForRole, type QuickAction } from "@/lib/quickActions";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQuickActionsStore, type RecentEntry } from "@/stores/useQuickActionsStore";
import { useCommandPaletteStore } from "@/stores/useCommandPaletteStore";

/* ─── Icons per result type ─────────────────────────────────────────────── */

const TYPE_ICONS: Record<SearchResultType, React.ElementType> = {
  camera: CameraIcon,
  site: MapPin,
  nvr: HardDrive,
  case: FolderOpen,
  detection: AlertTriangle,
  recording: Film,
  model: Brain,
  rule: BookOpen,
  user: UserRound,
};

function iconForRecent(type: string): React.ElementType {
  if (type === "action") return Sparkles;
  return TYPE_ICONS[type as SearchResultType] ?? Search;
}

/* ─── Row ───────────────────────────────────────────────────────────────── */

interface RowProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  badge?: string;
  value: string;
  onSelect: () => void;
  /** Renders the pin affordance; only actions are pinnable. */
  pin?: { pinned: boolean; onToggle: () => void };
}

function Row({ icon: Icon, label, sublabel, badge, value, onSelect, pin }: RowProps) {
  return (
    <CommandItem value={value} onSelect={onSelect} className="group gap-2.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-base text-foreground">{label}</span>
        {sublabel && (
          <span className="truncate text-2xs text-muted-foreground">{sublabel}</span>
        )}
      </span>

      {badge && (
        <StatusBadge tone="neutral" dot={false} className="shrink-0">
          {badge}
        </StatusBadge>
      )}

      {pin && (
        <button
          type="button"
          aria-label={pin.pinned ? `Unpin ${label}` : `Pin ${label}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pin.onToggle();
          }}
          className={cn(
            "shrink-0 rounded-md p-1 text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            !pin.pinned && "opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100"
          )}
        >
          {pin.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
        </button>
      )}
    </CommandItem>
  );
}

/* ─── Loading / error / empty bodies ────────────────────────────────────── */

function ResultsSkeleton() {
  return (
    <div className="space-y-2 px-4 py-3" aria-busy="true" aria-label="Searching">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="size-4 rounded-md" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-muted-foreground">
      <CircleAlert className="size-5 text-destructive" />
      <p className="text-sm">Search is unavailable right now.</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function NoResults({ term }: { term: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-muted-foreground">
      <Search className="size-5" />
      <p className="text-sm">No matches for “{term}”.</p>
      <p className="text-2xs">Try a shorter term, or scope it with cam: site: case: rule:</p>
    </div>
  );
}

/* ─── Palette ───────────────────────────────────────────────────────────── */

export function CommandPalette() {
  const navigate = useNavigate();
  const open = useCommandPaletteStore((s) => s.open);
  const mode = useCommandPaletteStore((s) => s.mode);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const openPalette = useCommandPaletteStore((s) => s.openPalette);

  const role = useAuthStore((s) => s.user?.role);
  const pinnedIds = useQuickActionsStore((s) => s.pinnedIds);
  const togglePin = useQuickActionsStore((s) => s.togglePin);
  const recents = useQuickActionsStore((s) => s.recents);
  const disabledIds = useQuickActionsStore((s) => s.disabledIds);
  const showRecents = useQuickActionsStore((s) => s.showRecents);
  const pushRecent = useQuickActionsStore((s) => s.pushRecent);

  const query = useCommandPaletteStore((s) => s.query);
  const setQuery = useCommandPaletteStore((s) => s.setQuery);
  const search = useGlobalSearch(query);

  /* ⌘K / Ctrl+K opens search, ⌘J / Ctrl+J opens the actions face. */
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if ((key === "k" || key === "j") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openPalette(key === "k" ? "search" : "actions");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openPalette]);

  const actions = React.useMemo(
    () => actionsForRole(role).filter((a) => !disabledIds.includes(a.id)),
    [role, disabledIds]
  );
  const pinnedActions = React.useMemo(
    () => pinnedIds.map((id) => actions.find((a) => a.id === id)).filter((a): a is QuickAction => !!a),
    [pinnedIds, actions]
  );

  const parsed = React.useMemo(() => parseQuery(query), [query]);
  /* Actions are matched here rather than by cmdk so entities and actions share
     one matcher (and one `prefix:` grammar). */
  const matchedActions = React.useMemo(() => {
    const term = parsed.term.trim();
    if (parsed.only !== null || term.length < 2) return [];
    return actions.filter((a) => matches(`${a.label} ${a.group} ${(a.keywords ?? []).join(" ")}`, term));
  }, [actions, parsed]);

  const go = React.useCallback(
    (entry: RecentEntry) => {
      pushRecent(entry);
      setOpen(false);
      navigate(entry.to, entry.state ? { state: entry.state } : undefined);
    },
    [navigate, pushRecent, setOpen]
  );

  const runAction = React.useCallback(
    (action: QuickAction) =>
      go({
        key: `action:${action.id}`,
        label: action.label,
        type: "action",
        sublabel: action.group,
        to: action.to,
        state: action.state,
      }),
    [go]
  );

  const openResult = React.useCallback(
    (result: SearchResult) =>
      go({
        key: result.key,
        label: result.label,
        type: result.type,
        sublabel: result.sublabel,
        to: result.to,
        state: result.state,
      }),
    [go]
  );

  const idle = !search.isActive;
  const showResults = search.isActive && !search.isLoading && !search.error;
  const nothingFound = showResults && search.groups.length === 0 && matchedActions.length === 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Search and quick actions"
      description="Search cameras, sites, cases, recordings and more, or run a quick action."
      className="top-[10%]"
      shouldFilter={false}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={
          mode === "actions"
            ? "Run an action, or search anything…"
            : "Search cameras, cases, rules, users… or type an action"
        }
      />

      <CommandList>
        {/* Idle — recents, pins, and the action catalogue. */}
        {idle && (
          <>
            {mode === "search" && showRecents && recents.length > 0 && (
              <CommandGroup heading="Recent">
                {recents.map((r) => (
                  <Row
                    key={r.key}
                    value={`recent-${r.key}`}
                    icon={iconForRecent(r.type)}
                    label={r.label}
                    sublabel={r.sublabel}
                    badge={r.type === "action" ? "Action" : TYPE_LABELS[r.type as SearchResultType]}
                    onSelect={() => go(r)}
                  />
                ))}
              </CommandGroup>
            )}

            {pinnedActions.length > 0 && (
              <CommandGroup heading="Pinned">
                {pinnedActions.map((a) => (
                  <Row
                    key={a.id}
                    value={`pinned-${a.id}`}
                    icon={a.icon}
                    label={a.label}
                    sublabel={a.group}
                    onSelect={() => runAction(a)}
                    pin={{ pinned: true, onToggle: () => togglePin(a.id) }}
                  />
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            <CommandGroup heading="All actions">
              {actions.map((a) => (
                <Row
                  key={a.id}
                  value={`action-${a.id}`}
                  icon={a.icon}
                  label={a.label}
                  sublabel={a.group}
                  onSelect={() => runAction(a)}
                  pin={{ pinned: pinnedIds.includes(a.id), onToggle: () => togglePin(a.id) }}
                />
              ))}
            </CommandGroup>
          </>
        )}

        {search.isActive && search.isLoading && <ResultsSkeleton />}
        {search.isActive && search.error && <SearchError onRetry={search.retry} />}

        {showResults && (
          <>
            {matchedActions.length > 0 && (
              <CommandGroup heading="Actions">
                {matchedActions.map((a) => (
                  <Row
                    key={a.id}
                    value={`match-action-${a.id}`}
                    icon={a.icon}
                    label={a.label}
                    sublabel={a.group}
                    onSelect={() => runAction(a)}
                    pin={{ pinned: pinnedIds.includes(a.id), onToggle: () => togglePin(a.id) }}
                  />
                ))}
              </CommandGroup>
            )}

            {search.groups.map((group) => (
              <CommandGroup key={group.type} heading={group.label}>
                {group.results.map((r) => (
                  <Row
                    key={r.key}
                    value={`result-${r.key}`}
                    icon={r.isSavedQuery ? Search : TYPE_ICONS[r.type]}
                    label={r.label}
                    sublabel={r.sublabel}
                    badge={r.isSavedQuery ? "Filtered view" : undefined}
                    onSelect={() => openResult(r)}
                  />
                ))}
                {group.seeAll && (
                  <Row
                    key={`${group.type}-see-all`}
                    value={`see-all-${group.type}`}
                    icon={TYPE_ICONS[group.type]}
                    label={`${group.seeAll.label} (${group.total})`}
                    onSelect={() =>
                      go({
                        key: `see-all:${group.type}`,
                        label: group.seeAll!.label,
                        type: group.type,
                        to: group.seeAll!.to,
                      })
                    }
                  />
                )}
              </CommandGroup>
            ))}
          </>
        )}

        {nothingFound && <NoResults term={search.term} />}
      </CommandList>

      {/* Footer — keyboard contract, always visible. */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-2xs text-muted-foreground">
        <span className="flex items-center gap-3">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <History className="size-3" />
          Scope with cam: site: case: rule: model: user:
        </span>
      </div>
    </CommandDialog>
  );
}
