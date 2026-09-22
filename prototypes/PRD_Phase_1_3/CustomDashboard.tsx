import * as React from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  EyeOff,
  Filter,
  FolderOpen,
  GripVertical,
  LayoutDashboard,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  ScrollText,
  TriangleAlert,
  Video,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KpiCard } from "@/components/shared/KpiCard";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { MOCK_CASES } from "@/mocks/incidentCases";
import { MOCK_ACTIVITY_LOGS, ACTIVITY_KIND_LABELS, ACTIVITY_KIND_STYLES } from "@/mocks/activityLogs";
import { MOCK_NVRS } from "@/mocks/nvr";
import { SYSTEM_HEALTH_PRESENTATION, useSystemStatus } from "@/hooks/useSystemStatus";
import { VisitorKpis } from "./VisitorKpis";
import { visitorStats } from "./visitorStats";
import {
  DEFAULT_LAYOUT,
  hiddenPanels,
  loadLayout,
  panelDef,
  placePanel,
  saveLayout,
  shiftPanel,
  type PanelId,
} from "./dashboardLayout";

/* Dashboard, made customizable for Phase 1.3.

   The panels are the current dashboard's sections, unchanged, plus the visitor
   counts from Live Monitoring as a panel of their own. "Customize" puts the
   page into edit mode: drag a panel to move it, click it for Move and Remove,
   and anything removed waits in a drawer on the right to be dragged back in.
   Nothing is lost by removing a panel — it is only parked. */

/* Reference "today" for date-range filtering — matches newest event in mocks. */
const REFERENCE_TODAY = "2026-05-19";

/* ── Section Card ────────────────────────────────────────────────────── */

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <TruncatedText text={title} className="min-w-0 flex-1 text-base font-bold text-foreground" />
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ── Severity styles ─────────────────────────────────────────────────── */

const SEV_STYLES = {
  critical: { bg: "bg-sev-critical/15", text: "text-sev-critical", label: "Critical", dot: "bg-sev-critical" },
  medium:   { bg: "bg-warning/15",      text: "text-warning",      label: "Medium",   dot: "bg-warning" },
  low:      { bg: "bg-info/15",         text: "text-info",         label: "Low",      dot: "bg-info" },
};

type SevKind = keyof typeof SEV_STYLES;

/** Compact severity chip used in the per-site detection cards. */
function SevPill({ kind, value }: { kind: SevKind; value: number }) {
  const s = SEV_STYLES[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-bold",
        s.bg, s.text, "border-current/30"
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {value}
    </span>
  );
}

/** Severity row used inside the per-site popover — label + bar + count. */
function SevRow({ kind, value, total }: { kind: SevKind; value: number; total: number }) {
  const s = SEV_STYLES[kind];
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("inline-flex items-center gap-1 font-bold", s.text)}>
        <span className={cn("size-1.5 rounded-full", s.dot)} />
        {s.label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", s.dot)}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-foreground">
        {value}{" "}
        <span className="text-muted-foreground">· {pct}%</span>
      </span>
    </div>
  );
}

/* ── Per-site colors — Sembawang locked to warning yellow per request ─ */
const SITE_COLOR_MAP: Record<string, string> = {
  "Sembawang Naval": "var(--warning)",
  "Astra HQ":        "var(--success)",
  "FedEx Changi":    "var(--info)",
};
const SITE_FALLBACK_COLORS = ["var(--info)", "var(--success)", "var(--warning)", "var(--secondary)", "var(--sev-critical)", "var(--primary)"];
function siteColor(siteName: string, idx: number) {
  return SITE_COLOR_MAP[siteName] ?? SITE_FALLBACK_COLORS[idx % SITE_FALLBACK_COLORS.length];
}

/* ── Site chip row for trend chart ──────────────────────────────────── */

const MAX_CHART_SITES = 5;

function SiteChipRow({
  sites,
  selected,
  onChange,
}: {
  sites: { name: string; count: number; color: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function handleToggle(name: string) {
    if (selected.includes(name)) {
      if (selected.length === 1) return;
      onChange(selected.filter((s) => s !== name));
    } else {
      if (selected.length >= MAX_CHART_SITES) {
        const oldest = selected[0];
        onChange([...selected.slice(1), name]);
        toast(`${oldest} removed — max ${MAX_CHART_SITES} sites visible at once`);
      } else {
        onChange([...selected, name]);
      }
    }
  }

  return (
    <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
      {sites.map((s) => {
        const isActive = selected.includes(s.name);
        return (
          <button
            key={s.name}
            onClick={() => handleToggle(s.name)}
            style={isActive ? {
              backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${s.color} 40%, transparent)`,
              color: s.color,
            } : undefined}
            className={cn(
              "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold transition-colors",
              isActive
                ? "border-current/30"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            <span className="size-1.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
            {s.name}
            <span className={cn(
              "rounded-full px-1 py-px font-mono text-3xs",
              isActive ? "bg-white/10" : "bg-muted text-muted-foreground"
            )}>
              {s.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Site multi-select dropdown ──────────────────────────────────────── */

function SiteMultiSelect({
  options, selected, onChange,
}: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const allSelected = selected.length === 0 || selected.length === options.length;
  const label =
    selected.length === 0 || selected.length === options.length
      ? "All sites"
      : selected.length === 1
        ? options.find((o) => o.id === selected[0])?.name ?? "1 site"
        : `${selected.length} sites`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors",
            allSelected
              ? "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              : "border-primary bg-primary/10 text-primary"
          )}
        >
          <Filter className="size-3" />
          {label}
          <ChevronDown className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by site</p>
          <button
            onClick={() => onChange([])}
            className="text-2xs font-semibold uppercase tracking-wider text-primary hover:underline"
          >
            All
          </button>
        </div>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => onChange(checked ? selected.filter((s) => s !== o.id) : [...selected, o.id])}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  )}
                >
                  {checked && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <TruncatedText text={o.name} className="min-w-0 flex-1 text-foreground" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}


/* ── Layout spans ─────────────────────────────────────────────────────── */

/**
 * Which column span each panel gets. Half-width panels pair up; one left
 * without a partner (next to a full-width panel, or last) takes the whole row
 * instead of leaving a hole — so removing a panel never leaves a gap.
 */
function spansFor(layout: PanelId[]): Record<string, "full" | "half"> {
  const spans: Record<string, "full" | "half"> = {};
  let openHalf = false;
  layout.forEach((id, i) => {
    if (panelDef(id).width === "full") {
      spans[id] = "full";
      openHalf = false;
      return;
    }
    if (openHalf) {
      spans[id] = "half";
      openHalf = false;
      return;
    }
    const next = layout[i + 1];
    const pairs = next !== undefined && panelDef(next).width === "half";
    spans[id] = pairs ? "half" : "full";
    openHalf = pairs;
  });
  return spans;
}

/* ── Edit-mode chrome ─────────────────────────────────────────────────── */

type DragSource = "board" | "drawer";
type Drop = { target: PanelId | null; side: "before" | "after" };

function PanelFrame({
  id, span, editing, selected, dragging, drop, onSelect, onDragStart, onDragEnd, onDragOver, onDrop,
  onMove, onRemove, canMoveUp, canMoveDown, children,
}: {
  id: PanelId;
  span: "full" | "half";
  editing: boolean;
  selected: boolean;
  dragging: boolean;
  drop: "before" | "after" | null;
  onSelect: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, side: "before" | "after") => void;
  onDrop: (e: React.DragEvent) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  children: React.ReactNode;
}) {
  const def = panelDef(id);
  const Icon = def.icon;

  if (!editing) {
    return <div className={cn("@container min-w-0", span === "full" && "@2xl/canvas:col-span-2")}>{children}</div>;
  }

  /* Paired panels sit side by side, so a drop lands left or right of them;
     full-width panels stack, so it lands above or below. */
  function sideFor(e: React.DragEvent): "before" | "after" {
    const r = e.currentTarget.getBoundingClientRect();
    return span === "half"
      ? e.clientX < r.left + r.width / 2 ? "before" : "after"
      : e.clientY < r.top + r.height / 2 ? "before" : "after";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${def.title} panel. ${selected ? "Selected." : "Press Enter for options."}`}
      draggable
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); onRemove(); }
        if (e.altKey && e.key === "ArrowUp" && canMoveUp) { e.preventDefault(); onMove(-1); }
        if (e.altKey && e.key === "ArrowDown" && canMoveDown) { e.preventDefault(); onMove(1); }
      }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, sideFor(e))}
      onDrop={onDrop}
      className={cn(
        "group/panel relative min-w-0 cursor-grab rounded-xl outline-2 outline-offset-4 transition-opacity duration-[var(--duration-fast)] ease-standard active:cursor-grabbing",
        "focus-visible:outline-solid focus-visible:outline-ring",
        span === "full" && "@2xl/canvas:col-span-2",
        selected ? "outline-solid outline-primary" : "outline-dashed outline-border hover:outline-primary/50",
        dragging && "opacity-40"
      )}
    >
      {/* The live content, frozen — charts and popovers must not steal the drag. */}
      {/* Top padding makes room for the name tag, so it never covers the panel's own label. */}
      <div className="@container pointer-events-none select-none pt-5" aria-hidden>
        {children}
      </div>

      {/* Where the panel being dragged will land. */}
      {drop && (
        <span
          className={cn(
            "pointer-events-none absolute z-10 rounded-full bg-primary",
            span === "half"
              ? cn("inset-y-0 w-1", drop === "before" ? "-left-2.5" : "-right-2.5")
              : cn("inset-x-0 h-1", drop === "before" ? "-top-2.5" : "-bottom-2.5")
          )}
        />
      )}

      {/* Name tag, so a panel is identifiable at a glance while editing. */}
      <span className="pointer-events-none absolute -top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/90 px-2 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-sm">
        <GripVertical className="size-3.5 text-muted-foreground" />
        <Icon className="size-3.5 text-primary" />
        {def.title}
      </span>

      {/* Options for the panel the operator clicked. */}
      {selected && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-4 right-3 z-20 flex cursor-default items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-lg"
        >
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" disabled={!canMoveUp}
            onClick={() => onMove(-1)} aria-label={`Move ${def.title} up`}>
            <ArrowUp className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" disabled={!canMoveDown}
            onClick={() => onMove(1)} aria-label={`Move ${def.title} down`}>
            <ArrowDown className="size-3.5" />
          </Button>
          <div className="mx-0.5 h-4 w-px bg-border" />
          <Button variant="ghost" size="sm"
            className="h-7 gap-1.5 px-2 text-sev-critical hover:bg-sev-critical/10 hover:text-sev-critical"
            onClick={onRemove}>
            <EyeOff className="size-3.5" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Hidden panels. Docked rather than modal: a modal sheet puts an overlay over
 * the page, and the whole point is dragging from here onto the page.
 */
function PanelDrawer({
  hidden, dragSource, onDragStart, onDragEnd, onAdd, onDropRemove,
}: {
  hidden: PanelId[];
  /** Where the current drag started, if one is in progress. */
  dragSource: DragSource | null;
  onDragStart: (e: React.DragEvent, id: PanelId) => void;
  onDragEnd: () => void;
  onAdd: (id: PanelId) => void;
  onDropRemove: (e: React.DragEvent) => void;
}) {
  const [over, setOver] = React.useState(false);
  // Only a panel coming off the dashboard can be dropped here.
  const accepting = dragSource === "board";

  return (
    <aside
      aria-label="Hidden panels"
      onDragOver={(e) => {
        if (!accepting) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        setOver(false);
        onDropRemove(e);
      }}
      className={cn(
        "fixed bottom-0 right-0 top-12 z-[var(--z-drawer)] flex w-80 max-w-[85vw] flex-col border-l bg-card shadow-2xl transition-colors duration-[var(--duration-fast)] ease-standard",
        over ? "border-sev-critical bg-sev-critical/5" : "border-border"
      )}
    >
      <div className="border-b border-border px-4 py-3.5">
        <p className="flex items-center justify-between gap-2 text-base font-bold text-foreground">
          Hidden panels
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-2xs text-muted-foreground">
            {hidden.length}
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Drag a panel onto the dashboard, or press Add. Drag one here to remove it.
        </p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {accepting && (
          <div className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-5 text-xs font-semibold transition-colors",
            over ? "border-sev-critical text-sev-critical" : "border-border text-muted-foreground"
          )}>
            <EyeOff className="size-3.5" />
            Drop here to remove
          </div>
        )}

        {hidden.length === 0 && !accepting ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
            <LayoutDashboard className="size-5" />
            <p className="text-sm">Every panel is on the dashboard.</p>
            <p className="text-xs">Remove one and it will wait here.</p>
          </div>
        ) : (
          hidden.map((id) => {
            const def = panelDef(id);
            const Icon = def.icon;
            return (
              <div
                key={id}
                draggable
                onDragStart={(e) => onDragStart(e, id)}
                onDragEnd={onDragEnd}
                className="group/item flex cursor-grab items-start gap-2.5 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/40 active:cursor-grabbing"
              >
                <GripVertical className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{def.title}</p>
                  <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">{def.description}</p>
                  <p className="mt-1 text-3xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {def.width === "full" ? "Full width" : "Half width"}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="h-7 shrink-0 gap-1 px-2" onClick={() => onAdd(id)}
                  aria-label={`Add ${def.title} to the dashboard`}>
                  <Plus className="size-3" />
                  Add
                </Button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

/* ── Canvas ───────────────────────────────────────────────────────────── */

function DashboardCanvas({
  layout, setLayout, editing, bodies,
}: {
  layout: PanelId[];
  setLayout: (next: PanelId[]) => void;
  editing: boolean;
  bodies: Record<PanelId, React.ReactNode>;
}) {
  const [selected, setSelected] = React.useState<PanelId | null>(null);
  const [drag, setDrag] = React.useState<{ id: PanelId; source: DragSource } | null>(null);
  const [drop, setDrop] = React.useState<Drop | null>(null);

  const spans = spansFor(layout);
  const hidden = hiddenPanels(layout);

  function startDrag(e: React.DragEvent, id: PanelId, source: DragSource) {
    e.dataTransfer.effectAllowed = "move";
    // Firefox will not start a drag without data.
    e.dataTransfer.setData("text/plain", id);
    setDrag({ id, source });
    setSelected(null);
  }

  function endDrag() {
    setDrag(null);
    setDrop(null);
  }

  function dropAt(target: PanelId | null, side: "before" | "after") {
    if (!drag) return;
    setLayout(placePanel(layout, drag.id, target, side));
    if (drag.source === "drawer") toast.success(`${panelDef(drag.id).title} added`);
    endDrag();
  }

  function remove(id: PanelId) {
    setLayout(layout.filter((p) => p !== id));
    setSelected(null);
    toast(`${panelDef(id).title} hidden`, {
      description: "It's waiting in the Hidden panels drawer.",
      action: { label: "Undo", onClick: () => setLayout(layout) },
    });
  }

  // Leaving edit mode drops the selection with it.
  const activeSelection = editing ? selected : null;

  return (
    <>
      {layout.length === 0 ? (
        <div
          onDragOver={(e) => { if (drag) { e.preventDefault(); setDrop({ target: null, side: "after" }); } }}
          onDrop={(e) => { e.preventDefault(); dropAt(null, "after"); }}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-16 text-center text-muted-foreground transition-colors",
            drop ? "border-primary bg-primary/5" : "border-border"
          )}
        >
          <LayoutDashboard className="size-5" />
          <p className="text-base font-semibold text-foreground">No panels on the dashboard</p>
          <p className="text-sm">
            {editing ? "Drag a panel here from the drawer, or press Add." : "Press Customize to add some back."}
          </p>
        </div>
      ) : (
        /* Columns follow the canvas, not the window — opening the edit drawer
           narrows the canvas and the pairs stack instead of getting crushed. */
        <div className="@container/canvas">
        <div className={cn("grid grid-cols-1 gap-4 @2xl/canvas:grid-cols-2", editing && "gap-6")}>
          {layout.map((id, i) => (
            <PanelFrame
              key={id}
              id={id}
              span={spans[id]}
              editing={editing}
              selected={activeSelection === id}
              dragging={drag?.id === id}
              drop={drop?.target === id && drag?.id !== id ? drop.side : null}
              onSelect={() => setSelected((s) => (s === id ? null : id))}
              onDragStart={(e) => startDrag(e, id, "board")}
              onDragEnd={endDrag}
              onDragOver={(e, side) => {
                if (!drag) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (drop?.target !== id || drop.side !== side) setDrop({ target: id, side });
              }}
              onDrop={(e) => { e.preventDefault(); dropAt(id, drop?.side ?? "after"); }}
              onMove={(delta) => setLayout(shiftPanel(layout, id, delta))}
              onRemove={() => remove(id)}
              canMoveUp={i > 0}
              canMoveDown={i < layout.length - 1}
            >
              {bodies[id]}
            </PanelFrame>
          ))}

          {/* A landing strip after the last panel, shown only mid-drag. */}
          {editing && drag && (
            <div
              onDragOver={(e) => { e.preventDefault(); if (drop?.target !== null) setDrop({ target: null, side: "after" }); }}
              onDrop={(e) => { e.preventDefault(); dropAt(null, "after"); }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-6 text-xs font-semibold transition-colors @2xl/canvas:col-span-2",
                drop?.target === null ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
              )}
            >
              <Plus className="size-3.5" />
              Drop here to place at the end
            </div>
          )}
        </div>
        </div>
      )}

      {editing && (
        <PanelDrawer
          hidden={hidden}
          dragSource={drag?.source ?? null}
          onDragStart={(e, id) => startDrag(e, id, "drawer")}
          onDragEnd={endDrag}
          onAdd={(id) => { setLayout([...layout, id]); toast.success(`${panelDef(id).title} added`); }}
          onDropRemove={(e) => {
            e.preventDefault();
            if (drag?.source === "board") remove(drag.id);
            endDrag();
          }}
        />
      )}
    </>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

type DateRange = "today" | "yesterday" | "week" | "month" | "custom";

function shiftDate(iso: string, days: number) {
  // Pure string math against the fixed reference window — keeps the mock deterministic.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Small eyebrow above the two KPI-strip panels, which have no card header of their own. */
function StripLabel({ children, live }: { children: React.ReactNode; live?: boolean }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      {live && <span className="size-1.5 animate-pulse rounded-full bg-success" />}
      <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
    </div>
  );
}

export function CustomDashboard() {
  const navigate = useNavigate();
  const cameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);
  const status = useSystemStatus();

  /* ── Layout + edit mode ──────────────────────────────────────────── */
  const [layout, setLayout] = React.useState<PanelId[]>(loadLayout);
  const [editing, setEditing] = React.useState(false);
  /* The layout as it was when editing began, so Cancel can put it back. */
  const [snapshot, setSnapshot] = React.useState<PanelId[]>(layout);

  function startEditing() {
    setSnapshot(layout);
    setEditing(true);
  }
  /* A removal's Undo belongs to the edit session — once it is saved or
     cancelled, an Undo would change the layout without saving it. */
  function finishEditing() {
    toast.dismiss();
    saveLayout(layout);
    setEditing(false);
    toast.success("Dashboard layout saved");
  }
  function cancelEditing() {
    toast.dismiss();
    setLayout(snapshot);
    setEditing(false);
  }

  /* ── Date filter state ───────────────────────────────────────────── */
  const [dateRange, setDateRange] = React.useState<DateRange>("today");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");

  const dateFilters: { key: DateRange; label: string }[] = [
    { key: "today",     label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week",      label: "This Week" },
    { key: "month",     label: "This Month" },
  ];

  const dateBounds = React.useMemo<{ from: string; to: string }>(() => {
    if (dateRange === "today")     return { from: REFERENCE_TODAY,             to: REFERENCE_TODAY };
    if (dateRange === "yesterday") return { from: shiftDate(REFERENCE_TODAY, -1), to: shiftDate(REFERENCE_TODAY, -1) };
    if (dateRange === "week")      return { from: shiftDate(REFERENCE_TODAY, -6), to: REFERENCE_TODAY };
    if (dateRange === "month")     return { from: shiftDate(REFERENCE_TODAY, -29), to: REFERENCE_TODAY };
    if (dateRange === "custom" && customFrom && customTo) {
      return customFrom <= customTo ? { from: customFrom, to: customTo } : { from: customTo, to: customFrom };
    }
    return { from: "", to: "" };
  }, [dateRange, customFrom, customTo]);

  const dateLabel =
    dateRange === "custom" && customFrom && customTo ? `${customFrom} → ${customTo}` :
    dateRange === "custom" ? "Custom range" :
    dateFilters.find((f) => f.key === dateRange)?.label ?? "Today";

  /* ── Filtered events / cases ─────────────────────────────────────── */
  const filteredEvents = React.useMemo(() => {
    if (!dateBounds.from || !dateBounds.to) return MOCK_EVENTS;
    return MOCK_EVENTS.filter((e) => e.date >= dateBounds.from && e.date <= dateBounds.to);
  }, [dateBounds]);

  const filteredCases = React.useMemo(() => {
    if (!dateBounds.from || !dateBounds.to) return MOCK_CASES;
    return MOCK_CASES.filter((c) => {
      const d = c.createdAt.slice(0, 10);
      return d >= dateBounds.from && d <= dateBounds.to;
    });
  }, [dateBounds]);

  /* ── Derived stats ───────────────────────────────────────────────── */
  const camOnline = cameras.filter((c) => c.status === "online").length;
  const camTotal = cameras.length;
  const eventsInRange = filteredEvents.length;
  const casesOpen = filteredCases.filter((c) => c.status === "open" || c.status === "in-review").length;
  const casesEscalated = filteredCases.filter((c) => c.severity === "critical").length;
  const visitors = React.useMemo(() => visitorStats(cameras), [cameras]);

  const detectionsBySite = React.useMemo(() => {
    const map = new Map<string, { site: string; critical: number; medium: number; low: number; total: number }>();
    for (const e of filteredEvents) {
      if (!map.has(e.siteDisplay)) {
        map.set(e.siteDisplay, { site: e.siteDisplay, critical: 0, medium: 0, low: 0, total: 0 });
      }
      const row = map.get(e.siteDisplay)!;
      row[e.severity] += 1;
      row.total += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredEvents]);

  // Per-site trend — bucket labels adapt to the selected date range.
  const siteTrend = React.useMemo(() => {
    const buckets =
      dateRange === "today" || dateRange === "yesterday"
        ? ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"]
        : dateRange === "month"
          ? ["Week 1", "Week 2", "Week 3", "Week 4"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const maxTotal = Math.max(1, ...detectionsBySite.map((s) => s.total));
    return buckets.map((day, di) => {
      const row: Record<string, string | number> = { day };
      detectionsBySite.forEach((s, si) => {
        const peak = 6 + (s.total / maxTotal) * 18;
        const wave = (Math.sin((di + si * 1.6) * 0.9) + 1) / 2;
        row[s.site] = Math.round(peak * (0.4 + 0.6 * wave));
      });
      return row;
    });
  }, [detectionsBySite, dateRange]);

  const chartSiteOptions = React.useMemo(
    () => detectionsBySite.map((s, i) => ({ name: s.site, count: s.total, color: siteColor(s.site, i) })),
    [detectionsBySite]
  );

  /* The chart's site picks belong to one date range: switching range starts
     from that range's top three again. Keyed by range rather than reset in an
     effect, so there is no render where the old picks show. */
  const [sitePicks, setSitePicks] = React.useState<{ range: DateRange; sites: string[] } | null>(null);
  const selectedSites =
    sitePicks?.range === dateRange ? sitePicks.sites : detectionsBySite.slice(0, 3).map((s) => s.site);
  const setSelectedSites = (next: string[]) => setSitePicks({ range: dateRange, sites: next });

  // Zone areas + per-camera event breakdown
  type ZoneCameraStat = { camera: string; total: number; critical: number; medium: number; low: number };
  type ZoneRow = {
    area: string; site: string; siteKey: string;
    counts: { critical: number; medium: number; low: number };
    total: number;
    cameras: number;
    cameraOffline: boolean;
    cameraStats: ZoneCameraStat[];
  };

  const zoneAreas: ZoneRow[] = React.useMemo(() => {
    const map = new Map<string, ZoneRow>();
    for (const e of filteredEvents) {
      const key = `${e.site}__${e.area}`;
      if (!map.has(key)) {
        map.set(key, {
          area: e.areaDisplay, site: e.siteDisplay, siteKey: e.site,
          counts: { critical: 0, medium: 0, low: 0 }, total: 0,
          cameras: 0, cameraOffline: false, cameraStats: [],
        });
      }
      const row = map.get(key)!;
      row.counts[e.severity] += 1;
      row.total += 1;

      let cs = row.cameraStats.find((s) => s.camera === e.camera);
      if (!cs) {
        cs = { camera: e.camera, total: 0, critical: 0, medium: 0, low: 0 };
        row.cameraStats.push(cs);
      }
      cs.total += 1;
      cs[e.severity] += 1;
    }
    for (const row of map.values()) {
      const camsInArea = cameras.filter((c) => {
        const siteMatch = c.siteName === row.site || c.siteId.includes(row.site.toLowerCase().split(" ")[0]);
        const areaMatch = c.areaName === row.area;
        return siteMatch && areaMatch;
      });
      row.cameras = Math.max(camsInArea.length, row.cameraStats.length);
      row.cameraOffline = camsInArea.length > 0 && camsInArea.every((c) => c.status !== "online");
      row.cameraStats.sort((a, b) => b.total - a.total);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredEvents, cameras]);

  const siteFilterOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const z of zoneAreas) if (!seen.has(z.siteKey)) seen.set(z.siteKey, z.site);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [zoneAreas]);
  const [zoneSiteFilter, setZoneSiteFilter] = React.useState<string[]>([]);
  const filteredZoneAreas = React.useMemo(() => {
    if (zoneSiteFilter.length === 0) return zoneAreas;
    return zoneAreas.filter((z) => zoneSiteFilter.includes(z.siteKey));
  }, [zoneAreas, zoneSiteFilter]);

  const camerasBySite = sites.map((s) => ({
    name: s.name,
    online: cameras.filter((c) => c.siteId === s.id && c.status === "online").length,
    offline: cameras.filter((c) => c.siteId === s.id && c.status !== "online").length,
  }));

  const recentEvents = [...filteredEvents]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 5);
  const recentCases = [...filteredCases]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);
  const recentActivity = MOCK_ACTIVITY_LOGS.slice(0, 8);

  const sitesTotal = sites.length;
  const sitesActive = sites.filter((s) => s.status === "active").length;
  const nvrTotal = MOCK_NVRS.length;
  const nvrOnline = MOCK_NVRS.filter((n) => n.status === "online").length;

  /* ── System health ───────────────────────────────────────────────────
     Read from the same hook as the top-bar status menu, so the pill and the
     banner can never disagree with it. The banner names the worst group. */
  const systemStatus = status.overall;
  const statusPresentation = SYSTEM_HEALTH_PRESENTATION[systemStatus];
  const worstGroup = (
    [
      { label: "cameras", g: status.cameras },
      { label: "NVRs", g: status.nvrs },
      { label: "servers", g: status.servers },
    ] as const
  ).find(({ g }) => g.health === systemStatus);
  const [alertAcknowledged, setAlertAcknowledged] = React.useState(false);
  const showAlertBanner = systemStatus !== "healthy" && !!worstGroup && !alertAcknowledged;

  /* ── Panel bodies ─────────────────────────────────────────────────── */

  const bodies: Record<PanelId, React.ReactNode> = {
    status: (
      /* Sized by container, not viewport: the edit drawer narrows the page
         without the window changing, and viewport breakpoints would crush it. */
      <div className="flex flex-col gap-4 @2xl:flex-row">
        <div className="min-w-0 flex-[3]">
          <StripLabel live>Live status</StripLabel>
          <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
            <KpiCard label="Sites" value={sitesTotal} sub={`${sitesActive} active`} accent="primary"
              onClick={() => navigate("/site/overview")} />
            <KpiCard label="Cameras"
              value={<>{camOnline}<span className="text-md text-muted-foreground"> / {camTotal}</span></>}
              sub={`${camTotal - camOnline} offline`} accent="success" onClick={() => navigate("/site/cameras")} />
            <KpiCard label="NVR Devices"
              value={<>{nvrOnline}<span className="text-md text-muted-foreground"> / {nvrTotal}</span></>}
              sub={`${nvrTotal - nvrOnline} offline`} accent="purple" onClick={() => navigate("/site/nvr")} />
          </div>
        </div>
        <div className="hidden w-px self-stretch bg-border @2xl:block" />
        <div className="@2xl:w-64 @2xl:shrink-0">
          <StripLabel>Period · {dateLabel}</StripLabel>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Events" value={eventsInRange} sub={dateLabel} accent="info"
              onClick={() => navigate("/detection-feed")} />
            <KpiCard label="Open Cases" value={casesOpen} sub={`${casesEscalated} critical`} accent="sev-critical"
              onClick={() => navigate("/incidents")} />
          </div>
        </div>
      </div>
    ),
    visitors: (
      <div>
        <StripLabel live>Visitor counts · all cameras</StripLabel>
        <VisitorKpis stats={visitors} gridClassName="grid grid-cols-1 gap-3 @md:grid-cols-2 @4xl:grid-cols-4" />
      </div>
    ),
    detections: (
      <Section
        title="Detections by Site — Severity Breakdown"
        action={
          <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/detection-feed")}>
            View feed <ArrowUpRight className="size-3" />
          </Button>
        }
      >
        {detectionsBySite.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm italic text-muted-foreground">No detections recorded in this range.</p>
        ) : (
          <>
            <SiteChipRow
              sites={chartSiteOptions}
              selected={selectedSites}
              onChange={setSelectedSites}
            />
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={siteTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                    cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.3 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  {chartSiteOptions
                    .filter((s) => selectedSites.includes(s.name))
                    .map((s) => (
                      <Line
                        key={s.name}
                        type="monotone"
                        dataKey={s.name}
                        stroke={s.color}
                        strokeWidth={2}
                        dot={{ r: 2.5 }}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {detectionsBySite
                .filter((s) => selectedSites.includes(s.site))
                .map((s) => {
                const i = detectionsBySite.findIndex((d) => d.site === s.site);
                const color = siteColor(s.site, i);
                return (
                  <Popover key={s.site}>
                    <PopoverTrigger asChild>
                      <button
                        className="group flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                      >
                        {/* Row 1: site name + colored dot */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className="size-2.5 flex-shrink-0 rounded-full"
                            style={{ background: color }}
                          />
                          <TruncatedText
                            text={s.site}
                            className="min-w-0 flex-1 text-xs font-semibold text-foreground"
                          />
                        </div>
                        {/* Row 2: big number */}
                        <p className="inline-flex items-baseline gap-1 font-mono">
                          <span className="text-2xl font-bold leading-none text-foreground">
                            {s.total}
                          </span>
                          <span className="text-2xs text-muted-foreground">
                            detections
                          </span>
                        </p>
                        {/* Row 3: severity breakdown chips */}
                        <div className="flex items-center gap-1.5 text-2xs">
                          <SevPill kind="critical" value={s.critical} />
                          <SevPill kind="medium"   value={s.medium} />
                          <SevPill kind="low"      value={s.low} />
                        </div>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-0">
                      <div className="border-b border-border px-3 py-2.5">
                        <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                          <span
                            className="size-2.5 flex-shrink-0 rounded-full"
                            style={{ background: color }}
                          />
                          {s.site}
                        </p>
                        <p className="mt-0.5 text-2xs text-muted-foreground">
                          <strong className="font-mono text-foreground">{s.total}</strong> detections in this range
                        </p>
                      </div>
                      <div className="px-3 py-3">
                        <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Severity breakdown
                        </p>
                        <div className="space-y-1.5">
                          <SevRow kind="critical" value={s.critical} total={s.total} />
                          <SevRow kind="medium"   value={s.medium}   total={s.total} />
                          <SevRow kind="low"      value={s.low}      total={s.total} />
                        </div>
                      </div>
                      <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                        <button
                          onClick={() => navigate("/detection-feed")}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          View feed for this site
                          <ArrowUpRight className="size-3" />
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </>
        )}
      </Section>
    ),
    zones: (
      <Section
        title="Zone Areas"
        action={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{filteredZoneAreas.length}</strong> area{filteredZoneAreas.length === 1 ? "" : "s"}
            </span>
            <SiteMultiSelect options={siteFilterOptions} selected={zoneSiteFilter} onChange={setZoneSiteFilter} />
          </div>
        }
      >
        {filteredZoneAreas.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">
            {zoneSiteFilter.length > 0 ? "No zones match the selected sites." : "No detections recorded in this range."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredZoneAreas.map((z) => {
              return (
                <Popover key={`${z.site}-${z.area}`}>
                  <PopoverTrigger asChild>
                    <button
                      className="group flex flex-col gap-1 rounded-lg border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 flex-shrink-0 text-muted-foreground" />
                        <TruncatedText text={z.area} className="min-w-0 flex-1 text-xs font-semibold text-foreground" />
                      </div>
                      <TruncatedText text={z.site} className="text-2xs text-muted-foreground" />
                      <div className="mt-0.5 flex items-center justify-between gap-1.5">
                        <span className="inline-flex items-baseline gap-1 font-mono">
                          <span className="text-lg font-bold leading-none text-foreground">{z.total}</span>
                          <span className="text-2xs text-muted-foreground">incident{z.total === 1 ? "" : "s"}</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-3xs text-muted-foreground">
                          <Video className="size-2.5" />
                          {z.cameras}
                        </span>
                      </div>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0">
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <MapPin className="size-3 text-muted-foreground" />
                        {z.area}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">{z.site}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-2xs">
                        <span className="font-mono"><strong className="text-foreground">{z.total}</strong> incidents</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-sev-critical" />{z.counts.critical}</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{z.counts.medium}</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{z.counts.low}</span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      <p className="px-2 py-1 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">Cameras</p>
                      {z.cameraStats.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs italic text-muted-foreground">No camera-attributed events.</p>
                      ) : z.cameraStats.map((cs) => (
                        <div key={cs.camera} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
                          <Video className="size-3 flex-shrink-0 text-muted-foreground" />
                          <TruncatedText text={cs.camera} className="min-w-0 flex-1 text-sm font-semibold text-foreground" />
                          <span className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
                            {cs.critical > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-sev-critical" />{cs.critical}</span>}
                            {cs.medium   > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{cs.medium}</span>}
                            {cs.low      > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{cs.low}</span>}
                            <span className="ml-1 font-mono font-bold text-foreground">{cs.total}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border px-3 py-2">
                      <button
                        onClick={() => navigate("/detection-feed")}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        View events for this zone <ArrowUpRight className="size-3" />
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        )}
      </Section>
    ),
    "recent-detections": (
      <Section title="Recent Detections"
        action={<Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/detection-feed")}>
          View all <ArrowUpRight className="size-3" />
        </Button>}>
        <div className="space-y-2">
          {recentEvents.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">No detections in this range.</p>
          ) : recentEvents.map((e) => {
            const sv = SEV_STYLES[e.severity];
            return (
              <div key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${e.severity})` }}>
                <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", sv.bg, sv.text)}>
                  {sv.label}
                </span>
                <div className="min-w-0 flex-1">
                  <TruncatedText text={e.typeLabel} className="text-base font-semibold text-foreground" />
                  <TruncatedText text={e.summary} className="text-xs text-muted-foreground" />
                </div>
                {e.caseId && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); navigate(`/incidents/${e.caseId}`); }}
                    title={`Linked to ${e.caseId}`}
                    className="inline-flex flex-shrink-0 items-center rounded-full border border-info/30 bg-info/15 px-1.5 py-0.5 font-mono text-2xs font-semibold text-info transition-colors hover:bg-info/25"
                  >
                    {e.caseId}
                  </button>
                )}
                <span className="font-mono text-2xs text-muted-foreground">{e.time}</span>
              </div>
            );
          })}
        </div>
      </Section>
    ),
    cases: (
      <Section title="Incident Cases"
        action={<Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/incidents")}>
          View all <ArrowUpRight className="size-3" />
        </Button>}>
        <div className="space-y-2">
          {recentCases.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">No cases in this range.</p>
          ) : recentCases.map((c) => {
            const sv = SEV_STYLES[c.severity];
            return (
              <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FolderOpen className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <TruncatedText text={c.title} className="text-base font-semibold text-foreground" />
                  <TruncatedText
                    text={`${c.id} · ${c.siteDisplay} · ${c.assignedTo.name}`}
                    className="text-xs text-muted-foreground"
                  />
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", sv.bg, sv.text)}>
                  {sv.label}
                </span>
              </div>
            );
          })}
        </div>
      </Section>
    ),
    "cameras-by-site": (
      <Section title="Cameras by Site"
        action={<Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/site/overview")}>
          Sites <ArrowUpRight className="size-3" />
        </Button>}>
          <div className="h-[260px]">
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={camerasBySite} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="online"  stackId="a" fill="var(--success)"      radius={[0, 0, 0, 0]} />
                <Bar dataKey="offline" stackId="a" fill="var(--sev-critical)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-sm bg-success" />
            Online
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-sm bg-sev-critical" />
            Offline
          </span>
        </div>
      </Section>
    ),
    activity: (
      <Section
        title="Recent Activity Log"
        action={
          <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/activity-logs")}>
            <ScrollText className="size-3" />
            View full log <ArrowUpRight className="size-3" />
          </Button>
        }
      >
        {/* Height matches the Cameras by Site chart (h-[260px] + ~24px legend = ~300px) */}
        <div className="-mx-4 -my-4">
          <div className="grid grid-cols-[96px_140px_1fr] gap-4 border-b border-border bg-muted/30 px-4 py-2">
            <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">When</p>
            <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
            <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">Activity</p>
          </div>
          <div className="h-[268px] overflow-y-auto">
            {recentActivity.map((a) => {
              const ks = ACTIVITY_KIND_STYLES[a.kind];
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-[96px_140px_1fr] gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0 hover:bg-muted/20"
                >
                  <div className="min-w-0">
                    <TruncatedText text={a.whenRelative} className="font-mono text-2xs text-muted-foreground" />
                    <TruncatedText text={a.module} className="mt-0.5 text-2xs text-muted-foreground/60" />
                  </div>
                  <div>
                    <span
                      className={cn(
                        "inline-flex w-fit max-w-full items-center truncate whitespace-nowrap rounded px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
                        ks.bg,
                        ks.text
                      )}
                    >
                      {ACTIVITY_KIND_LABELS[a.kind]}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm leading-snug text-foreground">
                      <span className="font-semibold">{a.actor.name}</span>{" "}
                      <span className="text-muted-foreground">{a.text}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>
    ),
  };

  return (
    /* While editing, the docked drawer covers the right edge — pad the page
       so no panel sits underneath it. */
    <div className={cn(
      "flex flex-col gap-4 transition-[padding] duration-[var(--duration-normal)] ease-standard",
      editing && "sm:pr-80"
    )}>
      {showAlertBanner && worstGroup && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            systemStatus === "critical"
              ? "border-sev-critical/40 bg-sev-critical/[0.06]"
              : "border-warning/40 bg-warning/[0.06]"
          )}
        >
          <TriangleAlert
            className={cn(
              "mt-0.5 size-4 flex-shrink-0",
              systemStatus === "critical" ? "text-sev-critical" : "text-warning"
            )}
          />
          <div className="min-w-0 flex-1 text-base">
            <span className={cn("font-semibold", systemStatus === "critical" ? "text-sev-critical" : "text-warning")}>
              Alert · {statusPresentation.label}
            </span>
            <span className="ml-1 text-muted-foreground">
              <strong className="text-foreground">{worstGroup.g.online} of {worstGroup.g.total}</strong>{" "}
              {worstGroup.label} online
              {worstGroup.g.degraded > 0 && <>, {worstGroup.g.degraded} degraded</>}. Check Device Health for details.
            </span>
          </div>
          <button
            onClick={() => setAlertAcknowledged(true)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss alert"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Dashboard</PageHeader.Title>
          <PageHeader.Description>
            Workspace-wide overview — pulled live from cameras, detections, incidents, deployments and storage.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold",
              statusPresentation.pill
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                statusPresentation.dot,
                systemStatus === "healthy" && "animate-pulse"
              )}
            />
            {statusPresentation.label}
          </span>
          {!editing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}>
              <Pencil className="size-3.5" />
              Customize
            </Button>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {/* Edit bar — stays on screen while the operator scrolls the panels. */}
      {editing && (
        <div className="sticky top-0 z-[var(--z-sticky)] flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-lg">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Pencil className="size-4" />
          </div>
          <div className="min-w-60 flex-1">
            <p className="text-base font-semibold text-foreground">Customizing your dashboard</p>
            <p className="text-xs text-muted-foreground">
              Drag a panel to move it · click it to move or remove · drag hidden panels in from the drawer.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground"
              disabled={layout.join() === DEFAULT_LAYOUT.join()}
              onClick={() => { setLayout(DEFAULT_LAYOUT); toast("Layout reset to default"); }}>
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
            <Button size="sm" className="gap-1.5" onClick={finishEditing}>
              <Check className="size-3.5" />
              Done
            </Button>
          </div>
        </div>
      )}

      {/* The range drives every panel, so it stays above them rather than being one. */}
      <DateRangeBar
        presets={dateFilters}
        active={dateRange}
        onSelect={(k) => setDateRange(k as DateRange)}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomApply={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomReset={() => { setCustomFrom(""); setCustomTo(""); setDateRange("today"); }}
        showingLabel={
          <>
            Showing <strong className="text-foreground">{dateLabel}</strong>
            <span className="ml-2 text-muted-foreground/60">· {eventsInRange} event{eventsInRange === 1 ? "" : "s"}</span>
          </>
        }
      />

      <DashboardCanvas layout={layout} setLayout={setLayout} editing={editing} bodies={bodies} />
    </div>
  );
}
