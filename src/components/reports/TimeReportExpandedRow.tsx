"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import type { TimeReport, TimeReportEntry } from "@/types/timeReport";

interface TimeReportExpandedRowProps {
  report: TimeReport;
  timeTypes: Array<{ id: string; name: string }>;
  columnsLength: number;
}

export function TimeReportExpandedRow({
  report,
  timeTypes,
  columnsLength,
}: TimeReportExpandedRowProps) {
  return (
    <TableRow key={`${report.id}-expanded`} className="bg-muted/50">
      <TableCell colSpan={columnsLength} className="p-4">
        <div className="rounded-md border">
          <div className="bg-muted px-4 py-2 font-medium border-b">
            <span>Time Entries</span>
          </div>
          <div className="divide-y">
            {report.timeEntries.map((entry: TimeReportEntry, index) => {
              if (entry.isPublicHoliday) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {entry.publicHolidayName}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-100">
                        Public Holiday
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        {entry.hours} hours
                      </span>
                    </div>
                  </div>
                );
              }

              if (entry.isLeave) {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {entry.leaveType}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900 px-2 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-100">
                        Leave
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-orange-600 dark:text-orange-400">
                        {Math.abs(entry.hours / 8)} day(s)
                      </span>
                    </div>
                  </div>
                );
              }

              const timeType = timeTypes.find((t) => t.id === entry.timeTypeId);
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    {entry.jiraId ? (
                      <>
                        <a
                          href={entry.jiraUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
                        >
                          {entry.jiraId}
                        </a>
                        <span className="text-muted-foreground">
                          {entry.projectName}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium">
                        {timeType?.name || "Projects"}
                      </span>
                    )}
                    {entry.isCapDev && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                        CapDev
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {entry.hours.toFixed(1)} hours
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
