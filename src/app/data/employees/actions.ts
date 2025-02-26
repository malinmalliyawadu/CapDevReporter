"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        role: true,
      },
    });
    return { data: employees };
  } catch (error) {
    console.error(error);
    return { error: "Failed to fetch employees" };
  }
}

export async function syncEmployees() {
  try {
    // TODO: Implement iPayroll integration
    // For now, just return success
    const timestamp = new Date().toISOString();
    revalidatePath("/data/employees");
    return { data: { timestamp } };
  } catch (error) {
    console.error(error);
    return { error: "Failed to sync employees" };
  }
}

export async function updateEmployeeHours(id: string, hoursPerWeek: number) {
  try {
    if (!id) {
      return { error: "ID is required" };
    }

    // Validate input
    if (
      typeof hoursPerWeek !== "number" ||
      hoursPerWeek < 0 ||
      hoursPerWeek > 168
    ) {
      return { error: "Invalid hours per week" };
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: { hoursPerWeek },
      include: { role: true },
    });

    revalidatePath("/data/employees");
    return { data: employee };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update employee hours" };
  }
}
