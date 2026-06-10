import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { FilterPanel } from "./FilterPanel";
import { FilterDropdown } from "./FilterDropdown";

const meta: Meta<typeof FilterPanel> = {
  title: "Shared/FilterPanel",
  component: FilterPanel,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof FilterPanel>;

const SEVERITY = [
  { value: "critical", label: "Critical" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
const SITE = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
];

export const Default: Story = {
  render: () => {
    const [sev, setSev] = React.useState<string[]>(["critical"]);
    const [site, setSite] = React.useState<string[]>([]);
    const active = sev.length > 0 || site.length > 0;
    return (
      <div className="w-[44rem]">
        <FilterPanel
          active={active}
          onClear={() => {
            setSev([]);
            setSite([]);
          }}
        >
          <FilterDropdown label="Severity" options={SEVERITY} selected={sev} onChange={setSev} />
          <FilterDropdown label="Site" options={SITE} selected={site} onChange={setSite} />
        </FilterPanel>
      </div>
    );
  },
};
