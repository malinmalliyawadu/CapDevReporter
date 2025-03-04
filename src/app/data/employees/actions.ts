"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getToken, hasValidToken } from "@/lib/session";
import { fetchEmployees } from "@/utils/ipayroll";

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
  console.log("[Employees] Starting employee sync");
  try {
    // Check if we have a valid token
    console.log("[Employees] Checking for valid token");
    if (!hasValidToken()) {
      console.log("[Employees] No valid token found, authentication required");
      // Return auth URL if no valid token
      return {
        error: "Authentication required",
        authUrl: "/api/auth/ipayroll?callbackUrl=/data/employees",
      };
    }

    // Get the token and fetch employees directly
    console.log("[Employees] Token valid, fetching employees");
    const token = getToken()!;
    const employees = await fetchEmployees(token);
    console.log(
      `[Employees] Fetched ${employees.length} employees from iPayroll`
    );

    // Process and save employees to the database
    console.log("[Employees] Processing and saving employees to database");
    // This is where you would implement the logic to save the data to your database

    // For each employee, you might do something like:
    for (const employee of employees) {
      console.log(
        `[Employees] Processing employee: ${employee.id} - ${employee.firstName} ${employee.lastName}`
      );
      // Implement database operations here
    }

    const timestamp = new Date().toISOString();
    console.log(`[Employees] Sync completed at ${timestamp}`);
    revalidatePath("/data/employees");
    return { data: { timestamp, employees } };
  } catch (error) {
    console.error("[Employees] Failed to sync employees:", error);
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
