import { Bar, BarChart as ReBarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AXIS_PROPS, toChartConfig, type ChartSeries } from "./palette";
import { cn } from "@/lib/utils";

export interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  stacked?: boolean;
  showLegend?: boolean;
  className?: string;
}

/** Token-styled (optionally stacked) bar chart. */
function BarChart({ data, xKey, series, stacked, showLegend, className }: BarChartProps) {
  const config = toChartConfig(series);
  const last = series.length - 1;
  return (
    <ChartContainer config={config} className={cn("h-64 w-full", className)}>
      <ReBarChart accessibilityLayer data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {showLegend && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId={stacked ? "a" : undefined}
            fill={`var(--color-${s.key})`}
            radius={stacked ? (i === last ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
          />
        ))}
      </ReBarChart>
    </ChartContainer>
  );
}

export { BarChart };
