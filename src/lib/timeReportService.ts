import {
  format,
  getDay,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isWeekend,
  addDays,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import {
  GeneralTimeAssignment,
  Prisma,
  Role,
  Team,
  TimeType,
} from "@prisma/client";
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
  teams: Team[];
  roles: Role[];
  timeTypes: TimeType[];
  generalAssignments: GeneralTimeAssignment[];
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
        in: ["Pending", "Approved"],
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

  // Process each leave record and create entries for all days covered by the leave
  leaveRecords.forEach((leave) => {
    const leaveDate = new Date(leave.date);
    const leaveDuration = leave.duration;
    const leaveDays = Math.ceil(leaveDuration / 8);

    // Add entry for the original leave date
    const originalDateKey = format(leaveDate, "yyyy-MM-dd");
    if (!leaveMap.has(originalDateKey)) {
      leaveMap.set(originalDateKey, new Map());
    }
    leaveMap.get(originalDateKey)?.set(leave.employeeId, leave);

    // Add entries for additional days if duration > 8 hours
    if (leaveDays > 1) {
      let currentDate = new Date(leaveDate);

      for (let i = 1; i < leaveDays; i++) {
        // Move to the next day
        currentDate = addDays(currentDate, 1);

        // Skip weekends
        while (isWeekend(currentDate)) {
          currentDate = addDays(currentDate, 1);
        }

        // Add to leave map
        const dateKey = format(currentDate, "yyyy-MM-dd");
        if (!leaveMap.has(dateKey)) {
          leaveMap.set(dateKey, new Map());
        }
        leaveMap.get(dateKey)?.set(leave.employeeId, leave);
      }
    }
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
      weeks.map(async (weekKey: string) => {
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
            // Only create a leave entry for this specific day
            // (additional days for multi-day leave are handled by the leaveMap)
            report.timeEntries.push({
              id: `${employee.id}-${dateKey}-leave`,
              hours: Math.min(leaveRecord.duration, 8), // Cap at 8 hours per day
              timeTypeId: timeTypes.find((t) => t.name === "Leave")?.id ?? "",
              isCapDev: false,
              isLeave: true,
              leaveType: leaveRecord.type,
              date: dateKey,
              activityDate: dateKey,
            });
            report.fullHours += Math.min(leaveRecord.duration, 8);
          }
        });

        // Process scheduled time types (with weekly schedule)
        timeTypes.forEach((timeType) => {
          // Access the weeklySchedule property directly
          const weeklySchedule = parseWeeklySchedule(timeType.weeklySchedule);
          if (!weeklySchedule) return;

          // For each date in the range
          daysInWeek.forEach((date) => {
            const formattedDate = format(date, "yyyy-MM-dd");

            // Skip if this is a weekend, holiday, or the employee is on leave
            if (
              isWeekend(date) ||
              holidays.isHoliday(date) ||
              leaveMap.get(formattedDate)?.get(employee.id)
            ) {
              return;
            }

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

        // Process regular time types (without weekly schedule)
        // Get all regular time types (those without a weekly schedule)
        const regularTimeTypes = timeTypes.filter(
          (timeType) => !timeType.weeklySchedule
        );

        // Get the working days in the week (excluding weekends, holidays, and leave days)
        const regularWorkingDays = daysInWeek.filter((date) => {
          if (isWeekend(date)) return false;
          const holiday = holidays.isHoliday(date);
          if (holiday) return false;

          // Check if employee is on leave for this day
          const dateKey = format(date, "yyyy-MM-dd");
          const onLeave = leaveMap.get(dateKey)?.get(employee.id);
          if (onLeave) return false;

          return true;
        });

        // Process each regular time type
        regularTimeTypes.forEach((timeType) => {
          // Find the general time assignment for this time type and employee's role
          const generalAssignment = generalAssignments.find(
            (assignment) =>
              assignment.timeTypeId === timeType.id &&
              assignment.roleId === employee.roleId
          );

          // Skip if there's no assignment for this time type and role
          if (!generalAssignment) return;

          // Get the total hours per week for this time type
          const hoursPerWeek = generalAssignment.hoursPerWeek;

          // Skip if hours per week is 0
          if (hoursPerWeek === 0) return;

          // Instead of creating daily entries, create a single rolled-up entry for the week
          // Use the first working day of the week as the date for the rolled-up entry
          const firstWorkingDay =
            regularWorkingDays.length > 0 ? regularWorkingDays[0] : weekStart;
          const formattedDate = format(firstWorkingDay, "yyyy-MM-dd");

          // Create a single entry for this regular time type for the whole week
          const regularEntry: TimeReportEntry = {
            id: `regular-${timeType.id}-${weekKey}`,
            hours: hoursPerWeek,
            timeTypeId: timeType.id,
            isCapDev: !!timeType.isCapDev,
            date: formattedDate,
            activityDate: formattedDate,
            isScheduled: false,
            scheduledTimeTypeName: timeType.name,
            isRolledUp: true, // Add a flag to indicate this is a rolled-up entry
            rolledUpHoursPerWeek: hoursPerWeek, // Store the total hours per week
          };

          // Add to time entries
          report.timeEntries.push(regularEntry);
          report.fullHours += hoursPerWeek;
        });

        // Calculate remaining hours for project activities
        const totalRemainingHours = Math.max(
          0,
          employee.hoursPerWeek - report.fullHours
        );

        // Collect all project activities for the week
        const weekProjectActivities: {
          date: string;
          projectId: string;
          projectName: string;
          teamName: string;
          isCapDev: boolean;
          jiraId: string;
        }[] = [];

        // Create a map to track unique project-date combinations
        const uniqueProjectDates = new Map<string, boolean>();

        weekAssignments.forEach((assignment) => {
          assignment.team.jiraBoards.forEach((board) => {
            board.projects.forEach((project) => {
              project.activities.forEach((activity) => {
                const activityDate = new Date(activity.activityDate);
                const dateKey = format(activityDate, "yyyy-MM-dd");

                // Only include activities that fall within the current week
                // and are on working days (not weekends or holidays)
                // and the employee is not on leave for that day
                const isOnLeave = !!leaveMap.get(dateKey)?.get(employee.id);

                if (
                  activityDate >= weekStart &&
                  activityDate <= weekEnd &&
                  !isWeekend(activityDate) &&
                  !holidays.isHoliday(activityDate) &&
                  !isOnLeave
                ) {
                  // Create a unique key for project-date combination
                  const projectDateKey = `${project.id}-${dateKey}`;

                  // Only add if this project-date combination hasn't been seen before
                  if (!uniqueProjectDates.has(projectDateKey)) {
                    uniqueProjectDates.set(projectDateKey, true);
                    weekProjectActivities.push({
                      date: dateKey,
                      projectId: project.id,
                      projectName: project.name,
                      teamName: assignment.team.name,
                      isCapDev: project.isCapDev,
                      jiraId: activity.jiraIssueId,
                    });
                  }
                }
              });
            });
          });
        });

        // If there are project activities, distribute remaining hours evenly
        if (weekProjectActivities.length > 0) {
          const hoursPerActivity =
            totalRemainingHours / weekProjectActivities.length;

          weekProjectActivities.forEach((activity) => {
            // Double-check that this day is not a leave day before adding the activity
            const isOnLeave = !!leaveMap.get(activity.date)?.get(employee.id);
            if (isOnLeave) {
              return; // Skip this activity
            }

            report.timeEntries.push({
              id: `${employee.id}-${activity.date}-${activity.projectId}`,
              hours: hoursPerActivity,
              timeTypeId: timeTypes.find((t) => !t.isCapDev)?.id ?? "",
              isCapDev: activity.isCapDev,
              date: activity.date,
              activityDate: activity.date,
              projectId: activity.projectId,
              projectName: activity.projectName,
              teamName: activity.teamName,
              jiraId: activity.jiraId,
              jiraUrl: `https://jira.example.com/browse/${activity.jiraId}`,
            });
            report.fullHours += hoursPerActivity;
          });
        }

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
    timeTypes,
    generalAssignments,
  };
}
