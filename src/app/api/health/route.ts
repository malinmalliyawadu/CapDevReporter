import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();

  return NextResponse.json(
    {
      status: "healthy",
      timestamp,
      message: "Health check endpoint is working correctly",
    },
    { status: 200 }
  );
}
