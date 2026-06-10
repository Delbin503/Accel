import { Area, AreaChart as ReAreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AXIS_PROPS, toChartConfig, type ChartSeries } from "./palette";
import { cn } from "@/lib/utils";

export interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  stacked?: boolean;
  showLegend?: boolean;
  className?: string;
}

/** Token-styled area chart. Pass series; colors default to the chart palette. */
function AreaChart({ data, xKey, series, stacked, showLegend, className }: AreaChartProps) {
  const config = toChartConfig(series);
  return (
    <ChartContainer config={config} className={cn("h-64 w-full", className)}>
      <ReAreaChart accessibilityLayer data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s) => (
          <Area
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stackId={stacked ? "a" : undefined}
            stroke={`var(--color-${s.key})`}
            fill={`var(--color-${s.key})`}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        ))}
      </ReAreaChart>
    </ChartContainer>
  );
}

export { AreaChart };
