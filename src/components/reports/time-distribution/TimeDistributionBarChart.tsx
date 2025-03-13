import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";

interface TimeDistributionBarChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    percentage: number;
    capDevHours: number;
  }>;
  total: number;
}

export function TimeDistributionBarChart({
  data,
  total,
}: TimeDistributionBarChartProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle>Detailed Time Distribution</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            key={`bar-chart-${data.length}`}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                {data.map((entry, index) => {
                  const color = entry.color;
                  // Convert hex to RGB for lighter variant
                  const r = parseInt(color.slice(1, 3), 16);
                  const g = parseInt(color.slice(3, 5), 16);
                  const b = parseInt(color.slice(5, 7), 16);
                  const lighterColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
                  return (
                    <linearGradient
                      key={`gradient-${index}`}
                      id={`gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor={color} />
                      <stop offset="100%" stopColor={lighterColor} />
                    </linearGradient>
                  );
                })}
              </defs>
              <XAxis
                type="number"
                unit="h"
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={0}
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <Tooltip
                isAnimationActive={false}
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <ChartTooltip>
                      <div className="font-bold text-slate-300">
                        {data.name}
                      </div>
                      <div>{`${data.value.toFixed(
                        1
                      )} hours (${data.percentage.toFixed(1)}%)`}</div>
                    </ChartTooltip>
                  );
                }}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                cursor="pointer"
                onMouseEnter={(data, index) => {
                  const cell = document.querySelector(
                    `[data-cell-index="${index}"]`
                  ) as HTMLElement;
                  if (cell) {
                    cell.style.opacity = "0.85";
                    cell.style.transition = "opacity 0.2s ease";
                  }
                }}
                onMouseLeave={(data, index) => {
                  const cell = document.querySelector(
                    `[data-cell-index="${index}"]`
                  ) as HTMLElement;
                  if (cell) {
                    cell.style.opacity = "1";
                  }
                }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                    data-cell-index={index}
                    style={{ transition: "opacity 0.2s ease" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartLegend items={data} total={total} />
      </CardContent>
    </Card>
  );
}
