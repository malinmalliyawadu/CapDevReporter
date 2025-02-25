"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeReport, TimeReportEntry } from "@/types/timeReport";
import { Badge } from "@/components/ui/badge";

interface TimeDistributionChartsProps {
  timeReport: TimeReport[];
  timeTypes: Array<{ id: string; name: string }>;
}

export function TimeDistributionCharts({
  timeReport,
  timeTypes,
}: TimeDistributionChartsProps) {
  // Calculate detailed time type data including leave
  const timeTypeHours = new Map<
    string,
    { hours: number; capDevHours: number; name: string; color: string }
  >();

  timeReport.forEach((report) => {
    report.timeEntries.forEach((entry: TimeReportEntry) => {
      let key: string;
      let name: string;
      let color: string;

      if (entry.isPublicHoliday) {
        key = "public-holiday";
        name = "Public Holidays";
        color = "#0891b2"; // cyan-600
      } else if (entry.isLeave) {
        if (entry.leaveType?.toLowerCase().includes("sick")) {
          key = "sick-leave";
          name = "Sick Leave";
          color = "#7e22ce"; // purple-700
        } else if (entry.leaveType?.toLowerCase().includes("annual")) {
          key = "annual-leave";
          name = "Annual Leave";
          color = "#15803d"; // green-700
        } else {
          key = "other-leave";
          name = "Other Leave";
          color = "#c2410c"; // orange-700
        }
      } else if (entry.projectId) {
        key = entry.isCapDev ? "capdev-projects" : "non-capdev-projects";
        name = entry.isCapDev ? "CapDev Projects" : "Non-CapDev Projects";
        color = entry.isCapDev ? "#1d4ed8" : "#4338ca"; // blue-700 for CapDev, indigo-700 for Non-CapDev
      } else {
        // Check if this is a general time entry by looking up the time type
        const timeType = timeTypes.find((tt) => tt.id === entry.timeTypeId);
        if (timeType) {
          key = `general-${timeType.id}`;
          name = timeType.name;
          // Assign different colors to different general time types
          const colorIndex = Array.from(timeTypeHours.keys()).filter((k) =>
            k.startsWith("general-")
          ).length;
          const generalTimeColors = [
            "#be185d", // pink-700
            "#0f766e", // teal-700
            "#6d28d9", // violet-700
            "#be123c", // rose-700
            "#047857", // emerald-700
            "#4338ca", // indigo-700
            "#0369a1", // sky-700
            "#3f6212", // lime-800
            "#a21caf", // fuchsia-700
            "#b45309", // amber-700
            "#b91c1c", // red-700
            "#115e59", // teal-800
            "#5b21b6", // purple-800
            "#9f1239", // rose-800
          ];
          color = generalTimeColors[colorIndex % generalTimeColors.length];
        } else {
          key = "other";
          name = "Other";
          color = "#475569"; // slate-600
        }
      }

      const existingEntry = timeTypeHours.get(key);
      const hours = Math.abs(entry.hours);
      if (!existingEntry) {
        timeTypeHours.set(key, {
          hours,
          capDevHours: entry.isCapDev ? hours : 0,
          name,
          color,
        });
      } else {
        existingEntry.hours += hours;
        if (entry.isCapDev) {
          existingEntry.capDevHours += hours;
        }
        timeTypeHours.set(key, existingEntry);
      }
    });
  });

  // Calculate rolled up data
  const capDevHours = Array.from(timeTypeHours.values()).reduce(
    (sum, data) => sum + data.capDevHours,
    0
  );

  const nonCapDevHours = Array.from(timeTypeHours.values())
    .filter(
      (data) =>
        !data.name.includes("Leave") && // Not Leave
        data.name !== "Public Holidays" // Not Public Holidays
    )
    .reduce((sum, data) => sum + data.hours - data.capDevHours, 0);

  const leaveHours = Array.from(timeTypeHours.values())
    .filter(
      (data) => data.name.includes("Leave") || data.name === "Public Holidays"
    )
    .reduce((sum, data) => sum + data.hours, 0);

  const totalWorkHours = capDevHours + nonCapDevHours;

  const rolledUpData = [
    {
      name: "CapDev",
      value: capDevHours,
      color: "#0284c7", // sky-600
      percentage: totalWorkHours > 0 ? (capDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Non-CapDev",
      value: nonCapDevHours,
      color: "#e11d48", // rose-600
      percentage:
        totalWorkHours > 0 ? (nonCapDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Leave",
      value: leaveHours,
      color: "#ea580c", // orange-600
      percentage:
        leaveHours > 0 ? (leaveHours / (totalWorkHours + leaveHours)) * 100 : 0,
    },
  ];

  const detailedChartData = Array.from(timeTypeHours.entries())
    .map(([, data]) => ({
      name: data.name,
      value: data.hours,
      color: data.color,
      capDevHours: data.capDevHours,
      percentage: (data.hours / (totalWorkHours + leaveHours)) * 100,
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Rolled Up Time Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                  formatter={(value: number, name: string) => {
                    const item = rolledUpData.find((d) => d.name === name);
                    return [
                      `${value.toFixed(1)} hours (${item?.percentage.toFixed(
                        1
                      )}%)`,
                    ];
                  }}
                />
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
            <div className="flex justify-between items-center border-t pt-2 mt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-semibold">
                {(totalWorkHours + leaveHours).toFixed(1)} hours
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-2">
          <CardTitle>Detailed Time Distribution</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={detailedChartData}
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
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 12px",
                  }}
                  itemStyle={{ color: "#ffffff" }}
                  labelStyle={{ color: "#ffffff" }}
                  formatter={(value: number) =>
                    `${value.toFixed(1)} hours (${(
                      (value / (totalWorkHours + leaveHours)) *
                      100
                    ).toFixed(1)}%)`
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {detailedChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
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
                    {item.capDevHours > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-sky-100 text-sky-700 hover:bg-sky-100"
                      >
                        CapDev
                      </Badge>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {(
                      (item.value / (totalWorkHours + leaveHours)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({item.value.toFixed(1)} hours)
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center border-t pt-2 mt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-semibold">
                {(totalWorkHours + leaveHours).toFixed(1)} hours
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
