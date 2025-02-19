import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { roleId, timeTypeId, hoursPerWeek } = await request.json();

    // Validate input
    if (!roleId || !timeTypeId || !hoursPerWeek) {
      return NextResponse.json(
        { error: "Role ID, time type ID, and hours per week are required" },
        { status: 400 }
      );
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check if time type exists
    const timeType = await prisma.timeType.findUnique({
      where: { id: timeTypeId },
    });

    if (!timeType) {
      return NextResponse.json(
        { error: "Time type not found" },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.generalTimeAssignment.findFirst({
      where: {
        roleId,
        timeTypeId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "An assignment for this role and time type already exists" },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.generalTimeAssignment.create({
      data: {
        roleId,
        timeTypeId,
        hoursPerWeek,
      },
      include: {
        timeType: true,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Failed to create general time assignment:", error);
    return NextResponse.json(
      { error: "Failed to create general time assignment" },
      { status: 500 }
    );
  }
}
