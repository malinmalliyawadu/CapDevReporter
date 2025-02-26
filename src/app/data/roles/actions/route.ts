import { NextRequest, NextResponse } from "next/server";
import { clearRolesForTesting, createEmployeeForTesting } from "../actions";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const action = formData.get("action");

  if (action === "clearRolesForTesting") {
    const result = await clearRolesForTesting();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "createEmployeeForTesting") {
    const name = formData.get("name") as string;
    const roleId = formData.get("roleId") as string;
    const payrollId = formData.get("payrollId") as string;

    if (!name || !roleId || !payrollId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createEmployeeForTesting({
      name,
      roleId,
      payrollId,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result.data);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
