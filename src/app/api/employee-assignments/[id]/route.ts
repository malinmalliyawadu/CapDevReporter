import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { startDate, endDate } = await request.json();

    // Validate input
    if (!startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.employeeAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check for overlapping assignments
    const overlappingAssignment = await prisma.employeeAssignment.findFirst({
      where: {
        employeeId: existingAssignment.employeeId,
        NOT: { id },
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

    // Update assignment
    const assignment = await prisma.employeeAssignment.update({
      where: { id },
      data: {
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        team: true,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Failed to update assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;

    // Check if assignment exists
    const assignment = await prisma.employeeAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.employeeAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
