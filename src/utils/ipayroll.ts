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

// Define interface for the leave balances response
interface IPayrollLeaveBalance {
  id: string;
  employeeId: string;
  entitled: number;
  accrued: number;
  taken: number;
  balance: number;
  committedEntitled: number;
  committedAccrued: number;
  committedTaken: number;
  committedBalance: number;
  leaveBalanceType: {
    leaveType: string;
    name: string;
    unit: string;
    organisationSpecific: boolean;
  };
  nextAnniversaryDate?: string;
  lastAnniversaryDate?: string;
  approvedQuantity?: number;
}

// Define interface for the leave requests response
interface IPayrollLeaveRequest {
  id: number;
  employeeId: string;
  surname?: string;
  firstNames?: string;
  preferredName?: string;
  hours: number;
  leaveFromDate: string;
  leaveToDate: string;
  reason?: string;
  status: string;
  payElement?: string;
  leaveBalanceType: {
    leaveType: string;
    name: string;
    unit: string;
    organisationSpecific: boolean;
  };
  payElementId?: number;
  daysConsumed?: number;
  daysCurrent?: number;
  daysRemaining?: number;
  quantityConsumed?: number;
  quantityCurrent?: number;
  quantityRemaining?: number;
  leaveInDays?: boolean;
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

    // Get current date and date 1 year ago for a reasonable date range
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Format dates as DD/MM/YYYY for iPayroll API
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const dateFrom = formatDate(oneYearAgo);
    const dateTo = formatDate(today);

    console.log(
      `[iPayroll] Making request to /api/v1/leaves/requests endpoint with dateFrom=${dateFrom} and dateTo=${dateTo}`
    );

    const response = await client.get<
      IPayrollPaginatedResponse<IPayrollLeaveRequest>
    >(`/api/v1/leaves/requests?dateFrom=${dateFrom}&dateTo=${dateTo}`);

    console.log(
      `[iPayroll] Received ${
        response.data.content.length
      } leave requests from page ${response.data.page.number + 1} of ${
        response.data.page.totalPages
      }`
    );

    // Helper function to normalize leave duration to hours
    const normalizeDurationToHours = (record: IPayrollLeaveRequest): number => {
      // If the leave is recorded in days in iPayroll but we store as hours,
      // we need to convert (assuming standard 8-hour workday)
      if (record.leaveInDays === true) {
        console.log(
          `[iPayroll] Leave record ${record.id} is in days, converting to hours (8 hours per day)`
        );
        return record.hours * 8; // Convert days to hours assuming 8-hour workday
      }

      // Already in hours, return as is
      return record.hours;
    };

    // Map the response data to our internal format
    return response.data.content.map((leave): IPayrollLeave => {
      console.log(`[iPayroll] Processing leave request record: ${leave.id}`);

      // Get normalized duration in hours
      const durationInHours = normalizeDurationToHours(leave);
      console.log(
        `[iPayroll] Leave duration for record ${leave.id}: ${durationInHours} hours`
      );

      return {
        id: leave.id.toString(),
        employeeId: leave.employeeId,
        startDate: leave.leaveFromDate,
        endDate: leave.leaveToDate,
        type: leave.leaveBalanceType.name,
        status: leave.status,
        hours: durationInHours,
      };
    });
  } catch (error) {
    console.error("[iPayroll] Error fetching leave records:", error);
    throw error;
  }
}
