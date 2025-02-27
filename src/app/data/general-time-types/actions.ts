"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTimeType(data: {
  name: string;
  description?: string;
  isCapDev: boolean;
  weeklySchedule?: string | null;
}) {
  try {
    const timeType = await prisma.timeType.create({
      data: {
        name: data.name,
        description: data.description,
        isCapDev: data.isCapDev,
        weeklySchedule: data.weeklySchedule,
      },
    });
    revalidatePath("/data/general-time-types");
    return { success: true, id: timeType.id };
  } catch (error) {
    console.error("Failed to create time type:", error);
    return { success: false, error: "Failed to create time type" };
  }
}

export async function deleteTimeType(id: string) {
  try {
    await prisma.timeType.delete({
      where: { id },
    });
    revalidatePath("/data/general-time-types");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete time type:", error);
    return { success: false, error: "Failed to delete time type" };
  }
}
