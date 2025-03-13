"use client";

import { TimeDistributionCharts } from "@/components/reports/TimeDistributionCharts";
import { TimeReportTable } from "@/components/reports/TimeReportTable";
import { UtilizationIssues } from "@/components/reports/UtilizationIssues";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { use, useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";
import { TimeReportData } from "@/lib/timeReportService";
import { TimeReportFilters } from "./TimeReportFilters";

export function ReportDataDisplay({
  initialData,
}: {
  initialData: Promise<TimeReportData>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const onFilterUpdate = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, {
          scroll: false,
        });
      });
    },
    [pathname, router]
  );
  const data = use(initialData);

  return (
    <>
      <div className="sticky top-4 z-10">
        <TimeReportFilters
          teams={data.teams}
          roles={data.roles}
          onFilterUpdate={onFilterUpdate}
        />
      </div>

      <div className="space-y-8 relative" data-testid="report-data-display">
        <div
          className={cn(
            "absolute inset-0 bg-background/50 flex justify-center z-40 pt-12",
            "transition-all duration-200 ease-in-out",
            isPending
              ? "opacity-100 backdrop-blur-[1px]"
              : "opacity-0 backdrop-blur-0 pointer-events-none"
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <div>
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
    </>
  );
}
