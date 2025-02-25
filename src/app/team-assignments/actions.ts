"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type CreateAssignmentResult =
  | {
      success: true;
      data: {
        id: string;
        teamId: string;
        employeeId: string;
        startDate: Date;
        endDate: Date | null;
        createdAt: Date;
        updatedAt: Date;
        team: {
          id: string;
          name: string;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
      };
    }
  | { success: false; error: string };

type DeleteAssignmentResult =
  | { success: true }
  | { success: false; error: string };

export async function createAssignment(data: {
  employeeId: string;
  teamId: string;
  startDate: Date;
  endDate: Date | null;
}): Promise<CreateAssignmentResult> {
  try {
    // Validate input
    if (!data.employeeId || !data.teamId || !data.startDate) {
      throw new Error("Employee ID, team ID, and start date are required");
    }

    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });

    if (!employee) {
      throw new Error("Employee not found");
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: data.teamId },
    });

    if (!team) {
      throw new Error("Team not found");
    }

    // Check for overlapping assignments
    const overlappingAssignment = await prisma.employeeAssignment.findFirst({
      where: {
        employeeId: data.employeeId,
        startDate: {
          lte: data.endDate ? data.endDate : new Date("9999-12-31"),
        },
        endDate: {
          gte: data.startDate,
        },
      },
    });

    if (overlappingAssignment) {
      throw new Error("Assignment overlaps with an existing assignment");
    }

    // Create assignment
    const assignment = await prisma.employeeAssignment.create({
      data: {
        employeeId: data.employeeId,
        teamId: data.teamId,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        team: true,
      },
    });

    revalidatePath("/team-assignments");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Failed to create assignment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create assignment",
    };
  }
}

export async function deleteAssignment(
  assignmentId: string
): Promise<DeleteAssignmentResult> {
  try {
    if (!assignmentId) {
      throw new Error("Assignment ID is required");
    }

    // Check if assignment exists
    const assignment = await prisma.employeeAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Delete assignment
    await prisma.employeeAssignment.delete({
      where: { id: assignmentId },
    });

    revalidatePath("/team-assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete assignment",
    };
  }
}
