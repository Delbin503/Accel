import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchX } from "lucide-react";
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
