import { CartesianGrid, Line, LineChart as ReLineChart, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AXIS_PROPS, toChartConfig, type ChartSeries } from "./palette";
import { cn } from "@/lib/utils";

export interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  showLegend?: boolean;
  className?: string;
}

/** Token-styled multi-series line chart. */
function LineChart({ data, xKey, series, showLegend, className }: LineChartProps) {
  const config = toChartConfig(series);
  return (
    <ChartContainer config={config} className={cn("h-64 w-full", className)}>
      <ReLineChart accessibilityLayer data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={`var(--color-${s.key})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </ReLineChart>
    </ChartContainer>
  );
}

export { LineChart };
