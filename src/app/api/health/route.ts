import { NextResponse } from "next/server";

export async function GET() {
  const timestamp = new Date().toISOString();
  console.log(`[HEALTH CHECK] Health check endpoint called at ${timestamp}`);
  console.log("[HEALTH CHECK] Request headers:", JSON.stringify(headers()));

  return NextResponse.json(
    {
      status: "healthy",
      timestamp,
      message: "Health check endpoint is working correctly",
    },
    { status: 200 }
  );
}

// Helper function to get request headers
function headers() {
  try {
    return Object.fromEntries(
      Object.entries(new Headers()).map(([k, v]) => [k, v])
    );
  } catch (e) {
    return { error: "Could not get headers" };
  }
}
