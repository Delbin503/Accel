import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleCheck, CircleX, Download, LoaderCircle, MoreHorizontal, Plus, SearchX, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { SegmentedControl, SegmentedControlItem } from "../components/ui/segmented-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ConfirmDialog } from "../components/shared/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../components/shared/DataTable";
import { EmptyState } from "../components/shared/EmptyState";
import { FilterDropdown } from "../components/shared/FilterDropdown";
import { KpiCard, KpiGrid } from "../components/shared/KpiCard";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "../components/shared/Modal";
import { ListErrorState } from "../components/shared/PageStates";
import { SectionCard } from "../components/shared/SectionCard";
import { DescriptionItem, DescriptionList } from "../components/shared/DescriptionList";
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerHeader,
  DetailDrawerSection,
  DetailDrawerTitle,
} from "../components/shared/DetailDrawer";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Toolbar, ToolbarSearch } from "../components/shared/Toolbar";
import { cn } from "../lib/utils";

/**
 * Usage guidelines — a live Do / Don't pair and a few rules for the ten
 * components that make up most Accel pages. Every example is rendered with the
 * real component, so what you see is what the code produces.
 *
 * Rules come from CLAUDE.md, docs/choosing-components.md and the components'
 * own doc comments — nothing here is new policy.
 */
const meta: Meta = {
  title: "Guidelines/Usage",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

/* ─── Page scaffolding ─────────────────────────────────────────────────── */

function Example({ kind, caption, children }: { kind: "do" | "dont"; caption: string; children: React.ReactNode }) {
  const isDo = kind === "do";
  return (
    <figure
      data-slot={isDo ? "guideline-do" : "guideline-dont"}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border-2 bg-card",
        isDo ? "border-success/40" : "border-severity-critical/60"
      )}
    >
      <figcaption
        data-slot="guideline-example-caption"
        className={cn(
          "flex items-center gap-2 border-b px-4 py-2.5",
          isDo ? "border-success/30" : "border-severity-critical/30"
        )}
      >
        <StatusBadge tone={isDo ? "success" : "critical"} dot={false}>
          {isDo ? <CircleCheck className="size-3" aria-hidden /> : <CircleX className="size-3" aria-hidden />}
          {isDo ? "Do" : "Don't"}
        </StatusBadge>
        <span className="text-sm text-foreground">{caption}</span>
      </figcaption>
      <div data-slot="guideline-example-body" className="flex flex-1 flex-col justify-center gap-3 bg-background p-5">
        {children}
      </div>
    </figure>
  );
}

function Guideline({
  title,
  summary,
  rules,
  doCaption,
  dontCaption,
  doExample,
  dontExample,
}: {
  title: string;
  summary: React.ReactNode;
  rules: React.ReactNode[];
  doCaption: string;
  dontCaption: string;
  doExample: React.ReactNode;
  dontExample: React.ReactNode;
}) {
  return (
    <article data-slot="guideline" className="max-w-5xl space-y-5 text-base text-foreground">
      <header data-slot="guideline-header" className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-md text-muted-foreground">{summary}</p>
      </header>
      <div data-slot="guideline-examples" className="grid gap-4 md:grid-cols-2">
        <Example kind="do" caption={doCaption}>{doExample}</Example>
        <Example kind="dont" caption={dontCaption}>{dontExample}</Example>
      </div>
      <section data-slot="guideline-rules" aria-label="Rules" className="rounded-xl border border-border bg-card p-5">
        <p className="mb-2 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Rules</p>
        <ul className="list-disc space-y-1.5 pl-5 text-base text-foreground marker:text-muted-foreground">
          {rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm text-foreground">{children}</code>;
}

/* ─── 1. Button ────────────────────────────────────────────────────────── */

export const ButtonUsage: Story = {
  name: "Button",
  render: () => (
    <Guideline
      title="Button"
      summary="Actions — Save, Deploy, Export. Pick the variant by the action's weight, not by looks."
      doCaption="One primary action; the rest step down"
      dontCaption="Every action shouts"
      doExample={
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Plus /> Add camera
          </Button>
          <Button variant="outline">
            <Download /> Export
          </Button>
          <Button variant="ghost">Settings</Button>
          <Button variant="outline" size="icon-sm" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </div>
      }
      dontExample={
        <div className="flex flex-wrap items-center gap-2">
          <Button>
            <Plus /> Add camera
          </Button>
          <Button>
            <Download /> Export
          </Button>
          <Button>Settings</Button>
          <Button variant="destructive">Delete all</Button>
        </div>
      }
      rules={[
        <>One <Code>variant="default"</Code> (filled orange) button per area — the page header, a modal footer, a card. Secondary actions use <Code>outline</Code>, tertiary <Code>ghost</Code>, inline text actions <Code>link</Code>.</>,
        <>Icon-only buttons use <Code>size="icon-xs"…"icon-lg"</Code> and always carry an <Code>aria-label</Code>.</>,
        <>Brand orange: solid fills use <Code>bg-primary-fill</Code> (what <Code>variant="default"</Code> already does) and orange text uses <Code>text-primary-ink</Code>. Never put a label on bare <Code>bg-primary</Code> — it fails WCAG AA.</>,
        <><Code>variant="destructive"</Code> marks a dangerous action; the action itself goes through a ConfirmDialog. Never use a raw <Code>{"<button>"}</Code> in pages.</>,
      ]}
    />
  ),
};

/* ─── 2. StatusBadge ───────────────────────────────────────────────────── */

export const StatusBadgeUsage: Story = {
  name: "StatusBadge",
  render: () => (
    <Guideline
      title="StatusBadge"
      summary="Every status, severity and health pill. Colour comes from the semantic tone, never from classes."
      doCaption="StatusBadge with a semantic tone"
      dontCaption="Badge restyled per page, tone chosen by looks"
      doExample={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="success">Online</StatusBadge>
          <StatusBadge tone="critical">Offline</StatusBadge>
          <StatusBadge tone="warning">Degraded</StatusBadge>
          <StatusBadge tone="neutral">Archived</StatusBadge>
          <Badge variant="secondary">12 cameras</Badge>
        </div>
      }
      dontExample={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-success/40 text-success">online</Badge>
          <Badge variant="destructive">OFFLINE</Badge>
          <StatusBadge tone="violet">Degraded</StatusBadge>
          <StatusBadge tone="success">12 cameras</StatusBadge>
        </div>
      }
      rules={[
        <>Status, severity and health always render as <Code>StatusBadge</Code>; pick <Code>tone</Code> by meaning — <Code>success</Code> healthy, <Code>warning</Code> degraded, <Code>critical</Code>/<Code>high</Code>/<Code>medium</Code>/<Code>low</Code> severity, <Code>neutral</Code> inactive.</>,
        <>Don't recolour <Code>Badge</Code> with classes to fake a status. <Code>Badge</Code> is for neutral counts and tags.</>,
        <><Code>violet</Code> is categorical (AI/model, vehicles, NVR) — never a health state. <Code>purple</Code> and <Code>sev-*</Code> are deprecated names.</>,
        <>Use the same label for the same state everywhere; the badge uppercases it for you.</>,
      ]}
    />
  ),
};

/* ─── 3. KpiCard + KpiGrid ─────────────────────────────────────────────── */

export const KpiCardUsage: Story = {
  name: "KpiCard + KpiGrid",
  render: () => (
    <Guideline
      title="KpiCard + KpiGrid"
      summary="Headline metrics at the top of a page. The value stays neutral; meaning lives in the tone dot and the trend."
      doCaption="KpiCards in a KpiGrid, tone by meaning"
      dontCaption="Hand-built number cards"
      doExample={
        <KpiGrid cols={3}>
          <KpiCard label="Cameras online" value="128 / 134" sub="Across 6 sites" tone="success" />
          <KpiCard
            label="Critical events"
            value={14}
            sub="vs yesterday"
            tone="severity-critical"
            trend={{ value: "8", direction: "up", sentiment: "negative" }}
          />
          <KpiCard label="Open cases" value={9} sub="3 overdue" tone="warning" />
        </KpiGrid>
      }
      dontExample={
        <div className="grid grid-cols-3 gap-3">
          <Card className="py-4">
            <CardContent className="px-4">
              <p className="text-sm text-muted-foreground">Cameras</p>
              <p className="text-4xl font-bold text-success">128</p>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="px-4">
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-4xl font-bold text-severity-critical">14</p>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="px-4">
              <p className="text-sm text-muted-foreground">Cases</p>
              <p className="text-2xl font-bold text-violet">9</p>
            </CardContent>
          </Card>
        </div>
      }
      rules={[
        <>Wrap KPI strips in <Code>KpiGrid cols={"{3|4|5|6}"}</Code> — it owns the responsive columns and gaps.</>,
        <>Colour via <Code>tone</Code> (same vocabulary as StatusBadge). <Code>accent</Code> is a deprecated alias; <Code>icon</Code> is accepted but never rendered.</>,
        <>For metrics where rising is bad, set <Code>{"trend.sentiment=\"negative\""}</Code> so an up arrow turns red.</>,
        <>Pass <Code>onClick</Code> + <Code>active</Code> when a card filters the list below it; don't wrap it in your own button.</>,
      ]}
    />
  ),
};

/* ─── 4. SectionCard ───────────────────────────────────────────────────── */

export const SectionCardUsage: Story = {
  name: "SectionCard",
  render: () => (
    <Guideline
      title="SectionCard"
      summary="A titled block of content on a page or in a drawer. Card is only for plain surfaces with no title chrome."
      doCaption="SectionCard with title, description and action slot"
      dontCaption="Card + a hand-made header"
      doExample={
        <SectionCard
          title="Recording schedule"
          description="Applies to 14 cameras"
          action={<Button variant="outline">Edit</Button>}
        >
          <p className="text-sm text-muted-foreground">Continuous 08:00–20:00, motion-only overnight.</p>
        </SectionCard>
      }
      dontExample={
        <Card className="gap-2 py-4">
          <CardHeader className="flex flex-row items-center justify-between px-4">
            <CardTitle className="text-xl text-primary-ink">RECORDING SCHEDULE</CardTitle>
            <Button>Edit</Button>
          </CardHeader>
          <CardContent className="px-4">
            <p className="text-sm text-muted-foreground">Continuous 08:00–20:00, motion-only overnight.</p>
          </CardContent>
        </Card>
      }
      rules={[
        <>Header actions go in the <Code>action</Code> slot, usually an <Code>outline</Code> or <Code>ghost</Code> button — the page's primary action lives in the PageHeader.</>,
        <>Tables and lists that run edge to edge use <Code>flushBody</Code>; narrow side columns use <Code>size="sm"</Code>.</>,
        <>Use <Code>collapsible</Code> (+ <Code>defaultOpen</Code>) for optional detail rather than building your own disclosure.</>,
      ]}
    />
  ),
};

/* ─── 5. DataTable ─────────────────────────────────────────────────────── */

interface Cam {
  id: string;
  name: string;
  status: "online" | "offline";
}

const CAMS: Cam[] = [
  { id: "CAM-014", name: "Lobby entrance", status: "online" },
  { id: "CAM-022", name: "Loading dock", status: "offline" },
  { id: "CAM-031", name: "Car park B", status: "online" },
];

function camColumns(stop: boolean): DataTableColumn<Cam>[] {
  return [
    { key: "id", header: "Camera", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
    { key: "name", header: "Name" },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge tone={r.status === "online" ? "success" : "critical"}>{r.status}</StatusBadge>,
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      stopRowClick: stop,
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.id}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Restart</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function TableExample({ good }: { good: boolean }) {
  const [opened, setOpened] = React.useState<string | null>(null);
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <DataTable
          variant={good ? "list" : "default"}
          columns={camColumns(good)}
          data={CAMS}
          getRowId={(r) => r.id}
          onRowClick={(r) => setOpened(r.id)}
        />
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Row opened: {opened ?? "—"} {good ? "(the ⋯ menu doesn't open the row)" : "(try the ⋯ menu — it opens the row too)"}
      </p>
    </div>
  );
}

export const DataTableUsage: Story = {
  name: "DataTable",
  render: () => (
    <Guideline
      title="DataTable"
      summary="Any list of records with columns. It owns loading, empty, row click (Enter / Space too), selection and sticky parts."
      doCaption='variant="list", menu cell with stopRowClick'
      dontCaption="Default variant on a list page, menu cell bubbles"
      doExample={<TableExample good />}
      dontExample={<TableExample good={false} />}
      rules={[
        <>List pages use <Code>variant="list"</Code>, inside a <Code>rounded-xl border bg-card</Code> wrapper (or a SectionCard with <Code>flushBody</Code>).</>,
        <>Cells with their own controls (⋯ menu, buttons, links) set <Code>stopRowClick</Code> so they don't also open the row.</>,
        <>Pass <Code>isLoading</Code> and <Code>empty={"{ icon, title, description }"}</Code> instead of swapping the table out; use <Code>empty.variant="inline"</Code> inside cards.</>,
        <>Status columns render StatusBadge. Never hand-roll a <Code>{"<table>"}</Code>; use ui <Code>Table</Code> parts only for grouped or expandable rows.</>,
      ]}
    />
  ),
};

/* ─── 6. Toolbar + ToolbarSearch + FilterDropdown ──────────────────────── */

const SITE_OPTIONS = [
  { value: "hq", label: "HQ Tower" },
  { value: "dock", label: "North Dock" },
  { value: "mall", label: "Riverside Mall" },
];

function ToolbarDo() {
  const [q, setQ] = React.useState("");
  const [sites, setSites] = React.useState<string[]>(["hq"]);
  return (
    <Toolbar>
      <ToolbarSearch value={q} onChange={setQ} placeholder="Search cameras…" aria-label="Search cameras" />
      <FilterDropdown label="All sites" options={SITE_OPTIONS} selected={sites} onChange={setSites} className="w-40" />
      <div className="ml-auto">
        <Button variant="outline">
          <Download /> Export
        </Button>
      </div>
    </Toolbar>
  );
}

function ToolbarDont() {
  const [site, setSite] = React.useState("hq");
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {SITE_OPTIONS.map((o) => (
          <Button key={o.value} variant={site === o.value ? "default" : "outline"} onClick={() => setSite(o.value)}>
            {o.label}
          </Button>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="outline">Export</Button>
      </div>
    </div>
  );
}

export const ToolbarUsage: Story = {
  name: "Toolbar + ToolbarSearch + FilterDropdown",
  render: () => (
    <Guideline
      title="Toolbar + ToolbarSearch + FilterDropdown"
      summary="The search-and-filter row above a list. One row, wraps on small screens, trailing actions pushed right."
      doCaption="Toolbar: search, multi-select filter, action on the right"
      dontCaption="A row of filled buttons faking a filter"
      doExample={<ToolbarDo />}
      dontExample={<ToolbarDont />}
      rules={[
        <><Code>Toolbar</Code> is the row; <Code>ToolbarSearch</Code> is the search (give it an <Code>aria-label</Code>); filters are <Code>FilterDropdown</Code>s.</>,
        <>Push trailing actions right with <Code>className="ml-auto"</Code> on the action group.</>,
        <>Several filters with "Clear all" → <Code>FilterPanel</Code>; a date range → <Code>DateRangeBar</Code>; a few always-visible chips → <Code>{'SegmentedControl type="multiple" variant="outline"'}</Code>.</>,
        <>Never build filter chips from Buttons with a manual active state.</>,
      ]}
    />
  ),
};

/* ─── 7. Modal / ModalForm + ConfirmDialog ─────────────────────────────── */

function ConfirmDo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Delete site
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete site"
        description={<>Are you sure you want to delete <strong>North Dock</strong>? Its 14 cameras will be unassigned.</>}
        confirmLabel="Delete site"
        destructive
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

function ConfirmDont() {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 /> Delete site
      </Button>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent size="lg">
          <ModalHeader title="WARNING!! Delete site?" description="Hand-built delete prompt" />
          <ModalBody>
            <p className="text-lg font-bold text-severity-critical">This cannot be undone!</p>
            <p className="text-sm text-muted-foreground">North Dock and all its cameras.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>No</Button>
            <Button onClick={() => setOpen(false)}>Yes, delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export const ModalUsage: Story = {
  name: "Modal / ModalForm + ConfirmDialog",
  render: () => (
    <Guideline
      title="Modal / ModalForm + ConfirmDialog"
      summary="Modal for a focused task the user must finish or cancel; ConfirmDialog for yes/no and destructive prompts. Open both to compare."
      doCaption="ConfirmDialog: one line, one destructive action"
      dontCaption="Hand-built Modal with shouting copy and three buttons"
      doExample={<ConfirmDo />}
      dontExample={<ConfirmDont />}
      rules={[
        <>Destructive actions always confirm through <Code>ConfirmDialog</Code> with <Code>destructive</Code>; the description is one "Are you sure you want to…" line with the item in <Code>{"<strong>"}</Code>.</>,
        <>Modals are always <Code>ModalHeader</Code> → <Code>ModalBody</Code> → <Code>ModalFooter</Code>. <Code>ModalSubheader</Code> is the only slot between header and body (stepper, search strip).</>,
        <>Footers carry one action — close is the ✕ / Esc, not a Cancel button. Titles stay neutral; the red button carries the danger.</>,
        <>Fields inside a modal use <Code>ModalForm</Code> parts (<Code>ModalField</Code>, <Code>ModalTextInput</Code>, <Code>ModalSelect</Code>, <Code>CheckList</Code>) — see Guidelines/Page patterns → Form wizard.</>,
      ]}
    />
  ),
};

/* ─── 8. Sheet (detail drawer) ─────────────────────────────────────────── */

function SheetDo() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={() => setOpen(true)}>Open CAM-022 details</Button>
      <p className="text-sm text-muted-foreground">Opens a side panel; the list stays visible behind it.</p>
      <DetailDrawer open={open} onOpenChange={setOpen} size="md">
        <DetailDrawerHeader>
          <div className="flex items-center gap-1.5">
            <StatusBadge tone="critical">Offline</StatusBadge>
          </div>
          <DetailDrawerTitle>Loading dock</DetailDrawerTitle>
          <DetailDrawerDescription>CAM-022 · North Dock</DetailDrawerDescription>
        </DetailDrawerHeader>
        <DetailDrawerBody>
          <DetailDrawerSection title="Connection">
            <DescriptionList layout="inline" variant="card">
              <DescriptionItem label="Last seen">14 min ago</DescriptionItem>
              <DescriptionItem label="IP address" mono>10.20.4.22</DescriptionItem>
            </DescriptionList>
          </DetailDrawerSection>
        </DetailDrawerBody>
      </DetailDrawer>
    </div>
  );
}

function SheetDont() {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-2">
      <Button variant="outline" onClick={() => setOpen(true)}>Open CAM-022 details</Button>
      <p className="text-sm text-muted-foreground">Opens a centred modal that hides the list.</p>
      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent>
          <ModalHeader title="Loading dock" description="Camera details" />
          <ModalBody>
            <p className="text-sm text-muted-foreground">CAM-022 · Offline · Last seen 14 min ago.</p>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}

export const SheetUsage: Story = {
  name: "DetailDrawer",
  render: () => (
    <Guideline
      title="DetailDrawer"
      summary="Details of a row — event, case, camera, user — while the list stays visible."
      doCaption="Row → DetailDrawer with title + StatusBadge"
      dontCaption="Row → centred Modal for read-mostly detail"
      doExample={<SheetDo />}
      dontExample={<SheetDont />}
      rules={[
        <>Open a <Code>DetailDrawer</Code> from <Code>DataTable onRowClick</Code>. A <Code>Modal</Code> is for a task to finish, not for reading a record.</>,
        <>Header: <Code>DetailDrawerHeader</Code> with a <Code>StatusBadge</Code>, <Code>DetailDrawerTitle</Code> and <Code>DetailDrawerDescription</Code> for the ID / site line; extra buttons go in <Code>actions</Code>, the close button is built in.</>,
        <>Body: <Code>DetailDrawerSection</Code>s holding a <Code>DescriptionList</Code> for key / value facts. Footer: one primary action, secondary as <Code>outline</Code>, destructive in <Code>DetailDrawerFooterStart</Code> via ConfirmDialog.</>,
        <>Pick a <Code>size</Code> (<Code>md</Code> / <Code>lg</Code> default / <Code>xl</Code> for media) — never hand-size <Code>SheetContent</Code>.</>,
      ]}
    />
  ),
};

/* ─── 9. SegmentedControl vs Tabs ──────────────────────────────────────── */

function SegTabsDo() {
  const [view, setView] = React.useState("grid");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Layout (same content, new mode)</span>
        <SegmentedControl type="single" value={view} onValueChange={(v) => v && setView(v)} aria-label="Layout">
          <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
          <SegmentedControlItem value="list">List</SegmentedControlItem>
          <SegmentedControlItem value="wall">Wall</SegmentedControlItem>
        </SegmentedControl>
      </div>
      <Tabs defaultValue="overview">
        <TabsList aria-label="Camera sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="text-sm text-muted-foreground">Overview panel</TabsContent>
        <TabsContent value="channels" className="text-sm text-muted-foreground">Channels panel</TabsContent>
        <TabsContent value="recordings" className="text-sm text-muted-foreground">Recordings panel</TabsContent>
      </Tabs>
    </div>
  );
}

function SegTabsDont() {
  const [panel, setPanel] = React.useState("overview");
  return (
    <div className="space-y-4">
      <SegmentedControl type="single" value={panel} onValueChange={(v) => v && setPanel(v)} aria-label="Camera sections">
        <SegmentedControlItem value="overview">Overview</SegmentedControlItem>
        <SegmentedControlItem value="channels">Channels</SegmentedControlItem>
        <SegmentedControlItem value="recordings">Recordings</SegmentedControlItem>
      </SegmentedControl>
      <p className="text-sm text-muted-foreground">
        {panel === "overview" ? "Overview panel" : panel === "channels" ? "Channels panel" : "Recordings panel"}
      </p>
    </div>
  );
}

export const SegmentedVsTabs: Story = {
  name: "SegmentedControl vs Tabs",
  render: () => (
    <Guideline
      title="SegmentedControl vs Tabs"
      summary="Both look like a row of options. Pick by behaviour: does the choice change a mode in place, or swap a whole panel?"
      doCaption="SegmentedControl for a mode, Tabs for panels"
      dontCaption="SegmentedControl swapping whole panels"
      doExample={<SegTabsDo />}
      dontExample={<SegTabsDont />}
      rules={[
        <><Code>{'SegmentedControl type="single"'}</Code> — 2–5 options switching a view or mode in place (Grid / List / Wall, 24h / 12h).</>,
        <><Code>Tabs</Code> — each option swaps a content panel below; you get tab / tabpanel semantics and arrow keys for free.</>,
        <>Guard single SegmentedControls with <Code>{"onValueChange={(v) => v && set(v)}"}</Code> so clicking the active item can't clear the value, and give the group an <Code>aria-label</Code>.</>,
        <>One on/off setting is a <Code>Switch</Code>, not a one-item SegmentedControl.</>,
      ]}
    />
  ),
};

/* ─── 10. EmptyState / PageStates ──────────────────────────────────────── */

export const EmptyAndPageStates: Story = {
  name: "EmptyState / PageStates",
  render: () => (
    <Guideline
      title="EmptyState / PageStates"
      summary="Every data-driven view handles loading, empty and error explicitly — inside the page chrome, not instead of it."
      doCaption="EmptyState with a way out; ListErrorState with Retry"
      dontCaption="A bare line of text and a page-wide spinner"
      doExample={
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card">
            <EmptyState
              icon={SearchX}
              title="No cameras match the filters"
              description="Try a different site or clear the search."
              action={<Button variant="outline">Clear filters</Button>}
            />
          </div>
          <ListErrorState onRetry={() => {}} title="Couldn't load cameras" />
        </div>
      }
      dontExample={
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No data</p>
          <div className="flex h-40 items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
          </div>
        </div>
      }
      rules={[
        <>No data or no results → <Code>EmptyState</Code> with an icon, a specific title and, when possible, an <Code>action</Code> (Clear filters, Add camera).</>,
        <>List pages: <Code>ListLoadingState</Code> / <Code>ListErrorState</Code> from <Code>PageStates</Code> keep the KPI row, toolbar and table shape. One block loading → <Code>Skeleton</Code>.</>,
        <>Tables show their own loading and empty states via <Code>isLoading</Code> and <Code>empty</Code>.</>,
        <>Errors always offer <Code>onRetry</Code>. See Guidelines/Page patterns → List page to flip through all states.</>,
      ]}
    />
  ),
};
