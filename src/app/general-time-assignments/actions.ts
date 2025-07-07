"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

type CreateAssignmentResult =
  | {
      success: true;
      data: {
        id: string;
        roleId: string;
        timeTypeId: string;
        hoursPerWeek: number;
        timeType: {
          id: string;
          name: string;
          description: string | null;
        };
      };
    }
  | { success: false; error: string };

type DeleteAssignmentResult =
  | { success: true }
  | { success: false; error: string };

export async function createAssignment(data: {
  roleId: string;
  timeTypeId: string;
  hoursPerWeek: number;
}): Promise<CreateAssignmentResult> {
  try {
    // Validate input
    if (!data.roleId || !data.timeTypeId || data.hoursPerWeek <= 0) {
      return {
        success: false,
        error: "Role ID, time type ID, and hours per week are required",
      };
    }

    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      return { success: false, error: "Role not found" };
    }

    // Check if time type exists
    const timeType = await prisma.timeType.findUnique({
      where: { id: data.timeTypeId },
    });

    if (!timeType) {
      return { success: false, error: "Time type not found" };
    }

    // Create assignment
    const assignment = await prisma.generalTimeAssignment.create({
      data: {
        roleId: data.roleId,
        timeTypeId: data.timeTypeId,
        hoursPerWeek: data.hoursPerWeek,
      },
      include: {
        timeType: true,
      },
    });

    revalidatePath("/general-time-assignments");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Failed to create assignment:", error);

    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "This time type is already assigned to this role",
        };
      }
    }

    return { success: false, error: "Failed to create assignment" };
  }
}

export async function deleteAssignment(
  id: string
): Promise<DeleteAssignmentResult> {
  try {
    if (!id) {
      return { success: false, error: "Assignment ID is required" };
    }

    // Check if assignment exists
    const assignment = await prisma.generalTimeAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Delete assignment
    await prisma.generalTimeAssignment.delete({
      where: { id },
    });

    revalidatePath("/general-time-assignments");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete assignment:", error);
    return { success: false, error: "Failed to delete assignment" };
  }
}

export async function updateAssignment(
  id: string,
  hoursPerWeek: number
): Promise<CreateAssignmentResult> {
  try {
    // Validate input
    if (!id || hoursPerWeek <= 0) {
      return {
        success: false,
        error: "Assignment ID and hours per week are required",
      };
    }

    // Check if assignment exists
    const existingAssignment = await prisma.generalTimeAssignment.findUnique({
      where: { id },
    });

    if (!existingAssignment) {
      return { success: false, error: "Assignment not found" };
    }

    // Update assignment
    const assignment = await prisma.generalTimeAssignment.update({
      where: { id },
      data: { hoursPerWeek },
      include: {
        timeType: true,
      },
    });

    revalidatePath("/general-time-assignments");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Failed to update assignment:", error);
    return { success: false, error: "Failed to update assignment" };
  }
}
