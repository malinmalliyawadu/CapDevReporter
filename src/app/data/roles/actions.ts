"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createRole(name: string) {
  try {
    // Validate input
    if (!name?.trim()) {
      return { error: "Role name is required" };
    }

    // Check for duplicate role names
    const existingRole = await prisma.role.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingRole) {
      return { error: "Role already exists" };
    }

    // Create role
    const role = await prisma.role.create({
      data: {
        name: name.trim(),
      },
      include: {
        employees: true,
      },
    });

    revalidatePath("/data/roles");
    return { data: role };
  } catch (error) {
    console.error(error);
    return { error: "Failed to create role" };
  }
}

export async function deleteRole(id: string) {
  try {
    if (!id) {
      return { error: "ID is required" };
    }

    // Check if role exists and has no employees
    const role = await prisma.role.findUnique({
      where: { id },
      include: { employees: true },
    });

    if (!role) {
      return { error: "Role not found" };
    }

    if (role.employees.length > 0) {
      return { error: "Cannot delete role with assigned employees" };
    }

    // Delete role
    await prisma.role.delete({
      where: { id },
    });

    revalidatePath("/data/roles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete role" };
  }
}
