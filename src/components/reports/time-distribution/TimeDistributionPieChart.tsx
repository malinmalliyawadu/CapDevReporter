import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { ChartLegend } from "./ChartLegend";

interface TimeDistributionPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  total: number;
}

export function TimeDistributionPieChart({
  data,
  total,
}: TimeDistributionPieChartProps) {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-2">
        <CardTitle>Rolled Up Time Distribution</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            key={`pie-chart-${data.length}`}
          >
            <PieChart>
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
                      id={`pie-gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} />
                      <stop offset="100%" stopColor={lighterColor} />
                    </linearGradient>
                  );
                })}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#pie-gradient-${index})`}
                    style={{
                      filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                    }}
                  />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ChartLegend items={data} total={total} />
      </CardContent>
    </Card>
  );
}
