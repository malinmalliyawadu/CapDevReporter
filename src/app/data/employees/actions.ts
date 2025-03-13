"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getToken, hasValidToken } from "@/lib/session";
import { fetchEmployees } from "@/utils/ipayroll";

export async function getEmployees() {
  return prisma.employee.findMany({
    include: {
      role: true,
    },
  });
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
        authUrl: "/api/ipayroll/auth?callbackUrl=/data/employees",
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

    const results = [];
    const roleCache = new Map<string, string>(); // Cache for role id by name

    // For each employee, create or update in the database
    for (const employee of employees) {
      console.log(
        `[Employees] Processing employee: ${employee.id} - ${employee.firstName} ${employee.lastName}`
      );

      try {
        // Determine the role based on the employee's title
        let roleId = "";

        if (employee.title) {
          const roleName = employee.title.trim();

          // Check if we've already processed this role
          if (roleCache.has(roleName)) {
            roleId = roleCache.get(roleName)!;
          } else {
            // Try to find or create the role
            console.log(`[Employees] Upserting role: ${roleName}`);
            const role = await prisma.role.upsert({
              where: { name: roleName },
              update: {}, // No updates needed
              create: {
                name: roleName,
                description: `Role imported from iPayroll: ${roleName}`,
              },
            });

            roleId = role.id;
            roleCache.set(roleName, roleId);
            console.log(`[Employees] Role upserted: ${roleName} (${roleId})`);
          }
        } else {
          console.log(
            `[Employees] No title found for employee, using default role: Employee`
          );
        }

        // Use upsert to create or update the employee
        const result = await prisma.employee.upsert({
          where: { payrollId: employee.employeeId },
          update: {
            name: `${employee.firstName} ${employee.lastName}`.trim(),
            hoursPerWeek: employee.fullTimeHoursWeek,
            roleId: roleId, // Use the determined role
            updatedAt: new Date(),
          },
          create: {
            name: `${employee.firstName} ${employee.lastName}`.trim(),
            payrollId: employee.employeeId,
            hoursPerWeek: employee.fullTimeHoursWeek,
            roleId: roleId, // Use the determined role
          },
        });

        console.log(`[Employees] Saved employee: ${result.id}`);
        results.push(result);
      } catch (error) {
        console.error(
          `[Employees] Error saving employee ${employee.employeeId}:`,
          error
        );
      }
    }

    const timestamp = new Date().toISOString();
    console.log(
      `[Employees] Sync completed at ${timestamp}. Saved ${results.length} employees.`
    );
    revalidatePath("/data/employees");
    return { data: { timestamp, count: results.length } };
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
