import { startOfYear } from "date-fns";
import { ReportDataDisplay } from "@/components/reports/ReportDataDisplay";
import { getTimeReportData } from "@/lib/timeReportService";
import { Header } from "./Header";

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
      <Header />

      <ReportDataDisplay initialData={data} />
    </div>
  );
}
