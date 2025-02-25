"use client";

import type { TimeReport, TimeReportEntry } from "@/types/timeReport";
import { TimeDistributionPieChart } from "./TimeDistributionPieChart";
import { TimeDistributionBarChart } from "./TimeDistributionBarChart";

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
      } else if (entry.timeTypeId) {
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
          console.warn(
            `Time type not found for ID: ${entry.timeTypeId}`,
            entry
          );
          key = "other";
          name = "Other";
          color = "#475569"; // slate-600
        }
      } else {
        console.warn("Entry has no project ID or time type ID:", entry);
        key = "other";
        name = "Other";
        color = "#475569"; // slate-600
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
  const totalHours = totalWorkHours + leaveHours;

  const rolledUpData = [
    {
      name: "CapDev",
      value: capDevHours,
      color: "#0284c7",
      percentage: totalWorkHours > 0 ? (capDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Non-CapDev",
      value: nonCapDevHours,
      color: "#e11d48",
      percentage:
        totalWorkHours > 0 ? (nonCapDevHours / totalWorkHours) * 100 : 0,
    },
    {
      name: "Leave",
      value: leaveHours,
      color: "#ea580c",
      percentage: leaveHours > 0 ? (leaveHours / totalHours) * 100 : 0,
    },
  ];

  const detailedChartData = Array.from(timeTypeHours.entries())
    .map(([, data]) => ({
      name: data.name,
      value: data.hours,
      color: data.color,
      capDevHours: data.capDevHours,
      percentage: (data.hours / totalHours) * 100,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TimeDistributionPieChart data={rolledUpData} total={totalHours} />
      <TimeDistributionBarChart data={detailedChartData} total={totalHours} />
    </div>
  );
}
