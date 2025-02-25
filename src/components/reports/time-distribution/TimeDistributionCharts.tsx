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
        color = "#06b6d4"; // cyan-500 (brighter)
      } else if (entry.isLeave) {
        if (entry.leaveType?.toLowerCase().includes("sick")) {
          key = "sick-leave";
          name = "Sick Leave";
          color = "#a855f7"; // purple-500 (brighter)
        } else if (entry.leaveType?.toLowerCase().includes("annual")) {
          key = "annual-leave";
          name = "Annual Leave";
          color = "#22c55e"; // green-500 (brighter)
        } else {
          key = "other-leave";
          name = "Other Leave";
          color = "#f97316"; // orange-500 (brighter)
        }
      } else if (entry.projectId) {
        key = entry.isCapDev ? "capdev-projects" : "non-capdev-projects";
        name = entry.isCapDev ? "CapDev Projects" : "Non-CapDev Projects";
        color = entry.isCapDev ? "#2563eb" : "#4f46e5"; // blue-600 and indigo-600 (more vibrant)
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
            "#ec4899", // pink-500
            "#14b8a6", // teal-500
            "#8b5cf6", // violet-500
            "#f43f5e", // rose-500
            "#10b981", // emerald-500
            "#6366f1", // indigo-500
            "#0ea5e9", // sky-500
            "#84cc16", // lime-500
            "#d946ef", // fuchsia-500
            "#f59e0b", // amber-500
            "#ef4444", // red-500
            "#0d9488", // teal-600
            "#7c3aed", // violet-600
            "#e11d48", // rose-600
          ];
          color = generalTimeColors[colorIndex % generalTimeColors.length];
        } else {
          console.warn(
            `Time type not found for ID: ${entry.timeTypeId}`,
            entry
          );
          key = "other";
          name = "Other";
          color = "#64748b"; // slate-500 (brighter)
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
    <div className="grid gap-4 md:grid-cols-2 mb-4">
      <TimeDistributionPieChart data={rolledUpData} total={totalHours} />
      <TimeDistributionBarChart data={detailedChartData} total={totalHours} />
    </div>
  );
}
