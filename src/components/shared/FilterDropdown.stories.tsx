import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { FilterDropdown } from "./FilterDropdown";

const meta: Meta<typeof FilterDropdown> = {
  title: "Shared/FilterDropdown",
  component: FilterDropdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FilterDropdown>;

const SEVERITY = [
  { value: "critical", label: "Critical", color: "hsl(0 84% 60%)" },
  { value: "medium", label: "Medium", color: "hsl(40 96% 50%)" },
  { value: "low", label: "Low", color: "hsl(214 87% 60%)" },
];

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>([]);
    return (
      <div className="w-56">
        <FilterDropdown
          label="Severity"
          options={SEVERITY}
          selected={selected}
          onChange={setSelected}
        />
      </div>
    );
  },
};

export const Preselected: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<string[]>(["critical", "medium"]);
    return (
      <div className="w-56">
        <FilterDropdown
          label="Severity"
          options={SEVERITY}
          selected={selected}
          onChange={setSelected}
        />
      </div>
    );
  },
};
