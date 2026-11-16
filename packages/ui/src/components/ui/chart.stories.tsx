import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./chart";

const meta: Meta = {
  title: "UI/Chart",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

const data = [
  { day: "Mon", detections: 42 },
  { day: "Tue", detections: 58 },
  { day: "Wed", detections: 31 },
  { day: "Thu", detections: 67 },
  { day: "Fri", detections: 49 },
  { day: "Sat", detections: 22 },
  { day: "Sun", detections: 18 },
];

const config = {
  detections: { label: "Detections", color: "var(--chart-1)" },
} satisfies ChartConfig;

export const Bars: Story = {
  render: () => (
    <ChartContainer config={config} className="h-[260px] w-[40rem]">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="detections" fill="var(--color-detections)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
