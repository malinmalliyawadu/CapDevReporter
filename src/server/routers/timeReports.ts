import { startOfWeek } from "date-fns";
import {
  type TimeEntry,
  type Employee,
  type Project,
  type Team,
  type TimeType,
  type Role,
} from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "../api/trpc";

interface TimeEntryWithRelations extends TimeEntry {
  employee: Employee & {
    role: Role;
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

export const timeReportsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const timeEntries = await ctx.prisma.timeEntry.findMany({
      include: {
        employee: {
          include: {
            role: true,
          },
        },
        project: {
          include: {
            team: true,
          },
        },
        timeType: true,
      },
    });

    // Group time entries by employee and week
    const timeReports = (timeEntries as TimeEntryWithRelations[]).reduce<
      TimeReport[]
    >((reports, entry) => {
      const week = startOfWeek(entry.date).toISOString();
      const employeeWeekKey = `${entry.employeeId}-${week}`;

      const existingReport = reports.find(
        (r) => r.employeeId === entry.employeeId && r.week === week
      );

      if (existingReport) {
        existingReport.timeEntries.push({
          id: entry.id,
          hours: entry.hours,
          timeTypeId: entry.timeTypeId,
          isCapDev: entry.timeType.isCapDev,
        });
        existingReport.fullHours += entry.hours;
      } else {
        reports.push({
          id: employeeWeekKey,
          employeeId: entry.employeeId,
          employeeName: entry.employee.name,
          week: week,
          payrollId: entry.employee.payrollId,
          fullHours: entry.hours,
          team: entry.project.team.name,
          role: entry.employee.role.name,
          timeEntries: [
            {
              id: entry.id,
              hours: entry.hours,
              timeTypeId: entry.timeTypeId,
              isCapDev: entry.timeType.isCapDev,
            },
          ],
        });
      }

      return reports;
    }, []);

    // Get time types for the UI
    const timeTypes = await ctx.prisma.timeType.findMany();

    // Get teams for filtering
    const teams = await ctx.prisma.team.findMany();

    // Get roles for filtering
    const roles = await ctx.prisma.role.findMany();

    return {
      timeReports,
      timeTypes,
      teams,
      roles,
    };
  }),
});
