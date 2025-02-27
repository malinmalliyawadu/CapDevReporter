import {
  format,
  getDay,
  startOfYear,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isWeekend,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { Prisma, TimeType } from "@prisma/client";
import { TimeReport, TimeReportEntry } from "@/types/timeReport";
import Holidays from "date-holidays";

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
): { days: string[] } | null {
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

  // Get all employees with their roles and teams
  const employees = await prisma.employee.findMany({
    where,
    include: {
      role: true,
      assignments: {
        include: {
          team: {
            include: {
              jiraBoards: {
                include: {
                  projects: {
                    include: {
                      activities: {
                        where: {
                          activityDate: {
                            gte: from,
                            lte: to,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      },
    },
  });

  // Get all leave records
  const leaveRecords = await prisma.leave.findMany({
    where: {
      status: {
        in: ["TAKEN", "APPROVED"],
      },
      date: {
        gte: from,
        lte: to,
      },
      employeeId: {
        in: employees.map((e) => e.id),
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Get general time assignments and time types
  const [generalAssignments, timeTypes, teams, roles] = await Promise.all([
    prisma.generalTimeAssignment.findMany({
      include: {
        timeType: true,
      },
    }),
    prisma.timeType.findMany(),
    prisma.team.findMany(),
    prisma.role.findMany(),
  ]);

  // Initialize holidays for New Zealand
  const holidays = new Holidays("NZ", "WGN");

  // Create a map of date -> employee -> leave record
  const leaveMap = new Map<string, Map<string, (typeof leaveRecords)[0]>>();
  leaveRecords.forEach((leave) => {
    const dateKey = format(leave.date, "yyyy-MM-dd");
    if (!leaveMap.has(dateKey)) {
      leaveMap.set(dateKey, new Map());
    }
    leaveMap.get(dateKey)?.set(leave.employeeId, leave);
  });

  // Get unique weeks in the date range
  const weeks = eachDayOfInterval({
    start: from,
    end: to,
  })
    .map((date) => format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd"))
    .filter((value, index, self) => self.indexOf(value) === index);

  // Process each employee
  const timeReportsPromises = employees.map(async (employee) => {
    // Process each week
    const employeeReports = await Promise.all(
      weeks.map(async (weekKey) => {
        const reportKey = `${employee.id}-${weekKey}`;
        const weekStart = new Date(weekKey);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const daysInWeek = eachDayOfInterval({
          start: weekStart,
          end: weekEnd,
        });

        // Get assignments for this week
        const weekAssignments = employee.assignments.filter((a) => {
          const assignmentStart = new Date(a.startDate);
          const assignmentEnd = a.endDate ? new Date(a.endDate) : new Date();
          return assignmentStart <= weekEnd && assignmentEnd >= weekStart;
        });

        // Calculate working days (excluding weekends and public holidays)
        const workingDays = daysInWeek.filter((date) => {
          if (isWeekend(date)) return false;
          const holiday = holidays.isHoliday(date);
          return !holiday;
        }).length;

        // Calculate available hours for work based on employee's hours per week setting
        const hoursPerDay = employee.hoursPerWeek / 5; // Assuming 5-day work week
        const availableHours = workingDays * hoursPerDay;

        // Initialize time report
        const report: TimeReport = {
          id: reportKey,
          employeeId: employee.id,
          employeeName: employee.name,
          week: weekKey,
          payrollId: employee.payrollId,
          fullHours: 0,
          expectedHours: employee.hoursPerWeek,
          isUnderutilized: false,
          missingHours: 0,
          team:
            weekAssignments.length > 0
              ? weekAssignments.map((wa) => wa.team.name).join(", ")
              : "Unassigned",
          role: employee.role.name,
          roleId: employee.role.id,
          timeEntries: [],
        };

        // Check if hours per week is set
        if (employee.hoursPerWeek === 0) {
          report.isUnderutilized = true;
          report.expectedHours = 0;
          report.missingHours = 0;
          report.underutilizationReason = "Hours per week not set";
          return report;
        }

        // Process each day for leave, public holidays, and project activities
        daysInWeek.forEach((date) => {
          if (isWeekend(date)) return;

          const dateKey = format(date, "yyyy-MM-dd");
          const holiday = holidays.isHoliday(date);
          const leaveRecord = leaveMap.get(dateKey)?.get(employee.id);

          // Add project activities for this day
          weekAssignments.forEach((assignment) => {
            assignment.team.jiraBoards.forEach((board) => {
              board.projects.forEach((project) => {
                const activities = project.activities.filter(
                  (activity) =>
                    format(activity.activityDate, "yyyy-MM-dd") === dateKey
                );

                if (activities.length > 0) {
                  report.timeEntries.push({
                    id: `${employee.id}-${dateKey}-${project.id}`,
                    hours: 8, // Default to 8 hours per day
                    timeTypeId: timeTypes.find((t) => !t.isCapDev)?.id ?? "",
                    isCapDev: project.isCapDev,
                    date: dateKey,
                    activityDate: dateKey,
                    projectId: project.id,
                    projectName: project.name,
                    teamName: assignment.team.name,
                  });
                  report.fullHours += 8;
                }
              });
            });
          });

          // Add public holiday entry
          if (holiday) {
            report.timeEntries.push({
              id: `${employee.id}-${dateKey}-holiday`,
              hours: 8,
              timeTypeId: timeTypes.find((t) => t.name === "Leave")?.id ?? "",
              isCapDev: false,
              isPublicHoliday: true,
              publicHolidayName: holiday[0].name,
              date: dateKey,
              activityDate: dateKey,
            });
            report.fullHours += 8;
          }
          // Add leave entry
          else if (leaveRecord) {
            report.timeEntries.push({
              id: `${employee.id}-${dateKey}-leave`,
              hours: 8,
              timeTypeId: timeTypes.find((t) => t.name === "Leave")?.id ?? "",
              isCapDev: false,
              isLeave: true,
              leaveType: leaveRecord.type,
              date: dateKey,
              activityDate: dateKey,
            });
            report.fullHours += 8;
          }
        });

        // Process scheduled time types
        timeTypes.forEach((timeType) => {
          // Access the weeklySchedule property directly
          const weeklySchedule = parseWeeklySchedule(timeType.weeklySchedule);
          if (!weeklySchedule) return;

          // For each date in the range
          daysInWeek.forEach((date) => {
            const formattedDate = format(date, "yyyy-MM-dd");

            // Check if this date matches the weekly schedule
            if (isDateOnScheduledDay(date, weeklySchedule)) {
              // Find the general time assignment for this time type and employee's role
              const generalAssignment = generalAssignments.find(
                (assignment) =>
                  assignment.timeTypeId === timeType.id &&
                  assignment.roleId === employee.roleId
              );

              // Get the hours from the general assignment or use default (8 hours)
              const scheduledHours = generalAssignment
                ? generalAssignment.hoursPerWeek
                : 8;

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

              // Add to time entries
              report.timeEntries.push(scheduledEntry);
              report.fullHours += scheduledHours;
            }
          });
        });

        // Sort entries to prioritize scheduled entries
        report.timeEntries.sort((a, b) => {
          // Sort by date first
          if (a.date < b.date) return -1;
          if (a.date > b.date) return 1;

          // Then prioritize scheduled entries
          if (a.isScheduled && !b.isScheduled) return -1;
          if (!a.isScheduled && b.isScheduled) return 1;

          return 0;
        });

        // Calculate underutilization
        report.isUnderutilized = report.fullHours < report.expectedHours;
        report.missingHours = Math.max(
          0,
          report.expectedHours - report.fullHours
        );

        return report;
      })
    );

    return employeeReports;
  });

  const timeReports = (await Promise.all(timeReportsPromises)).flat();

  return {
    timeReports,
    teams,
    roles,
    timeTypes: timeTypes.map((tt) => ({ id: tt.id, name: tt.name })),
    generalAssignments,
  };
}
