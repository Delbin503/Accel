import type { ChartConfig } from "../ui/chart";

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

/** Y axis options. The axis is hidden unless `show` is true. */
export interface ChartYAxisOptions {
  show?: boolean;
  /** e.g. [0, 100] or [0, "auto"]. */
  domain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"];
  ticks?: number[];
  width?: number;
  tickFormatter?: (value: number) => string;
}

/** X axis options for dense category labels. */
export interface ChartXAxisOptions {
  /** Rotate tick labels, e.g. -35 for long site names. */
  angle?: number;
  /** 0 = show every label; "preserveStartEnd" = thin them out. */
  interval?: number | "preserveStart" | "preserveEnd" | "preserveStartEnd";
  /** Axis height in px; angled labels default to 56. */
  height?: number;
  tickFormatter?: (value: string) => string;
}

/** A horizontal (y) or vertical (x) marker line — target, threshold, average. */
export interface ChartReferenceLine {
  y?: number;
  x?: string | number;
  label?: string;
  /** Any CSS colour token, e.g. "var(--warning)". Defaults to muted foreground. */
  color?: string;
  /** Dashed by default. */
  dashed?: boolean;
}

/** Shared props for the charts' optional axes and value formatting. */
export interface ChartAxesProps {
  yAxis?: ChartYAxisOptions;
  xAxis?: ChartXAxisOptions;
  referenceLines?: ChartReferenceLine[];
  /** Formats values in the tooltip (units, %, currency). */
  valueFormatter?: (value: number, seriesKey: string) => string;
}

/** Resolved colour for a series — used directly so keys with spaces still work. */
export function seriesColor(series: ChartSeries[], index: number): string {
  return series[index].color ?? CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Chart margin — angled X labels need room on the left, where the first label hangs. */
export function chartMargin(xAxis?: ChartXAxisOptions) {
  const angled = xAxis?.angle !== undefined && xAxis.angle !== 0;
  return { left: angled ? 32 : 4, right: 8, top: 8 };
}

/** Recharts XAxis props from ChartXAxisOptions. */
export function xAxisProps(xKey: string, opts?: ChartXAxisOptions) {
  const angled = opts?.angle !== undefined && opts.angle !== 0;
  return {
    dataKey: xKey,
    ...AXIS_PROPS,
    interval: opts?.interval ?? ("preserveEnd" as const),
    angle: opts?.angle,
    textAnchor: angled ? ("end" as const) : ("middle" as const),
    height: opts?.height ?? (angled ? 56 : undefined),
    tickFormatter: opts?.tickFormatter,
  };
}

/** Recharts YAxis props from ChartYAxisOptions. */
export function yAxisProps(opts?: ChartYAxisOptions) {
  return {
    ...AXIS_PROPS,
    hide: !opts?.show,
    domain: opts?.domain,
    // An explicit domain clips marks outside it (bars on a 80–100% axis).
    allowDataOverflow: opts?.domain !== undefined,
    ticks: opts?.ticks,
    width: opts?.width ?? 40,
    tickFormatter: opts?.tickFormatter,
  };
}

/** Recharts ReferenceLine props from a ChartReferenceLine. */
export function referenceLineProps(line: ChartReferenceLine) {
  const color = line.color ?? "var(--muted-foreground)";
  return {
    y: line.y,
    x: line.x,
    stroke: color,
    strokeDasharray: line.dashed === false ? undefined : "4 4",
    label: line.label
      ? { value: line.label, position: "insideTopRight" as const, fill: color, fontSize: 11 }
      : undefined,
  };
}
