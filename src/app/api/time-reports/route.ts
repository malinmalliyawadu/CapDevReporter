import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek } from "date-fns";

export async function GET() {
  try {
    // Get all time entries with their related data
    const timeEntries = await prisma.timeEntry.findMany({
      include: {
        user: true,
        project: {
          include: {
            team: true,
          },
        },
        timeType: true,
      },
    });

    // Group time entries by user and week
    const timeReports = timeEntries.reduce((reports: any[], entry) => {
      const week = startOfWeek(entry.date).toISOString();
      const userWeekKey = `${entry.userId}-${week}`;

      const existingReport = reports.find(
        (r) => r.userId === entry.userId && r.week === week
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
          id: userWeekKey,
          userId: entry.userId,
          user: entry.user.name,
          week: week,
          payrollId: entry.user.email, // Using email as payroll ID for now
          fullHours: entry.hours,
          team: entry.project.team.name,
          role: "Member", // You might want to add role to the User model
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
    const timeTypes = await prisma.timeType.findMany();

    // Get teams for filtering
    const teams = await prisma.team.findMany();

    // Get roles for filtering
    const roles = await prisma.role.findMany();

    return NextResponse.json({
      timeReports,
      timeTypes,
      teams,
      roles,
    });
  } catch (error) {
    console.error("Failed to fetch time reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch time reports" },
      { status: 500 }
    );
  }
}
