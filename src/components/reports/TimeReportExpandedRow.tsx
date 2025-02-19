"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import type { TimeReport } from "@/types/timeReport";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <h4 className="font-medium">Time Entries</h4>
        <div className="space-y-1">
          {report.timeEntries.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2">
              <span className="font-medium">{entry.hours.toFixed(1)}h</span>
              <span>-</span>
              <span>
                {timeTypes.find((t) => t.id === entry.timeTypeId)?.name}
              </span>
              {entry.isCapDev && (
                <Badge variant="default" className="ml-2">
                  CapDev
                </Badge>
              )}
              {entry.projectName && (
                <Badge variant="secondary" className="ml-2">
                  {entry.projectName}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {deviations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Deviations from Expected Hours</h4>
          <div className="flex gap-2 flex-wrap">
            {deviations.map((deviation) => (
              <Tooltip key={deviation.timeTypeName}>
                <TooltipTrigger>
                  <Badge
                    variant={deviation.deviation > 0 ? "default" : "secondary"}
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
        </div>
      )}
    </div>
  );
}
