import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbStatus = "unknown";
  let dbMessage = "";

  try {
    // Simple query to check database connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
    dbMessage = "Database connection is working correctly";
  } catch (error) {
    dbStatus = "error";
    dbMessage =
      error instanceof Error ? error.message : "Unknown database error";
    console.error("[Health] Database check failed:", error);
  }

  return NextResponse.json(
    {
      status: "healthy",
      timestamp,
      message: "Health check endpoint is working correctly",
      database: {
        status: dbStatus,
        message: dbMessage,
      },
    },
    { status: 200 }
  );
}
