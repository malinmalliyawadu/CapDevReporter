"use client";

import { TimeDistributionCharts } from "@/components/reports/TimeDistributionCharts";
import { TimeReportTable } from "@/components/reports/TimeReportTable";
import { UtilizationIssues } from "@/components/reports/UtilizationIssues";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { fetchTimeReportData } from "@/app/actions/reports";
import { TimeReportData } from "@/lib/timeReportService";

export function ReportDataDisplay({
  initialData,
}: {
  initialData: TimeReportData;
}) {
  const [data, setData] = useState<TimeReportData>(initialData);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();

  useEffect(() => {
    startTransition(async () => {
      try {
        // Convert searchParams to a plain object
        const paramsObject: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          paramsObject[key] = value;
        });

        // Use the server action instead of fetch
        const newData = await fetchTimeReportData(paramsObject);
        setData(newData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    });
  }, [searchParams]);

  return (
    <div className="space-y-8 relative">
      <div
        className={cn(
          "absolute inset-0 bg-background/50 flex items-center justify-center z-40",
          "transition-all duration-200 ease-in-out",
          isPending
            ? "opacity-100 backdrop-blur-[1px]"
            : "opacity-0 backdrop-blur-0 pointer-events-none"
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <div
        className={cn(
          "transition-opacity duration-200 ease-in-out",
          isPending ? "opacity-50 pointer-events-none" : "opacity-100"
        )}
      >
        <TimeDistributionCharts
          timeReport={data.timeReports}
          timeTypes={data.timeTypes}
        />

        <UtilizationIssues
          timeReports={data.timeReports}
          timeTypes={data.timeTypes}
          generalTimeAssignments={data.generalAssignments}
        />

        <TimeReportTable
          timeReports={data.timeReports}
          timeTypes={data.timeTypes}
        />
      </div>
    </div>
  );
}
