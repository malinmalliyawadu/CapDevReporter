import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if role exists and has no employees
    const role = await prisma.role.findUnique({
      where: { id },
      include: { employees: true },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.employees.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete role with assigned employees" },
        { status: 400 }
      );
    }

    // Delete role
    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
