import axios, { AxiosInstance } from "axios";

// OAuth 2.0 configuration
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
}

// Token response from OAuth server
interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// Stored token with expiration
export interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

// Validate required environment variables
const validateIPayrollConfig = (): OAuthConfig => {
  const requiredVars = [
    "IPAYROLL_CLIENT_ID",
    "IPAYROLL_CLIENT_SECRET",
    "IPAYROLL_REDIRECT_URI",
    "IPAYROLL_AUTH_ENDPOINT",
    "IPAYROLL_TOKEN_ENDPOINT",
    "IPAYROLL_API_URL",
    "IPAYROLL_SCOPE",
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required iPayroll configuration: ${varName}`);
    }
  }

  return {
    clientId: process.env.IPAYROLL_CLIENT_ID as string,
    clientSecret: process.env.IPAYROLL_CLIENT_SECRET as string,
    redirectUri: process.env.IPAYROLL_REDIRECT_URI as string,
    authorizationEndpoint: process.env.IPAYROLL_AUTH_ENDPOINT as string,
    tokenEndpoint: process.env.IPAYROLL_TOKEN_ENDPOINT as string,
    scope: process.env.IPAYROLL_SCOPE as string,
  };
};

// Generate authorization URL for redirect
export const getAuthorizationUrl = (state?: string): string => {
  console.log("[iPayroll] Generating authorization URL");
  try {
    const config = validateIPayrollConfig();

    // Generate a state if one wasn't provided
    const generatedState = state || generateRandomState();
    console.log(
      `[iPayroll] Using state: ${generatedState.substring(0, 10)}...`
    );

    // Create the URL parameters
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
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("[iPayroll] Token response received:", {
      status: response.status,
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
    });

    const { access_token, refresh_token, expires_in, token_type } =
      response.data;

    // Calculate expiration time (current time + expires_in seconds)
    const expiresAt = Date.now() + expires_in * 1000;
    console.log(
      `[iPayroll] Token will expire at: ${new Date(expiresAt).toISOString()}`
    );

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
      tokenType: token_type,
    };
  } catch (error) {
    console.error("[iPayroll] Failed to exchange code for tokens:", error);
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
      console.error("[iPayroll] Request config:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
    }
    throw new Error("Failed to exchange authorization code for tokens");
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (
  refreshToken: string
): Promise<StoredToken> => {
  console.log(
    `[iPayroll] Refreshing access token using refresh token: ${refreshToken.substring(
      0,
      5
    )}...`
  );
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
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("[iPayroll] Refresh token response received:", {
      status: response.status,
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
      expiresIn: response.data.expires_in,
      tokenType: response.data.token_type,
    });

    const { access_token, refresh_token, expires_in, token_type } =
      response.data;

    // Calculate expiration time (current time + expires_in seconds)
    const expiresAt = Date.now() + expires_in * 1000;
    console.log(
      `[iPayroll] Refreshed token will expire at: ${new Date(
        expiresAt
      ).toISOString()}`
    );

    return {
      accessToken: access_token,
      refreshToken: refresh_token || refreshToken, // Some OAuth servers don't return a new refresh token
      expiresAt,
      tokenType: token_type,
    };
  } catch (error) {
    console.error("[iPayroll] Failed to refresh access token:", error);
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
      console.error("[iPayroll] Request config:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
    }
    throw new Error("Failed to refresh access token");
  }
};

// Create an authenticated API client
export const getIPayrollClient = async (
  storedToken?: StoredToken
): Promise<AxiosInstance> => {
  console.log("[iPayroll] Getting iPayroll API client");

  // If no token is provided, throw an error
  if (!storedToken) {
    console.error("[iPayroll] No authentication token available");
    throw new Error("No authentication token available");
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const isExpired = storedToken.expiresAt <= Date.now() + 5 * 60 * 1000;
  console.log(`[iPayroll] Token expired or about to expire: ${isExpired}`);
  console.log(
    `[iPayroll] Token expires at: ${new Date(
      storedToken.expiresAt
    ).toISOString()}`
  );
  console.log(`[iPayroll] Current time: ${new Date().toISOString()}`);

  // If token is expired, refresh it
  const token = isExpired
    ? await refreshAccessToken(storedToken.refreshToken)
    : storedToken;

  console.log("[iPayroll] Creating API client with token");

  // Create and return Axios instance with authentication header
  return axios.create({
    baseURL: process.env.IPAYROLL_API_URL as string,
    headers: {
      Authorization: `${token.tokenType} ${token.accessToken}`,
      "Content-Type": "application/json",
    },
  });
};

// Interface for employee data from iPayroll
export interface IPayrollEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  status: string;
}

// Interface for leave data from iPayroll
export interface IPayrollLeave {
  employeeId: string;
  date: string;
  type: string;
  status: string;
  duration: number;
}

// Fetch employees from iPayroll API
export async function fetchEmployees(
  token: StoredToken
): Promise<IPayrollEmployee[]> {
  console.log("[iPayroll] Fetching employees");
  try {
    const client = await getIPayrollClient(token);
    console.log("[iPayroll] Making request to /employees endpoint");

    console.log(client.defaults.baseURL);
    const response = await client.get("/api/v1/employees");
    console.log(response.data);
    console.log(`[iPayroll] Received ${response.data.length} employees`);

    return response.data.map((employee: any) => {
      console.log(`[iPayroll] Processing employee: ${employee.id}`);
      return {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        status: employee.status,
      };
    });
  } catch (error) {
    console.error("[iPayroll] Failed to fetch employees from iPayroll:", error);
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
      console.error("[iPayroll] Request config:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
    }
    throw error;
  }
}

// Fetch leave records from iPayroll API
export async function fetchLeaveRecords(
  token: StoredToken
): Promise<IPayrollLeave[]> {
  console.log("[iPayroll] Fetching leave records");
  try {
    const client = await getIPayrollClient(token);
    console.log("[iPayroll] Making request to /leave endpoint");

    const response = await client.get("/leave");
    console.log(`[iPayroll] Received ${response.data.length} leave records`);

    return response.data.map((record: any) => {
      console.log(
        `[iPayroll] Processing leave record for employee: ${record.employeeId}`
      );
      return {
        employeeId: record.employeeId,
        date: record.date,
        type: record.leaveType,
        status: record.status.toUpperCase(),
        duration: record.durationDays,
      };
    });
  } catch (error) {
    console.error(
      "[iPayroll] Failed to fetch leave records from iPayroll:",
      error
    );
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
      console.error("[iPayroll] Request config:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
    }
    throw error;
  }
}
