"use client";

import {
  TableCell,
  TableRow,
  Table,
  TableHeader,
  TableBody,
} from "@/components/ui/table";
import type { TimeReport } from "@/types/timeReport";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Clock, Briefcase } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface TimeReportExpandedRowProps {
  report: TimeReport;
  timeTypes: Array<{ id: string; name: string }>;
  deviations: Array<{
    timeTypeName: string;
    expectedHours: number;
    actualHours: number;
    deviation: number;
  }>;
}

export function TimeReportExpandedRow({
  report,
  timeTypes,
  deviations,
}: TimeReportExpandedRowProps) {
  return (
    <TooltipProvider>
      <div className="p-4 space-y-6 bg-muted/5">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Time Entries
          </h4>
          <div className="rounded-lg border">
            <Table>
              <TableBody>
                {report.timeEntries.map((entry) => {
                  const timeType = timeTypes.find(
                    (t) => t.id === entry.timeTypeId
                  )?.name;
                  const displayType = entry.isLeave
                    ? `${timeType} (${entry.leaveType})`
                    : entry.isPublicHoliday
                    ? `Public Holiday (${entry.publicHolidayName})`
                    : entry.projectName
                    ? `Project - ${entry.projectName} (${entry.jiraId})`
                    : timeType;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {displayType}
                          </span>
                          <span className="font-medium">
                            {entry.hours.toFixed(1)}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          {entry.isCapDev && (
                            <Badge variant="default" className="text-xs">
                              CapDev
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {deviations.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Time Deviations
            </h4>
            <div className="flex gap-2 flex-wrap">
              {deviations.map((deviation) => (
                <Tooltip key={deviation.timeTypeName}>
                  <TooltipTrigger>
                    <Badge
                      variant={
                        deviation.deviation > 0 ? "default" : "secondary"
                      }
                      className="flex items-center gap-1"
                    >
                      {deviation.timeTypeName}
                      {deviation.deviation > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="ml-1">
                        {deviation.deviation > 0 ? "+" : ""}
                        {deviation.deviation.toFixed(1)}h
                      </span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p>Expected: {deviation.expectedHours.toFixed(1)}h</p>
                      <p>Actual: {deviation.actualHours.toFixed(1)}h</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
