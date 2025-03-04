"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getToken, hasValidToken } from "@/lib/session";
import { fetchLeaveRecords } from "@/utils/ipayroll";

export async function getLeaveRecords() {
  const leaveRecords = await prisma.leave.findMany({
    include: {
      employee: true,
    },
  });
  return leaveRecords.map((record) => ({
    ...record,
    date: record.date.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    employee: {
      ...record.employee,
      createdAt: record.employee.createdAt.toISOString(),
      updatedAt: record.employee.updatedAt.toISOString(),
    },
  }));
}

export async function syncLeaveRecords() {
  console.log("[Leave] Starting leave records sync");
  try {
    // Check if we have a valid token
    console.log("[Leave] Checking for valid token");
    if (!hasValidToken()) {
      console.log("[Leave] No valid token found, authentication required");
      // Return auth URL if no valid token
      return {
        error: "Authentication required",
        authUrl: "/api/ipayroll/auth?callbackUrl=/data/leave",
      };
    }

    // Get the token and fetch leave records directly
    console.log("[Leave] Token valid, fetching leave requests");
    const token = getToken()!;
    const ipayrollRecords = await fetchLeaveRecords(token);
    console.log(
      `[Leave] Fetched ${ipayrollRecords.length} leave requests from iPayroll`
    );

    // Get all employees to map payrollId to internal id
    console.log("[Leave] Fetching employees to map payrollId to internal id");
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        payrollId: true,
      },
    });

    // Create a map of payrollId to internal id
    const employeeMap = new Map(
      employees.map((emp) => [emp.payrollId, emp.id])
    );

    // Update or create leave records from iPayroll
    console.log("[Leave] Processing and saving leave requests to database");
    const results = [];

    for (const record of ipayrollRecords) {
      console.log(
        `[Leave] Processing leave request for employee: ${record.employeeId}, from ${record.startDate} to ${record.endDate}`
      );

      // Find the internal employee id
      const internalEmployeeId = employeeMap.get(record.employeeId);
      if (!internalEmployeeId) {
        console.warn(
          `[Leave] Employee with payrollId ${record.employeeId} not found in database, skipping leave request`
        );
        continue;
      }

      try {
        // Create a unique ID for the leave record
        const leaveId = `${record.id}`;

        // Create or update the leave record
        const result = await prisma.leave.upsert({
          where: {
            id: leaveId,
          },
          update: {
            type: record.type,
            status: record.status,
            duration: record.hours,
            date: new Date(record.startDate), // Using startDate as the primary date
            updatedAt: new Date(),
          },
          create: {
            id: leaveId,
            date: new Date(record.startDate),
            type: record.type,
            status: record.status,
            duration: record.hours,
            employeeId: internalEmployeeId,
          },
        });

        console.log(`[Leave] Successfully saved leave request: ${leaveId}`);
        results.push(result);
      } catch (error) {
        console.error(
          `[Leave] Error saving leave request for employee ${record.employeeId}:`,
          error
        );
        // Continue processing other records even if one fails
      }
    }

    console.log(
      `[Leave] Sync completed successfully. Saved ${results.length} leave requests.`
    );
    revalidatePath("/data/leave");
    return { success: true, count: results.length };
  } catch (error) {
    console.error("[Leave] Failed to sync leave requests:", error);
    return { success: false, error: "Failed to sync leave requests" };
  }
}
