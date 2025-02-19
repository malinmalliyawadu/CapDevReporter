import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { hoursPerWeek } = await request.json();

    // Validate input
    if (
      typeof hoursPerWeek !== "number" ||
      hoursPerWeek < 0 ||
      hoursPerWeek > 168
    ) {
      return NextResponse.json(
        { error: "Invalid hours per week" },
        { status: 400 }
      );
    }

    // Update employee
    const employee = await prisma.employee.update({
      where: { id },
      data: { hoursPerWeek },
      include: { role: true },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update employee hours" },
      { status: 500 }
    );
  }
}
