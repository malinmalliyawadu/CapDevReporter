import { NextResponse } from "next/server";

export async function POST() {
  try {
    // TODO: Implement iPayroll integration
    // For now, just return success
    return NextResponse.json({ timestamp: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to sync leave records" },
      { status: 500 }
    );
  }
}
