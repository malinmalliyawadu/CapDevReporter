import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const assignments = await prisma.generalTimeAssignment.findMany({
      include: {
        role: true,
        timeType: true,
      },
    });

    const roles = await prisma.role.findMany();
    const timeTypes = await prisma.timeType.findMany();

    return NextResponse.json({ assignments, roles, timeTypes });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch general time assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { roleId, timeTypeId, hoursPerWeek } = await request.json();

    const assignment = await prisma.generalTimeAssignment.create({
      data: {
        roleId,
        timeTypeId,
        hoursPerWeek,
      },
      include: {
        role: true,
        timeType: true,
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create general time assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await prisma.generalTimeAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete general time assignment" },
      { status: 500 }
    );
  }
}
