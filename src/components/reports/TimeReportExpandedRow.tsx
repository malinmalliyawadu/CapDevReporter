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
  Clock,
  Briefcase,
  Calendar,
  Plane,
  Wrench,
  Code,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useSyncDialog } from "@/contexts/dialog-context";
import { format, endOfWeek } from "date-fns";

interface TimeReportExpandedRowProps {
  report: TimeReport;
  timeTypes: Array<{ id: string; name: string }>;
}

export function TimeReportExpandedRow({
  report,
  timeTypes,
}: TimeReportExpandedRowProps) {
  const { openFromEvent: openSyncDialogFromEvent } = useSyncDialog();

  const handleSync = (jiraId: string) => {
    const handler = openSyncDialogFromEvent({
      defaultIssueKey: jiraId,
    });
    return handler;
  };

  const getEntryIcon = (entry: TimeReport["timeEntries"][0]) => {
    if (entry.isPublicHoliday)
      return <Calendar className="h-4 w-4 text-blue-500" />;
    if (entry.isLeave) return <Plane className="h-4 w-4 text-amber-500" />;
    if (entry.projectName)
      return <Briefcase className="h-4 w-4 text-violet-500" />;
    if (entry.isCapDev) return <Code className="h-4 w-4 text-green-500" />;
    if (entry.isRolledUp) return <Clock className="h-4 w-4 text-orange-500" />;
    return <Wrench className="h-4 w-4 text-slate-500" />;
  };

  const formatActivityDate = (dateString?: string, isRolledUp?: boolean) => {
    if (!dateString) return "-";
    try {
      // Parse the date string in the format "yyyy-MM-dd"
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date

      // For rolled-up entries, show that it applies to the whole week
      if (isRolledUp) {
        const weekStart = format(date, "MMM dd");
        const weekEnd = format(
          endOfWeek(date, { weekStartsOn: 1 }),
          "MMM dd, yyyy"
        );
        return `Week of ${weekStart} - ${weekEnd}`;
      }

      return format(date, "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
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
                  <TableHead className="w-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.timeEntries.map((entry) => {
                  const timeType = timeTypes.find(
                    (t) => t.id === entry.timeTypeId
                  )?.name;
                  const displayType = entry.isLeave
                    ? timeType
                      ? `${timeType} (${entry.leaveType})`
                      : entry.leaveType
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
                            timeType ? (
                              `${timeType} (${entry.leaveType})`
                            ) : (
                              entry.leaveType
                            )
                          ) : entry.isPublicHoliday ? (
                            `Public Holiday (${entry.publicHolidayName})`
                          ) : entry.projectName && entry.jiraId ? (
                            <a
                              href={`/data/projects?search=jira%3A${entry.jiraId}`}
                              className="hover:text-primary"
                            >
                              Project - {entry.projectName}
                            </a>
                          ) : entry.isRolledUp ? (
                            `${displayType} (Weekly)`
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
                          {formatActivityDate(
                            entry.activityDate,
                            entry.isRolledUp
                          )}
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
                      <TableCell className="py-3 text-right">
                        {entry.jiraId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleSync(entry.jiraId)}
                            title="Sync this project"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
