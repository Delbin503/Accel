import * as React from "react";
import { Search, X, LayoutGrid, ArrowLeft, ArrowRight, CornerDownLeft } from "lucide-react";
import { PageHeader, PageHeaderContent, PageHeaderTitle } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { ModalChromeProvider } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { MODAL_ENTRIES } from "./entries";
import { LEGACY_CONFIRMS } from "./entries/legacyConfirms";
import type { ModalEntry, ModalKind } from "./types";

/**
 * Modal Gallery — every dialog, drawer and wizard in the app, mounted with
 * representative mock props so the whole modal layer can be reviewed in one
 * pass. Dev-only surface: reachable at /dev/modals, not linked from the
 * sidebar.
 */

const KIND_LABELS: Record<ModalKind, string> = {
  modal: "Modal",
  confirm: "Confirm",
  wizard: "Wizard",
  drawer: "Drawer",
  progress: "Progress",
};

const KIND_STYLES: Record<ModalKind, string> = {
  modal: "border-info/30 bg-info/10 text-info",
  confirm: "border-warning/30 bg-warning/10 text-warning",
  wizard: "border-primary/30 bg-primary/10 text-primary",
  drawer: "border-success/30 bg-success/10 text-success",
  progress: "border-border bg-muted text-muted-foreground",
};

const KIND_ORDER: ModalKind[] = ["modal", "confirm", "wizard", "drawer", "progress"];

/* ── Filter chip ────────────────────────────────────────────────────────── */

function FilterChip({
  active, onClick, children, count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-[var(--duration-fast)] ease-standard",
        active
          ? "border-primary/40 bg-primary/15 text-foreground"
          : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {children}
      <span className="font-mono text-2xs text-muted-foreground">{count}</span>
    </button>
  );
}

/* ── Entry card ─────────────────────────────────────────────────────────── */

function EntryCard({ entry, onOpen }: { entry: ModalEntry; onOpen: () => void }) {
  return (
    <button
      id={entry.id}
      onClick={onOpen}
      className="group flex scroll-mt-6 flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors duration-[var(--duration-fast)] ease-standard hover:border-primary/40 hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-md font-semibold text-foreground group-hover:text-primary">
          {entry.name}
        </span>
        <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wider", KIND_STYLES[entry.kind])}>
          {KIND_LABELS[entry.kind]}
        </span>
      </div>
      <p className="text-sm leading-snug text-muted-foreground">{entry.trigger}</p>
      {entry.note && (
        <p className="text-xs leading-snug text-muted-foreground/70">{entry.note}</p>
      )}
      <p className="truncate font-mono text-2xs text-muted-foreground/60" title={entry.file}>
        {entry.file}
      </p>
    </button>
  );
}

/* ── Redesign preview ───────────────────────────────────────────────────── */

/** Kinds the gallery previews in the plain chrome (bigger title, no description, divider or icons). */
const PLAIN_KINDS: ModalKind[] = ["confirm", "wizard", "progress"];

/**
 * Entries restyled in place: the same component in the plain chrome with the
 * "tidy" frame (550px, capped height that scrolls, no Cancel) — used for long
 * forms and full editors where a copy would duplicate too much.
 */
const IN_PLACE_IDS = [
  "floor-plan-editor",
  "model-create",
  "model-add-step",
  "model-edit-step",
  "model-extract-rules",
  "model-add-rule",
  "case-change-status",
  "case-reassign",
  "case-link-incidents",
  "case-edit",
  "rule-condition",
  "run-confirm",
  "run-purchase",
  "deploy-confirm",
  "signup-invite-users",
  "onprem-member",
  "invite-welcome",
  "setup-complete",
  "guide-draw-area",
  "guide-place-camera",
  "user-invite",
  "user-manage-sites",
  "user-edit",
  "user-suspend",
  "profile-change-password",
  "profile-2fa",
  "billing-add-card",
  "billing-retry-payment",
  "billing-purchase-plan",
  "billing-switch-annual",
  "user-change-role",
  "user-accept-ownership",
  "draw-zone",
  "draw-zone-wizard",
  "recording-player",
];

/**
 * In-place entries that get the plain header but not the tidy frame: full
 * editors and players, and modals whose ghost button is a real action, not Cancel.
 */
const NO_TIDY_IDS = [
  "floor-plan-editor",
  "model-extract-rules",
  // Ghost / outline footer buttons here are real steps (Back, Decline, Skip), not Cancel.
  "user-change-role",
  "user-accept-ownership",
  "draw-zone",
  "draw-zone-wizard",
  // Media player: no footer, extra-large.
  "recording-player",
];

/** Redesigned entries that keep their own width: canvas / full-bleed editors. */
const OWN_WIDTH_IDS = ["draw-zone", "draw-zone-wizard", "floor-plan-editor"];

/** Every redesigned modal shares the confirm width (550px) except the editors above. */
function isUniformWidth(entry: ModalEntry) {
  return isRedesigned(entry) && !OWN_WIDTH_IDS.includes(entry.id);
}

function isTidy(entry: ModalEntry) {
  return IN_PLACE_IDS.includes(entry.id) && !NO_TIDY_IDS.includes(entry.id);
}

/**
 * The "old" side of a redesigned entry: a frozen pre-redesign copy (from
 * legacy/) when the page component has changed, otherwise the same component
 * in the classic chrome.
 */
function oldRenderFor(entry: ModalEntry) {
  return (
    LEGACY_CONFIRMS[entry.id] ??
    entry.legacyRender ??
    (PLAIN_KINDS.includes(entry.kind) || IN_PLACE_IDS.includes(entry.id) ? entry.render : undefined)
  );
}

/** Entries shown in the plain chrome: redesigned kinds, plus any entry with a redesigned copy. */
function isRedesigned(entry: ModalEntry) {
  return PLAIN_KINDS.includes(entry.kind) || IN_PLACE_IDS.includes(entry.id) || Boolean(LEGACY_CONFIRMS[entry.id]);
}

/* ── Compare card (old vs new) ──────────────────────────────────────────── */

function CompareCard({ entry, onOpen }: { entry: ModalEntry; onOpen: (variant: Variant) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-md font-semibold text-foreground">{entry.name}</p>
        {/* Trigger, not module: it tells apart entries that share a component name. */}
        <p className="truncate text-xs text-muted-foreground" title={`${entry.module} · ${entry.trigger}`}>
          {entry.trigger}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={() => onOpen("old")}>Old</Button>
        <Button variant="outline" size="sm" onClick={() => onOpen("new")}>New</Button>
        <Button size="sm" onClick={() => onOpen("both")}>Both</Button>
      </div>
    </div>
  );
}

/**
 * Which version of a redesigned confirm is showing: the page's current one, the
 * gallery copy, or both side by side.
 */
type Variant = "old" | "new" | "both";

const NEXT_VARIANT: Record<Variant, Variant> = { new: "old", old: "both", both: "new" };
const VARIANT_LABEL: Record<Variant, string> = { old: "Old", new: "New", both: "Side by side" };

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function ModalGalleryPage() {
  const [query, setQuery] = React.useState("");
  const [kind, setKind] = React.useState<ModalKind | "all">("all");
  /* Deep link: /dev/modals#edit-site opens that modal straight away. */
  const [activeId, setActiveId] = React.useState<string | null>(() => {
    const slug = window.location.hash.replace("#", "");
    return slug && MODAL_ENTRIES.some((e) => e.id === slug) ? slug : null;
  });

  const [variant, setVariant] = React.useState<Variant>("new");
  const openEntry = React.useCallback((id: string, v: Variant = "new") => {
    setVariant(v);
    setActiveId(id);
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODAL_ENTRIES.filter((e) => {
      if (kind !== "all" && e.kind !== kind) return false;
      if (!q) return true;
      return [e.name, e.module, e.file, e.trigger, e.note ?? ""].join(" ").toLowerCase().includes(q);
    });
  }, [query, kind]);

  const groups = React.useMemo(() => {
    const map = new Map<string, ModalEntry[]>();
    for (const e of filtered) {
      const list = map.get(e.module);
      if (list) list.push(e);
      else map.set(e.module, [e]);
    }
    return [...map.entries()];
  }, [filtered]);

  /* Confirms that have both an old (page) and new (gallery copy) version. */
  const comparable = React.useMemo(() => filtered.filter((e) => oldRenderFor(e)), [filtered]);

  const active = activeId ? MODAL_ENTRIES.find((e) => e.id === activeId) ?? null : null;
  const legacy = active ? oldRenderFor(active) : undefined;
  const showingOld = Boolean(legacy) && variant === "old";
  const showingBoth = Boolean(legacy) && variant === "both";

  const close = React.useCallback(() => setActiveId(null), []);

  /* Alt + ← / → steps through the filtered list without closing first — the
     only way to drive this while a modal has focus trapped and the page
     behind it is pointer-inert. */
  React.useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      // Alt + V cycles a redesigned confirm: new → old → side by side.
      if (e.altKey && e.code === "KeyV") {
        e.preventDefault();
        setVariant((v) => NEXT_VARIANT[v]);
        return;
      }
      if (!e.altKey || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
      e.preventDefault();
      const list = filtered.length ? filtered : MODAL_ENTRIES;
      const idx = list.findIndex((entry) => entry.id === activeId);
      const step = e.key === "ArrowRight" ? 1 : -1;
      const next = list[(idx + step + list.length) % list.length];
      if (next) setActiveId(next.id);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, activeId, filtered]);

  const position = active ? filtered.findIndex((e) => e.id === active.id) + 1 : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader>
        <PageHeaderContent>
          <PageHeaderTitle>Modal Gallery</PageHeaderTitle>
        </PageHeaderContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs">Esc</kbd>
          close
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs">Alt</kbd>
          <ArrowLeft className="size-3" />
          <ArrowRight className="size-3" />
          step
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-2xs">Alt V</kbd>
          old / new / both
        </div>
      </PageHeader>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by component, module, file or trigger…"
            className="h-9 pl-8 pr-8 text-base"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChip active={kind === "all"} onClick={() => setKind("all")} count={MODAL_ENTRIES.length}>
            All
          </FilterChip>
          {KIND_ORDER.map((k) => (
            <FilterChip
              key={k}
              active={kind === k}
              onClick={() => setKind(k)}
              count={MODAL_ENTRIES.filter((e) => e.kind === k).length}
            >
              {KIND_LABELS[k]}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* ── Compare: redesigned modals, old vs new ───────────────────────── */}
      {comparable.length > 0 && (kind === "all" || kind === "modal" || PLAIN_KINDS.includes(kind)) && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compare · redesign
            </h2>
            <Badge variant="outline" className="font-mono text-3xs">
              {comparable.length}
            </Badge>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="text-xs text-muted-foreground">
            Old is the modal as it was before the redesign (a frozen copy); New is what the pages show now; Both puts them side by side. Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono text-3xs">Alt V</kbd> while one is
            open to cycle between them.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {comparable.map((entry) => (
              <CompareCard key={entry.id} entry={entry} onOpen={(v) => openEntry(entry.id, v)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Groups ───────────────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No modals match"
          description="Try a different component name, module or file path."
        />
      ) : (
        groups.map(([module, entries]) => (
          <section key={module} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                {module}
              </h2>
              <Badge variant="outline" className="font-mono text-3xs">
                {entries.length}
              </Badge>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} onOpen={() => openEntry(entry.id)} />
              ))}
            </div>
          </section>
        ))
      )}

      {/* ── Active modal ─────────────────────────────────────────────────── */}
      {active && (
        <React.Fragment key={`${active.id}-${legacy ? variant : "new"}`}>
          {showingBoth && legacy ? (
            <>
              {/* Side by side: both dialogs are non-modal, so the gallery draws the backdrop. */}
              <div
                className="fixed inset-0 z-[var(--z-drawer)] bg-background/80 backdrop-blur-sm"
                onClick={close}
                aria-hidden
              />
              <div className="pointer-events-none fixed inset-x-0 top-6 z-[var(--z-toast)]">
                {[
                  { side: "left-1/4", label: "Old", sub: "before the redesign" },
                  { side: "left-3/4", label: "New", sub: "redesign" },
                ].map((col) => (
                  <span
                    key={col.label}
                    className={cn(
                      "absolute -translate-x-1/2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm",
                      col.side
                    )}
                  >
                    <span className="font-semibold text-foreground">{col.label}</span> · {col.sub}
                  </span>
                ))}
              </div>
              <ModalChromeProvider chrome="classic" placement="left">
                {legacy(close)}
              </ModalChromeProvider>
              <ModalChromeProvider chrome="plain" placement="right" tidy={isTidy(active)} uniformWidth={isUniformWidth(active)}>
                {active.render(close)}
              </ModalChromeProvider>
            </>
          ) : (
            /* Confirm, wizard and progress entries preview the plain header (bigger title, no
               description, divider or icons). The "old" side renders as the page does. */
            <ModalChromeProvider
              chrome={!showingOld && isRedesigned(active) ? "plain" : "classic"}
              tidy={!showingOld && isTidy(active)}
              uniformWidth={!showingOld && isUniformWidth(active)}
            >
              {showingOld && legacy ? legacy(close) : active.render(close)}
            </ModalChromeProvider>
          )}
          {/* Reminder strip. Pointer-inert while the modal holds focus, so it
              only ever advertises the keyboard controls. */}
          <div className="pointer-events-none fixed bottom-4 left-1/2 z-[var(--z-toast)] -translate-x-1/2 rounded-full border border-border bg-card/95 px-3 py-1.5 shadow-lg">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono text-2xs text-foreground">{active.name}</span>
              {legacy && (
                <span
                  className={cn(
                    "rounded-full border px-1.5 py-px text-3xs font-semibold uppercase tracking-wider",
                    variant === "new" ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {VARIANT_LABEL[variant]}
                </span>
              )}
              <span className="text-muted-foreground/50">
                {position || "–"}/{filtered.length}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-3xs">Alt</kbd>
              <ArrowLeft className="size-3" />
              <ArrowRight className="size-3" />
              {legacy && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-3xs">Alt V</kbd>
                  <span>{VARIANT_LABEL[NEXT_VARIANT[variant]].toLowerCase()}</span>
                </>
              )}
              <span className="text-muted-foreground/40">·</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-3xs">Esc</kbd>
              <CornerDownLeft className="size-3" />
            </p>
          </div>
        </React.Fragment>
      )}

      {active && (
        <div className="sr-only" aria-live="polite">
          {active.name} from {active.file}
        </div>
      )}

      {!active && (
        <p className="text-xs text-muted-foreground/60">
          Modals mount only while open, so each one starts from a clean state. Cards are deep-linkable —{" "}
          <span className="font-mono">/dev/modals#edit-site</span> opens that entry directly.
        </p>
      )}
    </div>
  );
}
