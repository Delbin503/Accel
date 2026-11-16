import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoreHorizontal, SearchX } from "lucide-react";
import { Button } from "../ui/button";
import { DataTable, type DataTableColumn } from "./DataTable";
import { StatusBadge } from "./StatusBadge";

const meta: Meta = {
  title: "Shared/DataTable",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

interface Camera {
  id: string;
  area: string;
  status: "online" | "offline";
}

const COLUMNS: DataTableColumn<Camera>[] = [
  { key: "id", header: "Camera ID", cell: (r) => <span className="font-mono text-xs">{r.id}</span> },
  { key: "area", header: "Area" },
  {
    key: "status",
    header: "Status",
    align: "right",
    cell: (r) => (
      <StatusBadge tone={r.status === "online" ? "success" : "critical"}>{r.status}</StatusBadge>
    ),
  },
];

const DATA: Camera[] = [
  { id: "CAM-001", area: "Lobby", status: "online" },
  { id: "CAM-002", area: "Parking", status: "offline" },
  { id: "CAM-003", area: "Dock", status: "online" },
];

export const Populated: Story = {
  render: () => (
    <div className="w-[40rem]">
      <DataTable columns={COLUMNS} data={DATA} getRowId={(r) => r.id} onRowClick={() => {}} />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="w-[40rem]">
      <DataTable columns={COLUMNS} data={[]} getRowId={(r) => r.id} isLoading />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-[40rem]">
      <DataTable
        columns={COLUMNS}
        data={[]}
        getRowId={(r) => r.id}
        empty={{ icon: SearchX, title: "No cameras match the filters" }}
      />
    </div>
  ),
};

const LIST_DATA: Camera[] = Array.from({ length: 14 }, (_, i) => ({
  id: `CAM-${String(i + 1).padStart(3, "0")}`,
  area: ["Lobby", "Parking", "Dock", "Warehouse", "Gate"][i % 5],
  status: i % 4 === 1 ? "offline" : "online",
}));

const LIST_COLUMNS: DataTableColumn<Camera>[] = [
  ...COLUMNS.slice(0, 2),
  {
    key: "status",
    header: "Status",
    cell: (r) => <StatusBadge tone={r.status === "online" ? "success" : "critical"}>{r.status}</StatusBadge>,
  },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    align: "right",
    stopRowClick: true,
    sticky: "right",
    cell: (r) => (
      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.id}`}>
        <MoreHorizontal />
      </Button>
    ),
  },
];

/** House list-page style, row click + keyboard activation, a menu cell that doesn't open the row, offline rows tinted. */
function ListVariantDemo() {
  const [opened, setOpened] = React.useState<string | null>(null);
  return (
    <div className="w-[40rem] space-y-2">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <DataTable
          variant="list"
          columns={LIST_COLUMNS}
          data={LIST_DATA.slice(0, 5)}
          getRowId={(r) => r.id}
          onRowClick={(r) => setOpened(r.id)}
          getRowClassName={(r) => (r.status === "offline" ? "bg-muted/40" : undefined)}
        />
      </div>
      <p className="text-sm text-muted-foreground">Opened: {opened ?? "—"} (Tab to a row, press Enter)</p>
    </div>
  );
}

export const ListVariant: Story = {
  render: () => <ListVariantDemo />,
};

function SelectionDemo() {
  const [selected, setSelected] = React.useState<string[]>(["CAM-002"]);
  const data = LIST_DATA.slice(0, 5);
  return (
    <div className="w-[40rem] overflow-hidden rounded-xl border border-border bg-card">
      <DataTable
        variant="list"
        columns={LIST_COLUMNS}
        data={data}
        getRowId={(r) => r.id}
        selection={{
          selectedIds: selected,
          onToggle: (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
          onToggleAll: (all) => setSelected(all ? data.map((r) => r.id) : []),
          getRowLabel: (r) => `Select ${r.id}`,
        }}
      />
    </div>
  );
}

export const Selection: Story = {
  render: () => <SelectionDemo />,
};

export const StickyHeader: Story = {
  render: () => (
    <div className="w-[40rem] overflow-hidden rounded-xl border border-border bg-card">
      <DataTable
        variant="list"
        stickyHeader
        containerClassName="max-h-72"
        columns={LIST_COLUMNS}
        data={LIST_DATA}
        getRowId={(r) => r.id}
      />
    </div>
  ),
};

/** Single muted line — for tables inside cards and panels. */
export const InlineEmpty: Story = {
  render: () => (
    <div className="w-[40rem] overflow-hidden rounded-xl border border-border bg-card">
      <DataTable
        variant="list"
        columns={LIST_COLUMNS}
        data={[]}
        getRowId={(r) => r.id}
        empty={{ variant: "inline", title: "No invoices yet" }}
      />
    </div>
  ),
};
