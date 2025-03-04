import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/utils/ipayroll";
import { validateState, saveToken } from "@/lib/session";

// Handler for GET requests to /api/auth/ipayroll/callback
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log("[API] Processing iPayroll OAuth callback");
  try {
    // Get the URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log(
      `[API] iPayroll callback parameters - code: ${
        code ? "present" : "missing"
      }, state: ${state ? state.substring(0, 10) + "..." : "missing"}, error: ${
        error || "none"
      }`
    );

    // Check if there was an error from the OAuth server
    if (error) {
      console.error(`[API] iPayroll OAuth server returned an error: ${error}`);
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      console.error(
        `[API] Missing required parameters - code: ${!!code}, state: ${!!state}`
      );
      return NextResponse.redirect(
        new URL("/?error=missing_parameters", request.url)
      );
    }

    // Log the full state for debugging
    console.log(`[API] Full state received: ${state}`);

    // Validate the state parameter to prevent CSRF attacks
    console.log(`[API] Validating state: ${state.substring(0, 10)}...`);
    const isValidState = await validateState(state);
    if (!isValidState) {
      console.error(
        `[API] Invalid state parameter: ${state.substring(0, 10)}...`
      );

      // For debugging purposes, redirect to a more specific error page
      return NextResponse.redirect(
        new URL(
          `/?error=invalid_state&state=${encodeURIComponent(
            state.substring(0, 10)
          )}`,
          request.url
        )
      );
    }

    // Extract the callback URL from the state (if it exists)
    let callbackUrl = "/";
    const stateParts = state.split(":");
    if (stateParts.length > 1) {
      callbackUrl = stateParts.slice(1).join(":");
      console.log(`[API] Extracted callback URL from state: ${callbackUrl}`);
    } else {
      console.log(`[API] No callback URL found in state, using default: /`);
    }

    // Exchange the authorization code for tokens
    console.log(
      `[API] Exchanging code for iPayroll tokens: ${code.substring(0, 5)}...`
    );
    const token = await exchangeCodeForTokens(code);
    console.log(
      `[API] Received iPayroll tokens, expires at: ${new Date(
        token.expiresAt
      ).toISOString()}`
    );

    // Save the token in server-side storage
    console.log("[API] Saving iPayroll tokens to session");
    saveToken(token);

    // Redirect to the callback URL
    console.log(`[API] Redirecting to: ${callbackUrl}`);
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  } catch (error) {
    console.error("[API] Failed to process iPayroll OAuth callback:", error);

    // Redirect to home with error
    return NextResponse.redirect(
      new URL("/?error=ipayroll_callback_failed", request.url)
    );
  }
}
