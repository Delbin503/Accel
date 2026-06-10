import type { ChartConfig } from "@/components/ui/chart";

/** A single plotted series. Color defaults to the project chart palette. */
export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

/** Project chart palette — maps to the --chart-1…5 design tokens. */
export const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Build a shadcn ChartConfig from a series list, assigning palette colors. */
export function toChartConfig(series: ChartSeries[]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [
      s.key,
      { label: s.label, color: s.color ?? CHART_PALETTE[i % CHART_PALETTE.length] },
    ])
  );
}

/** Shared cartesian-axis presentation props. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  tick: { fontSize: 11 },
} as const;
