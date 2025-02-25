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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            >
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
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
