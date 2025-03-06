import { BarChart } from "lucide-react";
import { startOfYear } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { ReportDataDisplay } from "@/components/reports/ReportDataDisplay";
import { getTimeReportData } from "@/lib/timeReportService";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();

  const params = await searchParams;

  // Parse and prepare all parameters
  const fromDate = params["from"]
    ? new Date(params["from"] as string)
    : defaultStartDate;

  const toDate = params["to"]
    ? new Date(params["to"] as string)
    : defaultEndDate;

  const teamId = params["team"] as string;
  const roleId = params["role"] as string;
  const search = params["search"] as string;

  // For URL display purposes, ensure the parameters are in the URL
  // This doesn't affect the data fetching but keeps the URL in sync
  if (!params["from"]) {
    params["from"] = defaultStartDate.toISOString();
  }
  if (!params["to"]) {
    params["to"] = defaultEndDate.toISOString();
  }

  // Fetch data using the service with parsed parameters
  const data = await getTimeReportData({
    from: fromDate,
    to: toDate,
    team: teamId,
    role: roleId,
    search: search,
  });

  // Log the date range and data size for debugging
  console.log(
    `Initial data fetch with date range: ${fromDate.toISOString()} to ${toDate.toISOString()}`
  );
  console.log(`Fetched ${data.timeReports.length} time reports`);

  // Log the weeks in the data
  if (data.timeReports.length > 0) {
    const weeks = data.timeReports.map((report) => report.week);
    const uniqueWeeks = [...new Set(weeks)].sort();
    console.log(`Initial data spans weeks: ${uniqueWeeks.join(", ")}`);
  }

  return (
    <div className="space-y-8">
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

      <ReportDataDisplay initialData={data} />
    </div>
  );
}
