import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const timeTypes = await prisma.timeType.findMany({
      include: {
        timeEntries: true,
        generalAssignments: {
          include: {
            role: true,
          },
        },
      },
    });
    return NextResponse.json(timeTypes);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch time types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, isCapDev } = await request.json();

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Time type name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingTimeType = await prisma.timeType.findFirst({
      where: {
        name: {
          equals: name.trim(),
        },
      },
    });

    if (existingTimeType) {
      return NextResponse.json(
        { error: "A time type with this name already exists" },
        { status: 400 }
      );
    }

    // Create time type
    const timeType = await prisma.timeType.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isCapDev: isCapDev || false,
      },
      include: {
        timeEntries: true,
        generalAssignments: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json(timeType);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
