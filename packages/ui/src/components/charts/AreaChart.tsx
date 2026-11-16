import { Area, AreaChart as ReAreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
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

export interface AreaChartProps extends ChartAxesProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  stacked?: boolean;
  showLegend?: boolean;
  /** Show a dot on every data point. */
  dots?: boolean;
  className?: string;
}

/** Token-styled area chart. Pass series; colors default to the chart palette. */
function AreaChart({ data, xKey, series, stacked, showLegend, dots, className, xAxis, yAxis, referenceLines, valueFormatter }: AreaChartProps) {
  const config = toChartConfig(series);
  return (
    <ChartContainer data-slot="area-chart" config={config} className={cn("h-64 w-full", className)}>
      <ReAreaChart accessibilityLayer data={data} margin={chartMargin(xAxis)}>
        <CartesianGrid vertical={false} />
        <XAxis {...xAxisProps(xKey, xAxis)} />
        <YAxis {...yAxisProps(yAxis)} />
        <ChartTooltip content={<ChartTooltipContent valueFormatter={valueFormatter} />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {referenceLines?.map((line, i) => (
          <ReferenceLine key={`ref-${i}`} {...referenceLineProps(line)} />
        ))}
        {series.map((s, i) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stackId={stacked ? "a" : undefined}
            stroke={seriesColor(series, i)}
            fill={seriesColor(series, i)}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={dots ? { r: 3, strokeWidth: 0, fill: seriesColor(series, i) } : false}
          />
        ))}
      </ReAreaChart>
    </ChartContainer>
  );
}

export { AreaChart };
