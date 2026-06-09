import * as React from "react";
import { Cell, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CHART_PALETTE } from "./palette";
import { cn } from "@/lib/utils";

export interface DonutDatum {
  name: string;
  value: number;
  /** Optional explicit slice color (falls back to the chart palette). */
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  /** Optional node rendered in the donut hole (e.g. a total). */
  centerLabel?: React.ReactNode;
  className?: string;
}

/** Token-styled donut/pie chart with an optional center label. */
function DonutChart({ data, centerLabel, className }: DonutChartProps) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.name, { label: d.name, color: d.color ?? CHART_PALETTE[i % CHART_PALETTE.length] }])
  );
  return (
    <div className={cn("relative", className)}>
      <ChartContainer config={config} className="mx-auto aspect-square h-56">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={2}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {centerLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {centerLabel}
        </div>
      )}
    </div>
  );
}

export { DonutChart };
