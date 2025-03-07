import { BarChart } from "lucide-react";
import { startOfYear } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
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

      <ReportDataDisplay initialData={data} />
    </div>
  );
}
