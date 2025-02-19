import { BarChart } from "lucide-react";
import { startOfYear } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { TimeDistributionCharts } from "@/components/reports/TimeDistributionCharts";
import { TimeReportTable } from "@/components/reports/TimeReportTable";
import { UtilizationIssues } from "@/components/reports/UtilizationIssues";

export const dynamic = "force-dynamic";

async function getTimeReportData(searchParams: URLSearchParams) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3000}`;

  const response = await fetch(
    `${baseUrl}/api/reports?${searchParams.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch time reports: ${response.statusText}`);
  }

  return response.json();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();

  // Convert searchParams to URLSearchParams
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      params.set(key, Array.isArray(value) ? value[0] : value);
    }
  });

  // Set default date range if not provided
  if (!params.has("from")) {
    params.set("from", defaultStartDate.toISOString());
  }
  if (!params.has("to")) {
    params.set("to", defaultEndDate.toISOString());
  }

  // Fetch data from the API
  const data = await getTimeReportData(params);

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <BarChart className="h-7 w-7 text-rose-500" />
            <span className="bg-gradient-to-r from-rose-500 to-red-500 bg-clip-text text-transparent">
              Time Reports
            </span>
          </span>
        }
        description="View and analyze time tracking data."
      />

      <div className="sticky top-4 z-10">
        <TimeReportFilters teams={data.teams} roles={data.roles} />
      </div>

      <TimeDistributionCharts
        timeReport={data.timeReports}
        timeTypes={data.timeTypes}
      />

      <UtilizationIssues
        timeReports={data.timeReports}
        generalTimeAssignments={data.generalAssignments}
      />

      <TimeReportTable
        timeReports={data.timeReports}
        timeTypes={data.timeTypes}
        generalTimeAssignments={data.generalAssignments}
      />
    </div>
  );
}
