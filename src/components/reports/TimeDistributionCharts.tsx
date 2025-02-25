"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TimeReport, TimeReportEntry } from "@/types/timeReport";

interface TimeDistributionChartsProps {
  timeReport: TimeReport[];
}

// Color palette for the detailed chart
const timeTypeColors = [
  "#2563eb", // blue-600
  "#db2777", // pink-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#be123c", // rose-600
  "#15803d", // green-700
  "#7c3aed", // violet-600
  "#c2410c", // orange-700
  "#0369a1", // sky-700
  "#6d28d9", // purple-700
  "#be185d", // pink-700
  "#1d4ed8", // blue-700
];

export function TimeDistributionCharts({
  timeReport,
}: TimeDistributionChartsProps) {
  // Calculate detailed time type data including leave
  const timeTypeHours = new Map<
    string,
    { hours: number; isCapDev: boolean; name: string; isLeave?: boolean }
  >();

  timeReport.forEach((report) => {
    report.timeEntries.forEach((entry: TimeReportEntry) => {
      const key = entry.isLeave
        ? "leave"
        : entry.isCapDev
        ? "capdev"
        : "non-capdev";
      const existingEntry = timeTypeHours.get(key);

      if (!existingEntry) {
        // Create new entry
        timeTypeHours.set(key, {
          hours: Math.abs(entry.hours),
          isCapDev: entry.isCapDev,
          name: entry.isLeave
            ? "Leave"
            : entry.isCapDev
            ? "CapDev"
            : "Non-CapDev",
          isLeave: entry.isLeave,
        });
      } else {
        // Update existing entry
        existingEntry.hours += Math.abs(entry.hours);
        timeTypeHours.set(key, existingEntry);
      }
    });
  });

  // Calculate rolled up CapDev data (excluding leave)
  const totalCapDevHours = timeTypeHours.get("capdev")?.hours || 0;
  const totalNonCapDevHours = timeTypeHours.get("non-capdev")?.hours || 0;
  const totalLeaveHours = timeTypeHours.get("leave")?.hours || 0;

  // Calculate total work hours (excluding leave)
  const totalWorkHours = totalCapDevHours + totalNonCapDevHours;

  const rolledUpData = [
    {
      name: "CapDev",
      value: totalCapDevHours,
      color: "#0ea5e9",
      percentage:
        totalWorkHours > 0 ? (totalCapDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Non-CapDev",
      value: totalNonCapDevHours,
      color: "#f43f5e",
      percentage:
        totalWorkHours > 0 ? (totalNonCapDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Leave",
      value: totalLeaveHours,
      color: "#f97316",
      percentage:
        totalLeaveHours > 0
          ? (totalLeaveHours / (totalWorkHours + totalLeaveHours)) * 100
          : 0,
    },
  ];

  const detailedChartData = Array.from(timeTypeHours.entries()).map(
    ([, data], index) => ({
      name: data.name,
      value: data.hours,
      color: data.isLeave
        ? "#f97316"
        : timeTypeColors[index % timeTypeColors.length],
      isCapDev: data.isCapDev,
      isLeave: data.isLeave,
    })
  );

  const totalDetailedTime = detailedChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Rolled Up Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rolledUpData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {rolledUpData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const item = rolledUpData.find((d) => d.name === name);
                    return [
                      `${value.toFixed(1)} hours (${item?.percentage.toFixed(
                        1
                      )}%)`,
                    ];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {rolledUpData.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {item.percentage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({item.value.toFixed(1)} hours)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Detailed Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={detailedChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {detailedChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    `${value.toFixed(1)} hours (${(
                      (value / totalDetailedTime) *
                      100
                    ).toFixed(1)}%)`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {detailedChartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium flex items-center gap-2">
                    {item.name}
                    {item.isCapDev && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                        CapDev
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {((item.value / totalDetailedTime) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({item.value.toFixed(1)} hours)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
