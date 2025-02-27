"use client";

import { AlertTriangle } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { TimeReport } from "@/types/timeReport";
import { format } from "date-fns";
import { GeneralTimeAssignment } from "@prisma/client";
import { TimeType } from "@prisma/client";

interface UtilizationIssuesProps {
  timeReports: TimeReport[];
  generalTimeAssignments: GeneralTimeAssignment[];
  timeTypes: TimeType[];
}

export function UtilizationIssues({
  timeReports,
  generalTimeAssignments,
  timeTypes,
}: UtilizationIssuesProps) {
  const getDeviationReason = (report: TimeReport) => {
    const roleAssignments = generalTimeAssignments.filter(
      (a) => a.roleId === report.roleId
    );

    // If no general time assignments exist for this role
    if (roleAssignments.length === 0) {
      return "No time assignments defined for role";
    }

    // Calculate total assigned hours
    const totalAssignedHours = roleAssignments.reduce(
      (sum, a) => sum + a.hoursPerWeek,
      0
    );

    // If total assigned hours is significantly different from expected hours
    if (Math.abs(totalAssignedHours - report.expectedHours) > 4) {
      return `Role assignments (${totalAssignedHours}h) don't match expected hours (${report.expectedHours}h)`;
    }

    // Check for significant deviations from assignments
    const deviations = roleAssignments.map((assignment) => {
      const timeEntry = report.timeEntries.find(
        (e) => e.timeTypeId === assignment.timeTypeId
      );
      const actualHours = timeEntry?.hours ?? 0;
      const timeType = timeTypes.find((tt) => tt.id === assignment.timeTypeId);
      const timeTypeName = timeType ? timeType.name : "Unknown";
      return {
        timeTypeName,
        expected: assignment.hoursPerWeek,
        actual: actualHours,
        deviation: actualHours - assignment.hoursPerWeek,
      };
    });

    const significantDeviations = deviations.filter(
      (d) => Math.abs(d.deviation) > 4
    );

    if (significantDeviations.length > 0) {
      return `Significant deviations from expected hours: ${significantDeviations
        .map(
          (d) => `${d.timeTypeName} (${d.actual}h vs ${d.expected}h expected)`
        )
        .join(", ")}`;
    }

    return report.underutilizationReason || "Insufficient hours allocated";
  };

  const reportsWithIssues = timeReports.filter(
    (report) => report.isUnderutilized
  );

  if (reportsWithIssues.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="mb-6">
      <AccordionItem value="utilization-issues">
        <AccordionTrigger className="flex gap-2 text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Issues summary ({reportsWithIssues.length} employees)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 px-4 pt-2">
            {/* Group by reason */}
            {(
              Object.entries(
                reportsWithIssues.reduce((acc, report) => {
                  const reason = getDeviationReason(report);
                  if (!acc[reason]) acc[reason] = [];
                  acc[reason].push(report);
                  return acc;
                }, {} as Record<string, TimeReport[]>)
              ) as [string, TimeReport[]][]
            ).map(([reason, reports]) => (
              <div key={reason} className="space-y-2">
                <div className="font-medium text-amber-800 dark:text-amber-300">
                  {reason} ({reports.length}{" "}
                  {reports.length === 1 ? "employee" : "employees"})
                </div>
                <div className="pl-4 text-sm text-amber-700 dark:text-amber-400 space-y-1">
                  {reports.map((report) => (
                    <div key={report.id} className="flex items-center gap-2">
                      <span>{report.employeeName}</span>
                      <span className="text-amber-600 dark:text-amber-500">
                        •
                      </span>
                      <span>
                        Week of {format(new Date(report.week), "MMM d, yyyy")}
                      </span>
                      <span className="text-amber-600 dark:text-amber-500">
                        •
                      </span>
                      <span>
                        {report.missingHours.toFixed(1)} hours under target
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
