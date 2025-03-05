import axios, { AxiosInstance } from "axios";
import { StoredToken } from "./types";
import { refreshAccessToken } from "./auth";

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
