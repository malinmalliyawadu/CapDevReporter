import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  isWeekend,
} from "date-fns";
import Holidays from "date-holidays";
import {
  type TimeEntry,
  type Employee,
  type Project,
  type Team,
  type TimeType,
  type Role,
} from "@prisma/client";

// Initialize holidays for New Zealand
const holidays = new Holidays("NZ", "WGN");

interface TimeEntryWithRelations extends TimeEntry {
  employee: Employee & {
    role: Role;
    team: Team;
  };
  project: {
    team: Team;
  };
  timeType: TimeType;
}

interface TimeReportEntry {
  id: string;
  hours: number;
  timeTypeId: string;
  isCapDev: boolean;
  isLeave?: boolean;
  leaveType?: string;
  isPublicHoliday?: boolean;
  publicHolidayName?: string;
}

interface TimeReport {
  id: string;
  employeeId: string;
  employeeName: string;
  week: string;
  payrollId: string;
  fullHours: number;
  team: string;
  role: string;
  timeEntries: TimeReportEntry[];
}

export const timeReportsRouter = router({
  getAll: publicProcedure
    .input(
      z.object({
        dateRange: z.object({
          from: z.string(),
          to: z.string(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get all employees with their roles and teams
      const employees = await ctx.prisma.employee.findMany({
        include: {
          role: true,
          team: {
            include: {
              projects: {
                include: {
                  timeEntries: true,
                },
              },
            },
          },
        },
      });

      // Get all leave records
      const leaveRecords = await ctx.prisma.leave.findMany({
        where: {
          status: {
            in: ["TAKEN", "APPROVED"],
          },
        },
        orderBy: {
          date: "desc",
        },
      });

      // Get general time assignments
      const generalAssignments =
        await ctx.prisma.generalTimeAssignment.findMany({
          include: {
            timeType: true,
          },
        });

      // Get all time types for the UI
      const timeTypes = await ctx.prisma.timeType.findMany();
      const teams = await ctx.prisma.team.findMany();
      const roles = await ctx.prisma.role.findMany();

      // Create a map of date -> employee -> leave record
      const leaveMap = new Map<string, Map<string, (typeof leaveRecords)[0]>>();
      leaveRecords.forEach((leave) => {
        const dateKey = format(leave.date, "yyyy-MM-dd");
        if (!leaveMap.has(dateKey)) {
          leaveMap.set(dateKey, new Map());
        }
        leaveMap.get(dateKey)?.set(leave.employeeId, leave);
      });

      // Calculate time reports
      const timeReportMap = new Map<string, any>();

      // Define the date range from input
      const startDate = input.dateRange.from;
      const endDate = input.dateRange.to;

      // Process each employee
      employees.forEach((employee) => {
        // Get general assignments for the employee's role
        const roleAssignments = generalAssignments.filter(
          (assignment) => assignment.roleId === employee.roleId
        );

        // Calculate total assigned hours per week from general assignments
        const totalAssignedHours = roleAssignments.reduce(
          (sum, assignment) => sum + assignment.hoursPerWeek,
          0
        );

        // Get unique weeks in the date range
        const weeks = eachDayOfInterval({
          start: new Date(startDate),
          end: new Date(endDate),
        })
          .map((date) =>
            format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd")
          )
          .filter((value, index, self) => self.indexOf(value) === index);

        // Process each week
        weeks.forEach((weekKey) => {
          const reportKey = `${employee.id}-${weekKey}`;
          const weekStart = new Date(weekKey);
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const daysInWeek = eachDayOfInterval({
            start: weekStart,
            end: weekEnd,
          });

          // Initialize time report
          if (!timeReportMap.has(reportKey)) {
            timeReportMap.set(reportKey, {
              id: reportKey,
              employeeId: employee.id,
              employeeName: employee.name,
              week: weekKey,
              payrollId: employee.payrollId,
              fullHours: 0,
              team: employee.team.name,
              role: employee.role.name,
              timeEntries: [],
            });
          }

          const report = timeReportMap.get(reportKey);

          // Process each day for leave and public holidays
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
                timeTypeId: timeTypes.find((t) => t.name === "Leave")?.id,
                isPublicHoliday: true,
                publicHolidayName: holiday[0].name,
                date: dateKey,
              });
              report.fullHours += 8;
            }
            // Add leave entry
            else if (leaveRecord) {
              report.timeEntries.push({
                id: `${employee.id}-${dateKey}-leave`,
                hours: 8,
                timeTypeId: timeTypes.find((t) => t.name === "Leave")?.id,
                isLeave: true,
                leaveType: leaveRecord.type,
                date: dateKey,
              });
              report.fullHours += 8;
            }
          });

          // Calculate working days (excluding weekends and public holidays)
          const workingDays = daysInWeek.filter((date) => {
            if (isWeekend(date)) return false;
            const dateKey = format(date, "yyyy-MM-dd");
            const holiday = holidays.isHoliday(date);
            const leaveRecord = leaveMap.get(dateKey)?.get(employee.id);
            return !holiday && !leaveRecord;
          }).length;

          // Calculate available hours for work
          const availableHours = workingDays * 8;

          // Add role assignments at their full weekly rate
          roleAssignments.forEach((assignment) => {
            report.timeEntries.push({
              id: `${employee.id}-${weekKey}-${assignment.timeTypeId}`,
              hours: assignment.hoursPerWeek,
              timeTypeId: assignment.timeTypeId,
              isCapDev: assignment.timeType.isCapDev,
              date: weekKey,
            });
            report.fullHours += assignment.hoursPerWeek;
          });

          // Calculate remaining hours after role assignments
          const remainingHours = Math.max(
            0,
            availableHours - totalAssignedHours
          );

          // If there are remaining hours, distribute them among team projects with jitter
          if (remainingHours > 0 && employee.team.projects.length > 0) {
            const projects = employee.team.projects;
            let remainingToDistribute = remainingHours;

            // Calculate base hours per project
            const baseHoursPerProject = remainingHours / projects.length;

            // Distribute hours with jitter for all but the last project
            projects.forEach((project, index) => {
              // For the last project, use all remaining hours to ensure total adds up
              if (index === projects.length - 1) {
                report.timeEntries.push({
                  id: `${employee.id}-${weekKey}-${project.id}`,
                  hours: remainingToDistribute,
                  timeTypeId: project.isCapDev
                    ? timeTypes.find((t) => t.name === "Development")?.id
                    : timeTypes.find((t) => t.name === "Maintenance")?.id,
                  isCapDev: project.isCapDev,
                  projectId: project.id,
                  projectName: project.name,
                  jiraId: project.jiraId,
                  jiraUrl: `${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${project.jiraId}`,
                  date: weekKey,
                });
                report.fullHours += remainingToDistribute;
              } else {
                // Add random variation of ±20% to base hours
                const jitterFactor = 0.8 + Math.random() * 0.4; // Random between 0.8 and 1.2
                const jitteredHours = Math.min(
                  remainingToDistribute,
                  baseHoursPerProject * jitterFactor
                );
                const roundedHours = Math.round(jitteredHours * 4) / 4; // Round to nearest quarter hour

                report.timeEntries.push({
                  id: `${employee.id}-${weekKey}-${project.id}`,
                  hours: roundedHours,
                  timeTypeId: project.isCapDev
                    ? timeTypes.find((t) => t.name === "Development")?.id
                    : timeTypes.find((t) => t.name === "Maintenance")?.id,
                  isCapDev: project.isCapDev,
                  projectId: project.id,
                  projectName: project.name,
                  jiraId: project.jiraId,
                  jiraUrl: `${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${project.jiraId}`,
                  date: weekKey,
                });

                remainingToDistribute -= roundedHours;
                report.fullHours += roundedHours;
              }
            });
          }
        });
      });

      return {
        timeReports: Array.from(timeReportMap.values()),
        timeTypes,
        teams,
        roles,
      };
    }),
});
