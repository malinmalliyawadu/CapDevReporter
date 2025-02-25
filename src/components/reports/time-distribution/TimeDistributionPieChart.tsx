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
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <ChartTooltip>
                      <div>{data.name}</div>
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
