import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "../src/components/shared/DataTable";

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = [
  { id: "CAM-001", name: "Lobby" },
  { id: "CAM-002", name: "Dock" },
];

function columns(onMenu = vi.fn()): DataTableColumn<Row>[] {
  return [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    {
      key: "menu",
      header: "Actions",
      stopRowClick: true,
      cell: (r) => (
        <button type="button" onClick={() => onMenu(r.id)}>
          Menu {r.id}
        </button>
      ),
    },
  ];
}

describe("DataTable", () => {
  it("calls onRowClick on click and on Enter / Space when the row is focused", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable columns={columns()} data={ROWS} getRowId={(r) => r.id} onRowClick={onRowClick} />);

    const rows = screen.getAllByRole("row").slice(1);
    await user.click(within(rows[0]).getByText("Lobby"));
    expect(onRowClick).toHaveBeenLastCalledWith(ROWS[0]);

    rows[1].focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenLastCalledWith(ROWS[1]);
    await user.keyboard(" ");
    expect(onRowClick).toHaveBeenCalledTimes(3);
  });

  it("does not open the row from a stopRowClick cell", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onMenu = vi.fn();
    render(<DataTable columns={columns(onMenu)} data={ROWS} getRowId={(r) => r.id} onRowClick={onRowClick} />);

    await user.click(screen.getByRole("button", { name: "Menu CAM-001" }));
    expect(onMenu).toHaveBeenCalledWith("CAM-001");
    expect(onRowClick).not.toHaveBeenCalled();

    screen.getByRole("button", { name: "Menu CAM-002" }).focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("selects rows, and the header checkbox selects all or clears", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [selected, setSelected] = React.useState<string[]>([]);
      return (
        <DataTable
          columns={columns()}
          data={ROWS}
          getRowId={(r) => r.id}
          selection={{
            selectedIds: selected,
            onToggle: (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])),
            onToggleAll: (all) => setSelected(all ? ROWS.map((r) => r.id) : []),
            getRowLabel: (r) => `Select ${r.name}`,
            selectAllLabel: "Select every camera",
          }}
        />
      );
    }
    render(<Demo />);

    const all = screen.getByRole("checkbox", { name: "Select every camera" });
    await user.click(screen.getByRole("checkbox", { name: "Select Lobby" }));
    expect(all).toHaveAttribute("data-state", "indeterminate");

    await user.click(all);
    expect(screen.getByRole("checkbox", { name: "Select Dock" })).toBeChecked();
    expect(screen.getAllByRole("row").filter((r) => r.getAttribute("data-state") === "selected")).toHaveLength(2);

    await user.click(all);
    expect(screen.getByRole("checkbox", { name: "Select Lobby" })).not.toBeChecked();
  });

  it("shows loading skeletons, then the inline empty message", () => {
    const { rerender, container } = render(
      <DataTable columns={columns()} data={[]} getRowId={(r) => r.id} isLoading skeletonRows={3} />
    );
    expect(container.querySelectorAll("[data-slot=data-table-skeleton-row]")).toHaveLength(3);

    rerender(
      <DataTable columns={columns()} data={[]} getRowId={(r) => r.id} empty={{ title: "No cameras yet", variant: "inline" }} />
    );
    expect(screen.getByText("No cameras yet")).toBeInTheDocument();
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "3");
  });
});
