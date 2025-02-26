"use server";

import { prisma } from "@/lib/prisma";
import { fetchLeaveRecords } from "@/utils/ipayroll";
import { revalidatePath } from "next/cache";

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
  try {
    const ipayrollRecords = await fetchLeaveRecords();

    // Update or create leave records from iPayroll
    for (const record of ipayrollRecords) {
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
    }

    revalidatePath("/data/leave");
    return { success: true };
  } catch (error) {
    console.error("Failed to sync leave records:", error);
    return { success: false, error: "Failed to sync leave records" };
  }
}
