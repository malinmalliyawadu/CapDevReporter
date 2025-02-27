"use server";

import { getTimeReportData } from "@/lib/timeReportService";

export async function fetchTimeReportData(params: {
  from?: string;
  to?: string;
  team?: string;
  role?: string;
  search?: string;
}) {
  const { from, to, team, role, search } = params;

  return getTimeReportData({
    from: from ? new Date(from) : new Date(),
    to: to ? new Date(to) : new Date(),
    team,
    role,
    search,
  });
}
