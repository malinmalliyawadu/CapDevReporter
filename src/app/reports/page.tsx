import { BarChart } from "lucide-react";
import { startOfYear, format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { ReportDataDisplay } from "@/components/reports/ReportDataDisplay";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
  const [
    employees,
    teams,
    roles,
    timeTypes,
    generalTimeAssignments,
    leaves,
    projectActivities,
  ] = await Promise.all([
    prisma.employee.findMany({
      where,
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
    }),
    prisma.team.findMany(),
    prisma.role.findMany(),
    prisma.timeType.findMany(),
    prisma.generalTimeAssignment.findMany({
      include: {
        timeType: true,
      },
    }),
    prisma.leave.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
        employee: where,
      },
    }),
    prisma.projectActivity.findMany({
      where: {
        activityDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        project: {
          include: {
            board: true,
          },
        },
      },
    }),
  ]);

  // Group activities by employee and week
  const timeReports = employees.map((employee) => {
    const currentAssignment = employee.assignments[0] || null;

    // Get leaves for this employee
    const employeeLeaves = leaves.filter(
      (leave) => leave.employeeId === employee.id
    );

    // Find appropriate time types for leaves and projects
    const leaveTimeType = timeTypes.find(
      (tt) => tt.name === "General Administration"
    );
    const capDevTimeType = timeTypes.find((tt) => tt.name === "Tech Debt");
    const nonCapDevTimeType = timeTypes.find(
      (tt) => tt.name === "General Administration"
    );

    // Create time report entries from leaves
    const leaveEntries: TimeReportEntry[] = employeeLeaves.map((leave) => ({
      id: leave.id,
      hours: leave.duration,
      timeTypeId: leaveTimeType?.id || "leave",
      isCapDev: false,
      isLeave: true,
      leaveType: leave.type,
      date: format(leave.date, "yyyy-MM-dd"),
    }));

    // Create time report entries from project activities
    const projectEntries: TimeReportEntry[] = projectActivities
      .filter((activity) => {
        // Filter activities based on the employee's team assignment
        const employeeTeamId = currentAssignment?.team?.id;
        if (!employeeTeamId) return false;

        // Get the project's board and check if it belongs to the employee's team
        return activity.project.board.teamId === employeeTeamId;
      })
      .map((activity) => ({
        id: activity.id,
        hours: 8, // Default to 8 hours per activity
        timeTypeId: activity.project.isCapDev
          ? capDevTimeType?.id || "capdev"
          : nonCapDevTimeType?.id || "non-capdev",
        isCapDev: activity.project.isCapDev,
        projectId: activity.project.id,
        projectName: activity.project.name,
        jiraId: activity.jiraIssueId,
        date: format(activity.activityDate, "yyyy-MM-dd"),
      }));

    const timeEntries = [...leaveEntries, ...projectEntries];
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const expectedHours = employee.hoursPerWeek;
    const isUnderutilized = totalHours < expectedHours;

    const report: TimeReport = {
      id: employee.id,
      employeeId: employee.id,
      employeeName: employee.name,
      week: format(new Date(), "yyyy-MM-dd"), // You might want to group by week
      payrollId: employee.payrollId,
      fullHours: totalHours,
      expectedHours,
      isUnderutilized,
      missingHours: Math.max(0, expectedHours - totalHours),
      team: currentAssignment?.team?.name || "Unassigned",
      role: employee.role?.name || "No Role",
      roleId: employee.roleId || "",
      timeEntries,
    };

    return report;
  });

  return {
    timeReports,
    teams,
    roles,
    timeTypes: timeTypes.map((tt) => ({ id: tt.id, name: tt.name })),
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
