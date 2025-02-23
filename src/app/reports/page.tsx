import { BarChart } from "lucide-react";
import { startOfYear, format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { ReportDataDisplay } from "@/components/reports/ReportDataDisplay";
import { prisma } from "@/lib/prisma";
import { Prisma, TimeType } from "@prisma/client";
import { TimeReport, TimeReportEntry } from "@/types/timeReport";

export const dynamic = "force-dynamic";

async function getTimeReportData(searchParams: {
  [key: string]: string | string[] | undefined;
}) {
  const from = searchParams["from"]
    ? new Date(searchParams["from"] as string)
    : startOfYear(new Date());
  const to = searchParams["to"]
    ? new Date(searchParams["to"] as string)
    : new Date();
  const teamId = searchParams["team"] as string;
  const roleId = searchParams["role"] as string;
  const search = searchParams["search"] as string;

  // Build the where clause for employee search
  const where: Prisma.EmployeeWhereInput = {
    AND: [
      // Search by name or payroll ID
      search
        ? {
            OR: [
              { name: { contains: search } },
              { payrollId: { contains: search } },
            ],
          }
        : {},
      // Filter by role
      roleId && roleId !== "all" ? { roleId } : {},
      // Filter by team
      teamId && teamId !== "all"
        ? {
            assignments: {
              some: {
                teamId,
                startDate: { lte: to },
                OR: [{ endDate: null }, { endDate: { gte: from } }],
              },
            },
          }
        : {},
    ],
  };

  // Fetch data in parallel
  const [timeEntries, teams, roles, timeTypes, generalTimeAssignments] =
    await Promise.all([
      prisma.timeEntry.findMany({
        where: {
          date: {
            gte: from,
            lte: to,
          },
          employee: where,
        },
        include: {
          employee: {
            include: {
              role: true,
              assignments: {
                include: {
                  team: true,
                },
                where: {
                  startDate: { lte: to },
                  OR: [{ endDate: null }, { endDate: { gte: from } }],
                },
              },
            },
          },
          timeType: true,
        },
      }),
      prisma.team.findMany(),
      prisma.role.findMany(),
      prisma.timeType.findMany(),
      prisma.generalTimeAssignment.findMany({
        include: {
          timeType: true,
        },
      }),
    ]);

  // Group time entries by employee and week
  const timeEntriesByEmployeeAndWeek = timeEntries.reduce((acc, entry) => {
    const week = format(entry.date, "yyyy-MM-dd");
    const key = `${entry.employeeId}-${week}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {} as Record<string, typeof timeEntries>);

  // Transform time entries into time reports
  const timeReports = Object.entries(timeEntriesByEmployeeAndWeek).map(
    ([key, entries]) => {
      const firstEntry = entries[0];
      const employee = firstEntry.employee;
      const currentAssignment = employee.assignments[0] || null;
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
      const expectedHours = employee.hoursPerWeek; // Use employee's configured hours per week
      const isUnderutilized = totalHours < expectedHours;

      const timeReportEntries: TimeReportEntry[] = entries.map((entry) => ({
        id: entry.id,
        hours: entry.hours,
        timeTypeId: entry.timeTypeId,
        isCapDev: entry.timeType.isCapDev,
        date: format(entry.date, "yyyy-MM-dd"),
      }));

      const report: TimeReport = {
        id: key,
        employeeId: employee.id,
        employeeName: employee.name,
        week: format(firstEntry.date, "yyyy-MM-dd"),
        payrollId: employee.payrollId,
        fullHours: totalHours,
        expectedHours,
        isUnderutilized,
        missingHours: Math.max(0, expectedHours - totalHours),
        team: currentAssignment?.team?.name || "Unassigned",
        role: employee.role?.name || "No Role",
        roleId: employee.roleId || "",
        timeEntries: timeReportEntries,
      };

      return report;
    }
  );

  return {
    timeReports,
    teams,
    roles,
    timeTypes: timeTypes.map((tt: TimeType) => ({ id: tt.id, name: tt.name })),
    generalAssignments: generalTimeAssignments,
  };
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

  // Fetch data directly from the database
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
