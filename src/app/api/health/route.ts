import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = new Date().toISOString();
  console.log(`[HEALTH CHECK] Health check endpoint called at ${timestamp}`);
  console.log(`[HEALTH CHECK] This log confirms the endpoint was called`);

  return NextResponse.json(
    {
      status: "healthy",
      timestamp,
      message: "Health check endpoint is working correctly",
    },
    { status: 200 }
  );
}
