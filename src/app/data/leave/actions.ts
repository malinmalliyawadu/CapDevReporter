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
        authUrl: "/api/auth/ipayroll?callbackUrl=/data/leave",
      };
    }

    // Get the token and fetch leave records directly
    console.log("[Leave] Token valid, fetching leave records");
    const token = getToken()!;
    const ipayrollRecords = await fetchLeaveRecords(token);
    console.log(
      `[Leave] Fetched ${ipayrollRecords.length} leave records from iPayroll`
    );

    // Update or create leave records from iPayroll
    console.log("[Leave] Processing and saving leave records to database");
    for (const record of ipayrollRecords) {
      console.log(
        `[Leave] Processing leave record for employee: ${record.employeeId}, date: ${record.date}`
      );
      try {
        await prisma.leave.upsert({
          where: {
            id: `${record.employeeId}-${record.date}`, // Composite unique identifier
          },
          update: {
            type: record.type,
            status: record.status,
            duration: record.duration,
          },
          create: {
            id: `${record.employeeId}-${record.date}`,
            date: new Date(record.date),
            type: record.type,
            status: record.status,
            duration: record.duration,
            employeeId: record.employeeId,
          },
        });
        console.log(
          `[Leave] Successfully saved leave record: ${record.employeeId}-${record.date}`
        );
      } catch (error) {
        console.error(
          `[Leave] Error saving leave record ${record.employeeId}-${record.date}:`,
          error
        );
        // Continue processing other records even if one fails
      }
    }

    console.log("[Leave] Sync completed successfully");
    revalidatePath("/data/leave");
    return { success: true };
  } catch (error) {
    console.error("[Leave] Failed to sync leave records:", error);
    return { success: false, error: "Failed to sync leave records" };
  }
}
