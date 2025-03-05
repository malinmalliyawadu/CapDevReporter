import axios from "axios";
import { OAuthConfig, TokenResponse, StoredToken } from "./types";

// Validate iPayroll configuration
export const validateIPayrollConfig = (): OAuthConfig => {
  console.log("[iPayroll] Validating OAuth configuration");

  // Get configuration from environment variables
  const clientId = process.env.IPAYROLL_CLIENT_ID;
  const clientSecret = process.env.IPAYROLL_CLIENT_SECRET;
  const redirectUri = process.env.IPAYROLL_REDIRECT_URI;
  const authorizationEndpoint = process.env.IPAYROLL_AUTH_ENDPOINT;
  const tokenEndpoint = process.env.IPAYROLL_TOKEN_ENDPOINT;
  const scope = "customfields employees leaverequests parentalleaves";

  // Validate required configuration
  if (!clientId) {
    throw new Error("IPAYROLL_CLIENT_ID is required");
  }
  if (!clientSecret) {
    throw new Error("IPAYROLL_CLIENT_SECRET is required");
  }
  if (!redirectUri) {
    throw new Error("IPAYROLL_REDIRECT_URI is required");
  }
  if (!authorizationEndpoint) {
    throw new Error("IPAYROLL_AUTH_ENDPOINT is required");
  }
  if (!tokenEndpoint) {
    throw new Error("IPAYROLL_TOKEN_ENDPOINT is required");
  }
  if (!scope) {
    throw new Error("IPAYROLL_SCOPE is required");
  }

  console.log("[iPayroll] OAuth configuration is valid");
  return {
    clientId,
    clientSecret,
    redirectUri,
    authorizationEndpoint,
    tokenEndpoint,
    scope,
  };
};

// Generate authorization URL
export const getAuthorizationUrl = (state?: string): string => {
  console.log("[iPayroll] Generating authorization URL");
  try {
    const config = validateIPayrollConfig();

    // Generate a state if one wasn't provided
    const generatedState = state || generateRandomState();
    console.log(
      `[iPayroll] Using state: ${generatedState.substring(0, 10)}...`
    );

    // Create the URL parameters according to iPayroll documentation
    const params = new URLSearchParams({
      response_type: "code",
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state: generatedState,
    });

    const authUrl = `${config.authorizationEndpoint}?${params.toString()}`;
    console.log(`[iPayroll] Authorization URL generated: ${authUrl}`);
    return authUrl;
  } catch (error) {
    console.error("[iPayroll] Error generating authorization URL:", error);
    throw error;
  }
};

// Generate a random state parameter for CSRF protection
export const generateRandomState = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Exchange authorization code for tokens
export const exchangeCodeForTokens = async (
  code: string
): Promise<StoredToken> => {
  console.log(
    `[iPayroll] Exchanging authorization code for tokens: ${code.substring(
      0,
      5
    )}...`
  );
  const config = validateIPayrollConfig();

  try {
    console.log(`[iPayroll] Making token request to: ${config.tokenEndpoint}`);
    console.log(`[iPayroll] Using redirect URI: ${config.redirectUri}`);

    const response = await axios.post<TokenResponse>(
      config.tokenEndpoint,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("[iPayroll] Token exchange successful");
    console.log(`[iPayroll] Token type: ${response.data.token_type}`);
    console.log(`[iPayroll] Expires in: ${response.data.expires_in} seconds`);

    // Calculate expiration time
    const expiresAt = Date.now() + response.data.expires_in * 1000;

    // Return the stored token
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt,
      tokenType: response.data.token_type,
    };
  } catch (error) {
    console.error("[iPayroll] Failed to exchange code for tokens:", error);
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
    }
    throw error;
  }
};

// Refresh access token
export const refreshAccessToken = async (
  refreshToken: string
): Promise<StoredToken> => {
  console.log("[iPayroll] Refreshing access token");
  const config = validateIPayrollConfig();

  try {
    console.log(
      `[iPayroll] Making refresh token request to: ${config.tokenEndpoint}`
    );

    const response = await axios.post<TokenResponse>(
      config.tokenEndpoint,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("[iPayroll] Token refresh successful");
    console.log(`[iPayroll] Token type: ${response.data.token_type}`);
    console.log(`[iPayroll] Expires in: ${response.data.expires_in} seconds`);

    // Calculate expiration time
    const expiresAt = Date.now() + response.data.expires_in * 1000;

    // Return the stored token
    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt,
      tokenType: response.data.token_type,
    };
  } catch (error) {
    console.error("[iPayroll] Failed to refresh access token:", error);
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
    }
    throw error;
  }
};
