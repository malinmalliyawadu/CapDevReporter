import { format, getDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Prisma, TimeType } from "@prisma/client";
import { TimeReport, TimeReportEntry } from "@/types/timeReport";

export interface TimeReportParams {
  from: Date;
  to: Date;
  team?: string;
  role?: string;
  search?: string;
}

export interface TimeReportData {
  timeReports: TimeReport[];
  teams: any[];
  roles: any[];
  timeTypes: { id: string; name: string }[];
  generalAssignments: any[];
}

// Map day names to day numbers (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Parse the weeklySchedule JSON string from the database
 */
function parseWeeklySchedule(
  weeklySchedule: string | null
): { days: string[]; hours?: number } | null {
  if (!weeklySchedule) return null;

  try {
    return JSON.parse(weeklySchedule);
  } catch (error) {
    console.error("Error parsing weeklySchedule:", error);
    return null;
  }
}

/**
 * Check if a date falls on one of the specified days of the week
 */
function isDateOnScheduledDay(
  date: Date,
  schedule: { days: string[] } | null
): boolean {
  if (!schedule || !schedule.days || schedule.days.length === 0) return false;

  const dayOfWeek = getDay(date);
  return schedule.days.some((day) => {
    const dayNumber = dayNameToNumber[day.toLowerCase()];
    return dayNumber === dayOfWeek;
  });
}

/**
 * Get time report data based on search parameters
 */
export async function getTimeReportData(
  params: TimeReportParams
): Promise<TimeReportData> {
  const { from, to, team: teamId, role: roleId, search } = params;

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
    const leaveTimeType = timeTypes.find((tt) => tt.name === "Leave");
    const capDevTimeType = timeTypes.find((tt) => tt.name === "CapDev");
    const nonCapDevTimeType = timeTypes.find((tt) => tt.name === "Non-CapDev");

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

    // Group all entries by date
    const entriesByDate = new Map<string, TimeReportEntry[]>();

    // Combine leave and project entries
    const allEntries = [...leaveEntries, ...projectEntries];

    // Group entries by date
    allEntries.forEach((entry) => {
      if (!entriesByDate.has(entry.date)) {
        entriesByDate.set(entry.date, []);
      }
      entriesByDate.get(entry.date)?.push(entry);
    });

    // Create entries for scheduled time types
    const scheduledEntries: TimeReportEntry[] = [];

    // Get all dates in the range
    const dateRange: Date[] = [];
    const currentDate = new Date(from);
    while (currentDate <= to) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process each time type with a weekly schedule
    timeTypes.forEach((timeType) => {
      // Access the weeklySchedule property directly
      const weeklySchedule = parseWeeklySchedule(timeType.weeklySchedule);
      if (!weeklySchedule) return;

      // For each date in the range
      dateRange.forEach((date) => {
        const formattedDate = format(date, "yyyy-MM-dd");

        // Check if this date matches the weekly schedule
        if (isDateOnScheduledDay(date, weeklySchedule)) {
          // Find the general time assignment for this time type and employee's role
          const generalAssignment = generalTimeAssignments.find(
            (assignment) =>
              assignment.timeTypeId === timeType.id &&
              assignment.roleId === employee.roleId
          );

          // Get the hours from the general assignment or use default (8 hours)
          const scheduledHours = generalAssignment
            ? generalAssignment.hoursPerWeek
            : weeklySchedule.hours || 8;

          // Create an entry for this scheduled time type
          const scheduledEntry: TimeReportEntry = {
            id: `scheduled-${timeType.id}-${formattedDate}`,
            hours: scheduledHours,
            timeTypeId: timeType.id,
            isCapDev: !!timeType.isCapDev,
            date: formattedDate,
            activityDate: formattedDate,
            isScheduled: true,
            scheduledTimeTypeName: timeType.name,
          };

          scheduledEntries.push(scheduledEntry);

          // Add to entries by date
          if (!entriesByDate.has(formattedDate)) {
            entriesByDate.set(formattedDate, []);
          }
          entriesByDate.get(formattedDate)?.push(scheduledEntry);
        }
      });
    });

    // Combine all entries, prioritizing scheduled entries
    const timeEntries: TimeReportEntry[] = [];

    // Process each date's entries
    entriesByDate.forEach((entries, date) => {
      // Sort entries to prioritize scheduled entries first
      const sortedEntries = entries.sort((a, b) => {
        // Scheduled entries come first
        if (a.isScheduled && !b.isScheduled) return -1;
        if (!a.isScheduled && b.isScheduled) return 1;
        return 0;
      });

      timeEntries.push(...sortedEntries);
    });

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
