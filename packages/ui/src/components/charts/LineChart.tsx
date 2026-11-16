import { CartesianGrid, Line, LineChart as ReLineChart, ReferenceLine, XAxis, YAxis } from "recharts";
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

export interface LineChartProps extends ChartAxesProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  showLegend?: boolean;
  /** Show a dot on every data point. */
  dots?: boolean;
  className?: string;
}

/** Token-styled multi-series line chart. */
function LineChart({ data, xKey, series, showLegend, dots, className, xAxis, yAxis, referenceLines, valueFormatter }: LineChartProps) {
  const config = toChartConfig(series);
  return (
    <ChartContainer data-slot="line-chart" config={config} className={cn("h-64 w-full", className)}>
      <ReLineChart accessibilityLayer data={data} margin={chartMargin(xAxis)}>
        <CartesianGrid vertical={false} />
        <XAxis {...xAxisProps(xKey, xAxis)} />
        <YAxis {...yAxisProps(yAxis)} />
        <ChartTooltip content={<ChartTooltipContent valueFormatter={valueFormatter} />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {referenceLines?.map((line, i) => (
          <ReferenceLine key={`ref-${i}`} {...referenceLineProps(line)} />
        ))}
        {series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={seriesColor(series, i)}
            strokeWidth={2}
            dot={dots ? { r: 3, strokeWidth: 0, fill: seriesColor(series, i) } : false}
            activeDot={{ r: 4 }}
          />
        ))}
      </ReLineChart>
    </ChartContainer>
  );
}

export { LineChart };
