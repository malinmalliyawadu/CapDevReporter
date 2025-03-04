import axios, { AxiosInstance } from "axios";
import { Prisma } from "@prisma/client";

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

// Validate iPayroll configuration
const validateIPayrollConfig = (): OAuthConfig => {
  console.log("[iPayroll] Validating OAuth configuration");

  // Get configuration from environment variables
  const clientId = process.env.IPAYROLL_CLIENT_ID;
  const clientSecret = process.env.IPAYROLL_CLIENT_SECRET;
  const redirectUri = process.env.IPAYROLL_REDIRECT_URI;
  const authorizationEndpoint = process.env.IPAYROLL_AUTH_ENDPOINT;
  const tokenEndpoint = process.env.IPAYROLL_TOKEN_ENDPOINT;
  const scope = process.env.IPAYROLL_SCOPE;

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

// Get iPayroll API client
export const getIPayrollClient = async (
  storedToken?: StoredToken
): Promise<AxiosInstance> => {
  console.log("[iPayroll] Creating API client");

  // Get API URL from environment variable
  const apiUrl = process.env.IPAYROLL_API_URL;
  if (!apiUrl) {
    throw new Error("IPAYROLL_API_URL is required");
  }

  // Create a new Axios instance
  const client = axios.create({
    baseURL: apiUrl,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // If a token is provided, add it to the request headers
  if (storedToken) {
    console.log("[iPayroll] Adding token to API client");

    // Check if token is expired
    if (storedToken.expiresAt <= Date.now()) {
      console.log("[iPayroll] Token is expired, refreshing");

      // Refresh the token
      const newToken = await refreshAccessToken(storedToken.refreshToken);

      // Update the token in the client
      client.defaults.headers.common[
        "Authorization"
      ] = `${newToken.tokenType} ${newToken.accessToken}`;

      console.log("[iPayroll] Token refreshed and added to API client");

      // Return the client with the new token
      return client;
    }

    // Add the token to the client
    client.defaults.headers.common[
      "Authorization"
    ] = `${storedToken.tokenType} ${storedToken.accessToken}`;

    console.log("[iPayroll] Token added to API client");
  }

  return client;
};

// iPayroll API response interfaces
interface IPayrollPaginatedResponse<T> {
  links: Array<{
    rel: string;
    href: string;
  }>;
  content: T[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// iPayroll raw data interfaces (matching the API response)
interface IPayrollRawEmployee {
  id: string;
  employeeId: string;
  surname: string;
  firstNames: string;
  status: string;
  fullTimeHoursWeek: number;
  userDefinedGroup?: string;
  organisation?: number;
  payFrequency?: string;
  lastModifiedDate?: string;
  title?: string; // Employee's title/role
  // Add other fields as needed
}

interface IPayrollRawLeave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  hours: number;
  // Add other fields as needed
}

// Our application's employee interface
export interface IPayrollEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  status: string;
  fullTimeHoursWeek: number;
  department: string;
  organisation?: number;
  title?: string; // Employee's title/role
}

// Our application's leave interface
export interface IPayrollLeave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  hours: number;
}

// Fetch employees from iPayroll API
export async function fetchEmployees(
  token: StoredToken
): Promise<IPayrollEmployee[]> {
  console.log("[iPayroll] Fetching employees");
  try {
    const client = await getIPayrollClient(token);
    console.log("[iPayroll] Making request to /api/v1/employees endpoint");

    const response = await client.get<
      IPayrollPaginatedResponse<IPayrollRawEmployee>
    >("/api/v1/employees");

    console.log(
      `[iPayroll] Received ${
        response.data.content.length
      } employees from page ${response.data.page.number + 1} of ${
        response.data.page.totalPages
      }`
    );

    // Map the response data to our internal format
    return response.data.content.map((employee): IPayrollEmployee => {
      console.log(`[iPayroll] Processing employee: ${employee.id}`);
      return {
        id: employee.id,
        employeeId: employee.employeeId || "",
        firstName: employee.firstNames || "",
        lastName: employee.surname || "",
        status: employee.status || "Active",
        fullTimeHoursWeek: employee.fullTimeHoursWeek || 40,
        department: employee.userDefinedGroup || "",
        organisation: employee.organisation,
        title: employee.title || "", // Include the title
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
    console.log("[iPayroll] Making request to /api/v1/leave endpoint");

    const response = await client.get<
      IPayrollPaginatedResponse<IPayrollRawLeave>
    >("/api/v1/leave");

    console.log(
      `[iPayroll] Received ${
        response.data.content.length
      } leave records from page ${response.data.page.number + 1} of ${
        response.data.page.totalPages
      }`
    );

    // Map the response data to our internal format
    return response.data.content.map((leave): IPayrollLeave => {
      console.log(`[iPayroll] Processing leave record: ${leave.id}`);
      return {
        id: leave.id,
        employeeId: leave.employeeId || "",
        startDate: leave.startDate || "",
        endDate: leave.endDate || "",
        type: leave.leaveType || "",
        status: leave.status || "",
        hours: leave.hours || 0,
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
