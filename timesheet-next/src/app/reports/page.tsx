"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import type { TimeEntry } from "@/types";

interface ProjectSummary {
  name: string;
  hours: number;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { data: timeEntries, isLoading } = trpc.timeEntry.getAll.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const totalHours =
    timeEntries?.reduce(
      (acc: number, entry: TimeEntry) => acc + entry.hours,
      0
    ) || 0;

  const projectHours: Record<string, ProjectSummary> =
    timeEntries?.reduce(
      (acc: Record<string, ProjectSummary>, entry: TimeEntry) => {
        const projectId = entry.project.id;
        if (!acc[projectId]) {
          acc[projectId] = {
            name: entry.project.name,
            hours: 0,
          };
        }
        acc[projectId].hours += entry.hours;
        return acc;
      },
      {}
    ) || {};

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Summary</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Total Hours</p>
              <p className="text-3xl font-bold">{totalHours}</p>
            </div>
            <div>
              <p className="text-gray-600">Projects</p>
              <div className="space-y-2 mt-2">
                {Object.entries(projectHours).map(([id, project]) => (
                  <div key={id} className="flex justify-between items-center">
                    <span className="text-sm">{project.name}</span>
                    <span className="font-medium">{project.hours} hours</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Entries</h2>
          <div className="space-y-4">
            {timeEntries?.slice(0, 5).map((entry: TimeEntry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{entry.project.name}</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(entry.date), "PPP")}
                  </p>
                </div>
                <p className="font-medium">{entry.hours} hours</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
