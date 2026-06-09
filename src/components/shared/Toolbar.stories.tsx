import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Toolbar, ToolbarSearch } from "./Toolbar";
import { FilterDropdown } from "./FilterDropdown";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const meta: Meta<typeof Toolbar> = {
  title: "Shared/Toolbar",
  component: Toolbar,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

const STATUS = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

export const Default: Story = {
  render: () => {
    const [search, setSearch] = React.useState("");
    const [status, setStatus] = React.useState<string[]>([]);
    return (
      <Toolbar className="w-[48rem]">
        <ToolbarSearch value={search} onChange={setSearch} placeholder="Search cameras…" />
        <div className="w-40">
          <FilterDropdown label="Status" options={STATUS} selected={status} onChange={setStatus} />
        </div>
        <Button size="sm" className="ml-auto">
          <Plus /> Add camera
        </Button>
      </Toolbar>
    );
  },
};
