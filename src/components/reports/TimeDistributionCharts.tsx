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
          color = "#9333ea"; // purple-600
        } else if (entry.leaveType?.toLowerCase().includes("annual")) {
          key = "annual-leave";
          name = "Annual Leave";
          color = "#16a34a"; // green-600
        } else {
          key = "other-leave";
          name = "Other Leave";
          color = "#ea580c"; // orange-600
        }
      } else if (entry.projectId) {
        key = "projects";
        name = "Projects";
        color = "#2563eb"; // blue-600
      } else {
        // Check if this is a general time entry by looking up the time type
        const timeType = timeTypes.find((tt) => tt.id === entry.timeTypeId);
        if (timeType) {
          key = `general-${timeType.id}`;
          name = timeType.name;
          color = "#db2777"; // pink-600
        } else {
          key = "other";
          name = "Other";
          color = "#94a3b8"; // slate-400
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
      color: "#0ea5e9", // sky-500
      percentage: totalWorkHours > 0 ? (capDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Non-CapDev",
      value: nonCapDevHours,
      color: "#f43f5e", // rose-500
      percentage:
        totalWorkHours > 0 ? (nonCapDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Leave",
      value: leaveHours,
      color: "#f97316", // orange-500
      percentage:
        leaveHours > 0 ? (leaveHours / (totalWorkHours + leaveHours)) * 100 : 0,
    },
  ];

  const detailedChartData = Array.from(timeTypeHours.entries())
    .map(([, data]) => ({
      name: data.name,
      value: data.hours,
      color: data.color,
      percentage: (data.hours / (totalWorkHours + leaveHours)) * 100,
    }))
    .sort((a, b) => b.value - a.value); // Sort by value in descending order

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
                      (value / (totalWorkHours + leaveHours)) *
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
                  <span className="text-sm font-medium">{item.name}</span>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
