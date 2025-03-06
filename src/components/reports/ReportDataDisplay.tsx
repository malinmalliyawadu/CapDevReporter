"use client";

import { TimeDistributionCharts } from "@/components/reports/TimeDistributionCharts";
import { TimeReportTable } from "@/components/reports/TimeReportTable";
import { UtilizationIssues } from "@/components/reports/UtilizationIssues";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition, useRef } from "react";
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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const searchParams = useSearchParams();
  const initialFetchDone = useRef(false);

  // Fetch data on mount to ensure we have the full date range
  useEffect(() => {
    // Only run this effect once on mount
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    // Convert searchParams to a plain object
    const paramsObject: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      paramsObject[key] = value;
    });

    // Force a fresh fetch to ensure we have the complete data for the date range
    startTransition(async () => {
      try {
        const newData = await fetchTimeReportData(paramsObject);
        setData(newData);
        setIsFirstLoad(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsFirstLoad(false);
      }
    });
  }, [searchParams]);

  // Fetch data when search params change
  useEffect(() => {
    // Skip the initial render since we already fetched data in the mount effect
    if (!initialFetchDone.current) return;

    startTransition(async () => {
      try {
        // Convert searchParams to a plain object
        const paramsObject: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          paramsObject[key] = value;
        });

        const newData = await fetchTimeReportData(paramsObject);
        setData(newData);
        setIsFirstLoad(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setIsFirstLoad(false);
      }
    });
  }, [searchParams]);

  // Show a loading state for the first load
  if (isFirstLoad) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div
        className={cn(
          "absolute inset-0 bg-background/50 flex items-center justify-center z-40",
          "transition-all duration-200 ease-in-out",
          isPending && !isFirstLoad
            ? "opacity-100 backdrop-blur-[1px]"
            : "opacity-0 backdrop-blur-0 pointer-events-none"
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
      <div
        className={cn(
          "transition-opacity duration-200 ease-in-out",
          isPending && !isFirstLoad
            ? "opacity-50 pointer-events-none"
            : "opacity-100"
        )}
      >
        <TimeDistributionCharts
          key={`time-distribution-${JSON.stringify(
            data.timeReports.map((r) => r.id)
          )}`}
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
