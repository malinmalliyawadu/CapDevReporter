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

interface UtilizationIssuesProps {
  timeReports: TimeReport[];
}

export function UtilizationIssues({ timeReports }: UtilizationIssuesProps) {
  if (!timeReports.some((report) => report.isUnderutilized)) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="mb-6">
      <AccordionItem value="utilization-issues">
        <AccordionTrigger className="flex gap-2 text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span>
              Utilization Issues (
              {timeReports.filter((r) => r.isUnderutilized).length} employees)
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 px-4 pt-2">
            {/* Group by reason */}
            {(
              Object.entries(
                timeReports
                  .filter((report) => report.isUnderutilized)
                  .reduce((acc, report) => {
                    const reason = report.underutilizationReason || "Unknown";
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
