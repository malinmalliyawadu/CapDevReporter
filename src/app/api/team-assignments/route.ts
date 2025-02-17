import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        team: true,
        role: true,
      },
    });

    const teams = await prisma.team.findMany();

    return NextResponse.json({ employees, teams });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch team assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, teamId } = await request.json();

    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        teamId,
      },
      include: {
        team: true,
        role: true,
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update team assignment" },
      { status: 500 }
    );
  }
}
