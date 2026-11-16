import { Bar, BarChart as ReBarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import {
  chartMargin,
  referenceLineProps,
  seriesColor,
  toChartConfig,
  xAxisProps,
  yAxisProps,
  type ChartAxesProps,
  type ChartSeries,
} from "./palette";
import { cn } from "../../lib/utils";

export interface BarChartProps extends ChartAxesProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  stacked?: boolean;
  showLegend?: boolean;
  className?: string;
}

/** Token-styled (optionally stacked) bar chart. */
function BarChart({ data, xKey, series, stacked, showLegend, className, xAxis, yAxis, referenceLines, valueFormatter }: BarChartProps) {
  const config = toChartConfig(series);
  const last = series.length - 1;
  return (
    <ChartContainer data-slot="bar-chart" config={config} className={cn("h-64 w-full", className)}>
      <ReBarChart accessibilityLayer data={data} margin={chartMargin(xAxis)}>
        <CartesianGrid vertical={false} />
        <XAxis {...xAxisProps(xKey, xAxis)} />
        <YAxis {...yAxisProps(yAxis)} />
        <ChartTooltip content={<ChartTooltipContent valueFormatter={valueFormatter} />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {referenceLines?.map((line, i) => (
          <ReferenceLine key={`ref-${i}`} {...referenceLineProps(line)} />
        ))}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId={stacked ? "a" : undefined}
            fill={seriesColor(series, i)}
            radius={stacked ? (i === last ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
          />
        ))}
      </ReBarChart>
    </ChartContainer>
  );
}

export { BarChart };
