import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // Check if time type exists and has no time entries
    const timeType = await prisma.timeType.findUnique({
      where: { id },
      include: { timeEntries: true },
    });

    if (!timeType) {
      return NextResponse.json(
        { error: "Time type not found" },
        { status: 404 }
      );
    }

    if (timeType.timeEntries.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete time type with existing time entries" },
        { status: 400 }
      );
    }

    // Delete time type
    await prisma.timeType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
