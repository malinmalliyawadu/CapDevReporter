import { NextRequest, NextResponse } from "next/server";
import { getAuthorizationUrl, generateRandomState } from "@/utils/ipayroll";
import { saveState } from "@/lib/session";

// Handler for GET requests to /api/auth/ipayroll
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("[API] Initiating OAuth flow");
  try {
    // Get the callback URL from the query parameters or use a default
    const searchParams = request.nextUrl.searchParams;
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    console.log(`[API] Callback URL: ${callbackUrl}`);

    // Generate a random state parameter for CSRF protection
    const randomState = generateRandomState();
    console.log(`[API] Generated random state: ${randomState}`);

    // Combine state with callback URL
    const stateWithCallback = `${randomState}:${callbackUrl}`;
    console.log(`[API] Combined state with callback: ${stateWithCallback}`);

    // Save the combined state
    await saveState(stateWithCallback);

    // Get the authorization URL with the combined state parameter
    console.log("[API] Getting authorization URL with combined state");
    const authUrl = getAuthorizationUrl(stateWithCallback);
    console.log(`[API] Authorization URL: ${authUrl}`);

    // Redirect the user to the authorization URL
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[API] Failed to initiate OAuth flow:", error);

    // Return error response
    return NextResponse.json(
      { error: "Failed to initiate OAuth flow" },
      { status: 500 }
    );
  }
}
