import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { employeeId, teamId, startDate, endDate } = await request.json();

    // Validate input
    if (!employeeId || !teamId || !startDate) {
      return NextResponse.json(
        { error: "Employee ID, team ID, and start date are required" },
        { status: 400 }
      );
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check for overlapping assignments
    const overlappingAssignment = await prisma.employeeAssignment.findFirst({
      where: {
        employeeId,
        startDate: {
          lte: endDate ? new Date(endDate) : new Date("9999-12-31"),
        },
        endDate: {
          gte: new Date(startDate),
        },
      },
    });

    if (overlappingAssignment) {
      return NextResponse.json(
        { error: "Assignment overlaps with an existing assignment" },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.employeeAssignment.create({
      data: {
        employeeId,
        teamId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
