"use client";

import {
  TableCell,
  TableRow,
  Table,
  TableBody,
  TableHeader,
  TableHead,
} from "@/components/ui/table";
import type { TimeReport } from "@/types/timeReport";
import { Badge } from "@/components/ui/badge";
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Briefcase,
  Calendar,
  Plane,
  Wrench,
  Code,
  ExternalLink,
} from "lucide-react";
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
  const getEntryIcon = (entry: TimeReport["timeEntries"][0]) => {
    if (entry.isPublicHoliday)
      return <Calendar className="h-4 w-4 text-blue-500" />;
    if (entry.isLeave) return <Plane className="h-4 w-4 text-amber-500" />;
    if (entry.projectName)
      return <Briefcase className="h-4 w-4 text-violet-500" />;
    if (entry.isCapDev) return <Code className="h-4 w-4 text-green-500" />;
    return <Wrench className="h-4 w-4 text-slate-500" />;
  };

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
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>JIRA</TableHead>
                  <TableHead>Activity Date</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead className="text-right">Tags</TableHead>
                </TableRow>
              </TableHeader>
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
                    ? `Project - ${entry.projectName}`
                    : timeType;

                  return (
                    <TableRow key={entry.id} className="hover:bg-muted/50">
                      <TableCell className="py-3">
                        {getEntryIcon(entry)}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm">
                          {entry.isLeave ? (
                            `${timeType} (${entry.leaveType})`
                          ) : entry.isPublicHoliday ? (
                            `Public Holiday (${entry.publicHolidayName})`
                          ) : entry.projectName && entry.jiraId ? (
                            <a
                              href={`/data/projects?search=jira%3A${entry.jiraId}`}
                              className="hover:text-primary"
                            >
                              Project - {entry.projectName}
                            </a>
                          ) : (
                            displayType
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-muted-foreground">
                          {entry.teamName ||
                            (entry.projectName ? "Unknown Team" : "-")}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        {entry.jiraId && (
                          <a
                            href={entry.jiraUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                          >
                            {entry.jiraId}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-sm text-muted-foreground">
                          {entry.activityDate}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <span className="font-medium text-muted-foreground">
                          {entry.hours.toFixed(1)}h
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {entry.isCapDev && (
                          <Badge variant="default" className="text-xs">
                            CapDev
                          </Badge>
                        )}
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
