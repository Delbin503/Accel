import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { DateRangeBar, type DateRangePreset } from "./DateRangeBar";

const meta: Meta<typeof DateRangeBar> = {
  title: "Shared/DateRangeBar",
  component: DateRangeBar,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DateRangeBar>;

const PRESETS: DateRangePreset[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

/** Presets plus the Custom Date popover and a "Showing" indicator. */
export const Default: Story = {
  render: function DefaultStory() {
    const [active, setActive] = React.useState("today");
    const [range, setRange] = React.useState({ from: "2026-11-01", to: "2026-11-14" });
    const label = active === "custom" ? `${range.from} → ${range.to}` : PRESETS.find((p) => p.key === active)?.label;
    return (
      <DateRangeBar
        presets={PRESETS}
        active={active}
        onSelect={setActive}
        customFrom={range.from}
        customTo={range.to}
        onCustomApply={(from, to) => setRange({ from, to })}
        onCustomReset={() => setActive("today")}
        showingLabel={<>Showing {label} · 42 detections</>}
      />
    );
  },
};

/** Custom range already applied — the Custom Date pill is active. */
export const CustomActive: Story = {
  args: {
    presets: PRESETS,
    active: "custom",
    customFrom: "2026-11-03",
    customTo: "2026-11-09",
    onSelect: () => {},
    showingLabel: "Showing 3 Nov – 9 Nov · 118 detections",
  },
};

/** Presets only — no custom popover, custom leading label. */
export const PresetsOnly: Story = {
  args: {
    presets: PRESETS,
    active: "week",
    onSelect: () => {},
    showCustom: false,
    label: "Recorded",
  },
};
