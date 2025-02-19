"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingDown, TrendingUp } from "lucide-react";
import type { TimeReport } from "@/types/timeReport";
import { TimeReportExpandedRow } from "./TimeReportExpandedRow";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimeReportTableProps {
  timeReports: TimeReport[];
  timeTypes: Array<{ id: string; name: string }>;
  generalTimeAssignments: Array<{
    id: string;
    roleId: string;
    timeTypeId: string;
    hoursPerWeek: number;
    timeType: {
      id: string;
      name: string;
      isCapDev: boolean;
    };
  }>;
}

export function TimeReportTable({
  timeReports,
  timeTypes,
  generalTimeAssignments,
}: TimeReportTableProps) {
  const getTimeTypeDeviations = (report: TimeReport) => {
    const roleAssignments = generalTimeAssignments.filter(
      (a) => a.roleId === report.roleId
    );

    const deviations: Array<{
      timeTypeName: string;
      expectedHours: number;
      actualHours: number;
      deviation: number;
    }> = [];

    roleAssignments.forEach((assignment) => {
      const timeEntry = report.timeEntries.find(
        (e) => e.timeTypeId === assignment.timeTypeId
      );
      const actualHours = timeEntry?.hours ?? 0;
      const deviation = actualHours - assignment.hoursPerWeek;

      if (Math.abs(deviation) > 4) {
        // Only show significant deviations
        deviations.push({
          timeTypeName: assignment.timeType.name,
          expectedHours: assignment.hoursPerWeek,
          actualHours,
          deviation,
        });
      }
    });

    return deviations;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Time Report</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const headers = [
                "Employee",
                "Week",
                "Payroll ID",
                "Full Hours",
                "CapDev Time",
                "Non-CapDev Time",
                "Team",
                "Role",
                "Deviations",
              ];

              const csvData = timeReports.map((row) => {
                const capDevTime = row.timeEntries
                  .filter((entry) => entry.isCapDev)
                  .reduce((sum, entry) => sum + entry.hours, 0);
                const nonCapDevTime = row.timeEntries
                  .filter((entry) => !entry.isCapDev)
                  .reduce((sum, entry) => sum + entry.hours, 0);

                return [
                  row.employeeName,
                  row.week,
                  row.payrollId,
                  row.fullHours,
                  capDevTime,
                  nonCapDevTime,
                  row.team,
                  row.role,
                  row.deviations?.join("; ") ?? "",
                ];
              });

              const csvContent = [
                headers.join(","),
                ...csvData.map((row) => row.join(",")),
              ].join("\n");

              const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
              });
              const link = document.createElement("a");
              const url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute(
                "download",
                `time-report-${new Date().toISOString()}.csv`
              );
              link.style.visibility = "hidden";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="ml-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Week</TableHead>
                <TableHead>Payroll ID</TableHead>
                <TableHead>Full Hours</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Deviations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeReports.length > 0 ? (
                timeReports.map((report) => (
                  <TableRow
                    key={`${report.employeeName}-${report.week}`}
                    className={
                      report.isUnderutilized
                        ? "bg-amber-50 dark:bg-amber-950/20"
                        : ""
                    }
                  >
                    <TableCell>{report.employeeName}</TableCell>
                    <TableCell>{report.week}</TableCell>
                    <TableCell>{report.payrollId}</TableCell>
                    <TableCell>{report.fullHours}</TableCell>
                    <TableCell>{report.team}</TableCell>
                    <TableCell>{report.role}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {getTimeTypeDeviations(report).map((deviation) => (
                          <Tooltip key={deviation.timeTypeName}>
                            <TooltipTrigger>
                              <Badge
                                variant={
                                  deviation.deviation > 0
                                    ? "default"
                                    : "secondary"
                                }
                                className="flex items-center gap-1"
                              >
                                {deviation.timeTypeName}
                                {deviation.deviation > 0 ? (
                                  <TrendingUp className="h-3 w-3" />
                                ) : (
                                  <TrendingDown className="h-3 w-3" />
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Expected: {deviation.expectedHours}h, Actual:{" "}
                                {deviation.actualHours}h
                              </p>
                              <p>
                                Deviation: {deviation.deviation > 0 ? "+" : ""}
                                {deviation.deviation}h
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
