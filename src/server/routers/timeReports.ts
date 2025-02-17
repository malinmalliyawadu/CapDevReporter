import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import {
  startOfWeek,
  endOfWeek,
  format,
  eachDayOfInterval,
  isWeekend,
} from "date-fns";
import {
  type TimeEntry,
  type Employee,
  type Project,
  type Team,
  type TimeType,
  type Role,
} from "@prisma/client";

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
  getAll: publicProcedure.query(async ({ ctx }) => {
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
    const generalAssignments = await ctx.prisma.generalTimeAssignment.findMany({
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

    // Define the date range (e.g., last month)
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 });
    const endDate = today;

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

      // Process each day in the date range
      eachDayOfInterval({ start: startDate, end: endDate }).forEach((date) => {
        if (isWeekend(date)) return; // Skip weekends

        const dateKey = format(date, "yyyy-MM-dd");
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekKey = format(weekStart, "yyyy-MM-dd");
        const reportKey = `${employee.id}-${weekKey}`;

        // Initialize time report if it doesn't exist
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
        const isOnLeave = leaveMap.get(dateKey)?.has(employee.id);

        if (isOnLeave) {
          // Add leave entry
          const leave = leaveMap.get(dateKey)?.get(employee.id)!;
          report.timeEntries.push({
            id: `${leave.id}-${dateKey}`,
            hours: 40, // Full week of leave
            timeTypeId: "leave",
            isCapDev: false,
            isLeave: true,
            leaveType: leave.type,
            date: dateKey,
          });
          report.fullHours += 40;
        } else {
          // Use the weekly assignments directly
          roleAssignments.forEach((assignment) => {
            report.timeEntries.push({
              id: `${employee.id}-${dateKey}-${assignment.timeTypeId}`,
              hours: assignment.hoursPerWeek,
              timeTypeId: assignment.timeTypeId,
              isCapDev: assignment.timeType.isCapDev,
              date: dateKey,
            });
            report.fullHours += assignment.hoursPerWeek;
          });

          // If there are remaining hours, distribute them among team projects
          const remainingHours = 40 - totalAssignedHours;
          if (remainingHours > 0 && employee.team.projects.length > 0) {
            const hoursPerProject =
              remainingHours / employee.team.projects.length;
            employee.team.projects.forEach((project) => {
              report.timeEntries.push({
                id: `${employee.id}-${dateKey}-${project.id}`,
                hours: hoursPerProject,
                timeTypeId: project.isCapDev
                  ? timeTypes.find((t) => t.name === "Development")?.id
                  : timeTypes.find((t) => t.name === "Maintenance")?.id,
                isCapDev: project.isCapDev,
                projectId: project.id,
                projectName: project.name,
                jiraId: project.jiraId,
                jiraUrl: `${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${project.jiraId}`,
                date: dateKey,
              });
              report.fullHours += hoursPerProject;
            });
          }
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
