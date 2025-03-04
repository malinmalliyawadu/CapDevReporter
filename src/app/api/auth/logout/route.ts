import { NextRequest, NextResponse } from "next/server";
import { deleteToken } from "@/lib/session";

// Handler for GET requests to /api/auth/logout
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("[API] Processing logout request");
  try {
    // Delete the token
    console.log("[API] Deleting token from session");
    deleteToken();

    // Get the redirect URL from the query parameters or use the default
    const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/";
    console.log(`[API] Redirect URL: ${redirectTo}`);

    // Redirect to the specified URL
    console.log(`[API] Redirecting to: ${redirectTo}`);
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (error) {
    console.error("[API] Failed to logout:", error);

    // Redirect to home with error
    return NextResponse.redirect(new URL("/?error=logout_failed", request.url));
  }
}
