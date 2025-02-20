import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  startOfYear,
  format,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isWeekend,
} from "date-fns";
import Holidays from "date-holidays";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("from")
    ? new Date(searchParams.get("from")!)
    : startOfYear(new Date());
  const to = searchParams.get("to")
    ? new Date(searchParams.get("to")!)
    : new Date();
  const teamId = searchParams.get("team");
  const roleId = searchParams.get("role");
  const search = searchParams.get("search");

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
                  projects: true,
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

  // Get general time assignments
  const generalAssignments = await prisma.generalTimeAssignment.findMany({
    include: {
      timeType: true,
    },
  });

  // Get all time types for the UI
  const timeTypes = await prisma.timeType.findMany();
  const teams = await prisma.team.findMany();
  const roles = await prisma.role.findMany();

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
  const timeReports = await Promise.all(
    employees.map(async (employee) => {
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
          const report = {
            id: reportKey,
            employeeId: employee.id,
            employeeName: employee.name,
            week: weekKey,
            weekStart: format(weekStart, "yyyy-MM-dd"),
            weekEnd: format(weekEnd, "yyyy-MM-dd"),
            payrollId: employee.payrollId,
            fullHours: 0,
            expectedHours: availableHours,
            isUnderutilized: false,
            missingHours: 0,
            underutilizationReason: "",
            team:
              weekAssignments.length > 0
                ? weekAssignments.map((wa) => wa.team.name).join(", ")
                : "Unassigned",
            role: employee.role.name,
            roleId: employee.role.id,
            timeEntries: [] as Array<{
              id: string;
              hours: number;
              timeTypeId: string;
              isCapDev: boolean;
              isLeave?: boolean;
              leaveType?: string;
              projectId?: string;
              projectName?: string;
              jiraId?: string;
              jiraUrl?: string;
              isPublicHoliday?: boolean;
              publicHolidayName?: string;
              date: string;
              teamName?: string;
              dateRange?: {
                start: string;
                end: string;
              };
              activityDate: string;
            }>,
          };

          // Check if hours per week is set
          if (employee.hoursPerWeek === 0) {
            report.isUnderutilized = true;
            report.expectedHours = 0;
            report.missingHours = 0;
            report.underutilizationReason = "Hours per week not set";
            return report;
          }

          // Process each day for leave and public holidays
          let leaveDays = 0;
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
              leaveDays++;
            }
          });

          // Calculate the proportion of the week available for role assignments
          const workingDaysExcludingLeave = workingDays - leaveDays;
          const roleAssignmentRatio = workingDaysExcludingLeave / workingDays;

          // Add role assignments at their adjusted weekly rate
          const roleAssignments = generalAssignments.filter(
            (a) => a.roleId === employee.roleId
          );

          roleAssignments.forEach((assignment) => {
            const adjustedHours = assignment.hoursPerWeek * roleAssignmentRatio;
            if (adjustedHours <= 0) return;

            report.timeEntries.push({
              id: `${employee.id}-${weekKey}-${assignment.timeTypeId}`,
              hours: adjustedHours,
              timeTypeId: assignment.timeTypeId,
              isCapDev: assignment.timeType.isCapDev,
              date: weekKey,
              activityDate: weekKey,
              dateRange: {
                start: format(weekStart, "yyyy-MM-dd"),
                end: format(weekEnd, "yyyy-MM-dd"),
              },
            });
            report.fullHours += adjustedHours;
          });

          // Calculate remaining hours after role assignments, accounting for leave
          const totalAssignedHours = roleAssignments.reduce(
            (sum, a) => sum + a.hoursPerWeek,
            0
          );
          const remainingHours = Math.max(
            0,
            (availableHours - totalAssignedHours) * roleAssignmentRatio
          );

          // If there are remaining hours and employee has team assignments, distribute them among team projects
          if (
            remainingHours > 0 &&
            weekAssignments.length > 0 &&
            weekAssignments.some((assignment) =>
              assignment.team.jiraBoards.some(
                (board) => board.projects.length > 0
              )
            )
          ) {
            // Get projects from all boards of all assigned teams
            const allProjects = weekAssignments.flatMap((assignment) =>
              assignment.team.jiraBoards.flatMap((board) => board.projects)
            );

            if (allProjects.length === 0) {
              report.isUnderutilized = true;
              report.missingHours = remainingHours;
              report.underutilizationReason =
                "No active projects in teams' boards";
              return report;
            }

            // Fetch project activities for this week
            const projectActivities = await prisma.projectActivity.findMany({
              where: {
                jiraIssueId: {
                  in: allProjects.map((p) => p.jiraId),
                },
                activityDate: {
                  gte: weekStart,
                  lte: weekEnd,
                },
              },
              orderBy: {
                activityDate: "desc",
              },
            });

            // Only include projects that have activity during this week
            const activeProjects = allProjects.filter((project) =>
              projectActivities.some(
                (activity) => activity.jiraIssueId === project.jiraId
              )
            );

            if (activeProjects.length === 0) {
              report.isUnderutilized = true;
              report.missingHours = remainingHours;
              report.underutilizationReason = "No project activity this week";
              return report;
            }

            // Create a map of project jiraId to most recent activity date
            const projectActivityMap = new Map<string, Date>();
            projectActivities.forEach((activity) => {
              if (!projectActivityMap.has(activity.jiraIssueId)) {
                projectActivityMap.set(
                  activity.jiraIssueId,
                  activity.activityDate
                );
              }
            });

            let remainingToDistribute = remainingHours;
            const baseHoursPerProject = remainingHours / activeProjects.length;

            // Distribute hours evenly among projects
            activeProjects.forEach((project, index) => {
              // Find which team this project belongs to
              const teamAssignment = weekAssignments.find((wa) =>
                wa.team.jiraBoards.some((board) =>
                  board.projects.some((p) => p.id === project.id)
                )
              );
              const teamName = teamAssignment?.team.name ?? "Unknown Team";

              // Get the most recent activity date for this project in the week, or use week start if none found
              const activityDate = projectActivityMap.has(project.jiraId)
                ? format(projectActivityMap.get(project.jiraId)!, "yyyy-MM-dd")
                : format(weekStart, "yyyy-MM-dd");

              if (index === activeProjects.length - 1) {
                // Last project gets any remaining hours to ensure we total exactly to remainingHours
                report.timeEntries.push({
                  id: `${employee.id}-${weekKey}-${project.id}`,
                  hours: remainingToDistribute,
                  timeTypeId: project.isCapDev
                    ? timeTypes.find((t) => t.name === "Development")?.id ?? ""
                    : timeTypes.find((t) => t.name === "Maintenance")?.id ?? "",
                  isCapDev: project.isCapDev,
                  projectId: project.id,
                  projectName: project.name,
                  jiraId: project.jiraId,
                  jiraUrl: `${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${project.jiraId}`,
                  date: weekKey,
                  activityDate,
                  teamName,
                });
                report.fullHours += remainingToDistribute;
              } else {
                // Round to nearest quarter hour for all other projects
                const roundedHours = Math.round(baseHoursPerProject * 4) / 4;

                report.timeEntries.push({
                  id: `${employee.id}-${weekKey}-${project.id}`,
                  hours: roundedHours,
                  timeTypeId: project.isCapDev
                    ? timeTypes.find((t) => t.name === "Development")?.id ?? ""
                    : timeTypes.find((t) => t.name === "Maintenance")?.id ?? "",
                  isCapDev: project.isCapDev,
                  projectId: project.id,
                  projectName: project.name,
                  jiraId: project.jiraId,
                  jiraUrl: `${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${project.jiraId}`,
                  date: weekKey,
                  activityDate,
                  teamName,
                  dateRange: {
                    start: format(weekStart, "yyyy-MM-dd"),
                    end: format(weekEnd, "yyyy-MM-dd"),
                  },
                });

                remainingToDistribute -= roundedHours;
                report.fullHours += roundedHours;
              }
            });
          } else if (remainingHours > 0) {
            report.isUnderutilized = true;
            report.missingHours = remainingHours;
            report.underutilizationReason =
              weekAssignments.length === 0
                ? "No team assignment for this period"
                : "No active projects in teams' boards";
          }

          // After all time entries are added, check if we met the expected hours
          report.isUnderutilized = report.fullHours < report.expectedHours;
          report.missingHours = Math.max(
            0,
            report.expectedHours - report.fullHours
          );
          if (report.isUnderutilized && !report.underutilizationReason) {
            report.underutilizationReason = "Insufficient hours allocated";
          }

          return report;
        })
      );

      return employeeReports;
    })
  );

  return NextResponse.json({
    timeReports: timeReports.flat(),
    timeTypes,
    teams,
    roles,
    generalAssignments,
  });
}
