import { BarChart } from "lucide-react";
import { startOfYear } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { ReportDataDisplay } from "@/components/reports/ReportDataDisplay";
import { GET } from "@/app/api/reports/route";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function getTimeReportData(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  // Create a mock request object with the search params
  const url = new URL("/api/reports", "http://localhost");
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });

  const mockRequest = new NextRequest(url);
  const response = await GET(mockRequest);

  if (!response.ok) {
    throw new Error(`Failed to fetch time reports: ${response.statusText}`);
  }

  return response.json();
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();

  const params = await searchParams;

  // Set default date range if not provided
  if (!params["from"]) {
    params["from"] = defaultStartDate.toISOString();
  }
  if (!params["to"]) {
    params["to"] = defaultEndDate.toISOString();
  }

  // Fetch data from the API
  const data = await getTimeReportData(params);

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
