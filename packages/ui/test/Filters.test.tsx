import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterDropdown } from "../src/components/shared/FilterDropdown";
import { FilterPanel } from "../src/components/shared/FilterPanel";
import { DateRangeBar } from "../src/components/shared/DateRangeBar";

const SITES = [
  { value: "changi", label: "Changi Hub" },
  { value: "jurong", label: "Jurong Depot" },
  { value: "tuas", label: "Tuas Port" },
];

function SitesFilter({ onClear }: { onClear?: () => void }) {
  const [sites, setSites] = React.useState<string[]>([]);
  return (
    <FilterPanel
      active={sites.length > 0}
      onClear={() => {
        setSites([]);
        onClear?.();
      }}
    >
      <FilterDropdown label="All sites" options={SITES} selected={sites} onChange={setSites} />
    </FilterPanel>
  );
}

describe("FilterDropdown + FilterPanel", () => {
  it("toggles options, summarises the selection, and shows the state to screen readers", async () => {
    const user = userEvent.setup();
    render(<SitesFilter />);

    await user.click(screen.getByRole("button", { name: "All sites" }));
    // Options live in the open popover (the trigger can share an option's name)
    const menu = () => within(screen.getByRole("dialog"));
    expect(menu().getByRole("button", { name: "Changi Hub" })).toHaveAttribute("aria-pressed", "false");

    await user.click(menu().getByRole("button", { name: "Changi Hub" }));
    expect(menu().getByRole("button", { name: "Changi Hub" })).toHaveAttribute("aria-pressed", "true");
    await user.click(menu().getByRole("button", { name: "Tuas Port" }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "2 selected" })).toBeInTheDocument();

    // Deselecting brings the single-label summary back
    await user.click(screen.getByRole("button", { name: "2 selected" }));
    await user.click(menu().getByRole("button", { name: "Tuas Port" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Changi Hub" })).toBeInTheDocument();
  });

  it("shows Clear all only while a filter is active, and clears", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<SitesFilter onClear={onClear} />);

    expect(screen.queryByRole("button", { name: /clear all/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All sites" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Jurong Depot" }));
    await user.keyboard("{Escape}");

    await user.click(screen.getByRole("button", { name: /clear all/i }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "All sites" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /clear all/i })).not.toBeInTheDocument();
  });
});

describe("DateRangeBar", () => {
  const PRESETS = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
  ];

  function Demo(props: { onApply?: (from: string, to: string) => void; onClear?: () => void }) {
    const [active, setActive] = React.useState("today");
    return (
      <DateRangeBar
        presets={PRESETS}
        active={active}
        onSelect={setActive}
        onCustomApply={props.onApply}
        onClear={props.onClear}
      />
    );
  }

  it("marks the active preset and switches on click", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "This Week" }));
    expect(screen.getByRole("button", { name: "This Week" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Today" })).toHaveAttribute("aria-pressed", "false");
  });

  it("applies a custom range from the labelled From / To fields", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Demo onApply={onApply} />);

    await user.click(screen.getByRole("button", { name: /custom date/i }));
    await user.type(screen.getByLabelText("From"), "2026-11-01");
    await user.type(screen.getByLabelText("To"), "2026-11-15");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(onApply).toHaveBeenCalledWith("2026-11-01", "2026-11-15");
    expect(screen.queryByLabelText("From")).not.toBeInTheDocument();
  });

  it("renders the Clear link only when onClear is given", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Demo />);
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    const onClear = vi.fn();
    rerender(<Demo onClear={onClear} />);
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
