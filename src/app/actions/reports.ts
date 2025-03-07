"use server";

import { getTimeReportData } from "@/lib/timeReportService";
import { startOfYear } from "date-fns";

export async function fetchTimeReportData(params: {
  from?: string;
  to?: string;
  team?: string;
  role?: string;
  search?: string;
}) {
  const { from, to, team, role, search } = params;

  // Set default dates if not provided
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();

  const fromDate = from ? new Date(from) : defaultStartDate;
  const toDate = to ? new Date(to) : defaultEndDate;

  return getTimeReportData({
    from: fromDate,
    to: toDate,
    team,
    role,
    search,
  });
}
