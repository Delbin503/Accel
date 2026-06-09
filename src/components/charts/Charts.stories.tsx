import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaChart } from "./AreaChart";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { DonutChart } from "./DonutChart";

const meta: Meta = {
  title: "Charts/Charts",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

const weekly = [
  { day: "Mon", person: 42, vehicle: 18 },
  { day: "Tue", person: 58, vehicle: 22 },
  { day: "Wed", person: 31, vehicle: 12 },
  { day: "Thu", person: 67, vehicle: 28 },
  { day: "Fri", person: 49, vehicle: 19 },
  { day: "Sat", person: 22, vehicle: 9 },
  { day: "Sun", person: 18, vehicle: 6 },
];

const series = [
  { key: "person", label: "Person" },
  { key: "vehicle", label: "Vehicle" },
];

export const Area: Story = {
  render: () => (
    <div className="w-[44rem]">
      <AreaChart data={weekly} xKey="day" series={series} showLegend />
    </div>
  ),
};

export const Bars: Story = {
  render: () => (
    <div className="w-[44rem]">
      <BarChart data={weekly} xKey="day" series={series} showLegend />
    </div>
  ),
};

export const StackedBars: Story = {
  render: () => (
    <div className="w-[44rem]">
      <BarChart data={weekly} xKey="day" series={series} stacked showLegend />
    </div>
  ),
};

export const Lines: Story = {
  render: () => (
    <div className="w-[44rem]">
      <LineChart data={weekly} xKey="day" series={series} showLegend />
    </div>
  ),
};

export const Donut: Story = {
  render: () => (
    <div className="w-80">
      <DonutChart
        data={[
          { name: "Online", value: 11, color: "var(--success)" },
          { name: "Offline", value: 3, color: "var(--sev-critical)" },
        ]}
        centerLabel={
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">14</div>
            <div className="text-2xs uppercase tracking-wider text-muted-foreground">Cameras</div>
          </div>
        }
      />
    </div>
  ),
};
