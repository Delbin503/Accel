import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Badge } from "./badge";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

const ROWS = [
  { id: "CAM-001", area: "Lobby", status: "online" },
  { id: "CAM-002", area: "Parking", status: "offline" },
  { id: "CAM-003", area: "Dock", status: "online" },
];

export const Default: Story = {
  render: () => (
    <Table className="w-[34rem]">
      <TableCaption>Cameras across the North site.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Camera ID</TableHead>
          <TableHead>Area</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROWS.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">{r.id}</TableCell>
            <TableCell>{r.area}</TableCell>
            <TableCell className="text-right">
              <Badge variant={r.status === "online" ? "secondary" : "destructive"}>
                {r.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
