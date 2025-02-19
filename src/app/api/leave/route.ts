import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const leaveRecords = await prisma.leave.findMany({
      include: {
        employee: true,
      },
    });
    return NextResponse.json(leaveRecords);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch leave records" },
      { status: 500 }
    );
  }
}
