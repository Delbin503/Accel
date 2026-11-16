import type { Meta, StoryObj } from "@storybook/react-vite";
import { AreaChart } from "./AreaChart";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { DonutChart } from "./DonutChart";

const meta: Meta = {
  title: "Charts/Charts",
  tags: ["autodocs"],
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
          { name: "Offline", value: 3, color: "var(--severity-critical)" },
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

export const StackedArea: Story = {
  render: () => (
    <div className="w-[44rem]">
      <AreaChart data={weekly} xKey="day" series={series} stacked showLegend />
    </div>
  ),
};

/** Single series, no legend (the default). */
export const SingleSeriesLine: Story = {
  render: () => (
    <div className="w-[44rem]">
      <LineChart data={weekly} xKey="day" series={[{ key: "person", label: "Person" }]} />
    </div>
  ),
};

/** Donut without explicit colours or a centre label — falls back to the chart palette. */
export const DonutPalette: Story = {
  render: () => (
    <div className="w-80">
      <DonutChart
        data={[
          { name: "Person", value: 286 },
          { name: "Vehicle", value: 114 },
          { name: "Forklift", value: 52 },
          { name: "PPE violation", value: 23 },
        ]}
      />
    </div>
  ),
};

/** Severity breakdown using the severity tokens. */
export const DonutSeverity: Story = {
  render: () => (
    <div className="w-80">
      <DonutChart
        data={[
          { name: "Critical", value: 3, color: "var(--severity-critical)" },
          { name: "High", value: 9, color: "var(--severity-high)" },
          { name: "Medium", value: 21, color: "var(--severity-medium)" },
          { name: "Low", value: 40, color: "var(--severity-low)" },
        ]}
        centerLabel={
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">73</div>
            <div className="text-2xs uppercase tracking-wider text-muted-foreground">Detections</div>
          </div>
        }
      />
    </div>
  ),
};

/**
 * No data — the wrappers draw empty axes; they have no built-in empty state,
 * so callers render `EmptyState` instead when `data` is empty.
 */
export const EmptyData: Story = {
  render: () => (
    <div className="w-[44rem]">
      <BarChart data={[]} xKey="day" series={series} />
    </div>
  ),
};

const sites = [
  { site: "Changi Logistics Hub", "Uptime %": 99.2 },
  { site: "Jurong West Depot", "Uptime %": 96.4 },
  { site: "Tuas Mega Port", "Uptime %": 92.1 },
  { site: "Woodlands Checkpoint", "Uptime %": 98.7 },
  { site: "Marina Bay Office", "Uptime %": 99.8 },
  { site: "Punggol Warehouse", "Uptime %": 94.5 },
];

/** Y axis, angled labels, a target line, % values and a series key with spaces. */
export const BarsWithAxes: Story = {
  render: () => (
    <div className="w-[44rem]">
      <BarChart
        data={sites}
        xKey="site"
        series={[{ key: "Uptime %", label: "Uptime" }]}
        xAxis={{ angle: -30, interval: 0, tickFormatter: (v) => (v.length > 14 ? `${v.slice(0, 13)}…` : v) }}
        yAxis={{ show: true, domain: [80, 100], ticks: [80, 85, 90, 95, 100], tickFormatter: (v) => `${v}%` }}
        referenceLines={[{ y: 95, label: "Target 95%", color: "var(--warning)" }]}
        valueFormatter={(v) => `${v}%`}
        className="h-72"
      />
    </div>
  ),
};

export const LineWithDots: Story = {
  render: () => (
    <div className="w-[44rem]">
      <LineChart
        data={weekly}
        xKey="day"
        series={series}
        dots
        showLegend
        yAxis={{ show: true }}
        referenceLines={[{ y: 40, label: "Avg" }]}
        valueFormatter={(v) => `${v} events`}
      />
    </div>
  ),
};
