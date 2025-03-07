# iPayroll API Integration

This document provides instructions on how to set up and use the OAuth 2.0 Authorization Code Grant flow for iPayroll API integration.

## Overview

The application uses OAuth 2.0 Authorization Code Grant flow to access iPayroll API resources. This flow is secure and allows the application to obtain an access token to make API requests on behalf of the application.

## Prerequisites

1. An iPayroll account with API access
2. Client credentials (Client ID and Client Secret) from iPayroll
3. Registered redirect URI with iPayroll

## API Scopes

iPayroll uses OAuth scopes to control access to different API resources. Scopes must be configured correctly for your API user in the iPayroll system:

### Required Scopes:

- `employees` - Required for accessing employee data
- `leaverequests` - Required for accessing leave records
- Additional scopes may be required depending on your specific integration needs

## Environment Variables

The following environment variables need to be set in your `.env` file:

```
# iPayroll OAuth Configuration
IPAYROLL_CLIENT_ID="your-client-id"
IPAYROLL_CLIENT_SECRET="your-client-secret"
```

Note: Replace the placeholder values with your actual credentials.

## OAuth Flow

1. **Data Sync Request**: When the application needs to sync data from iPayroll, it first checks if it has a valid token.
2. **Token Acquisition**: If no valid token exists, the server action returns an `authUrl` that can be used to initiate the OAuth flow.
3. **Authorization**: The user is redirected to iPayroll's authorization page where they log in and grant permissions. The authorization request includes the scopes configured for your API user.
4. **Callback**: After authorization, iPayroll redirects back to the application's callback URL (`/api/ipayroll/auth/callback`) with an authorization code.
5. **Token Exchange**: The application exchanges the authorization code for access and refresh tokens. The access token will be limited to the scopes granted to your API user.
6. **Token Storage**: The tokens are securely stored in server-side memory (or a more persistent storage in production).
7. **Redirect**: The user is redirected back to the original page that initiated the sync.
8. **Data Sync Completion**: The application can now complete the data sync using the acquired token.

## API Endpoints

### 1. Initiate OAuth Flow

```
GET /api/ipayroll/auth?callbackUrl=/your-callback-url
```

This endpoint initiates the OAuth flow and redirects the user to iPayroll's authorization page. The `callbackUrl` parameter specifies where to redirect after successful authentication.

### 2. OAuth Callback

```
GET /api/ipayroll/auth/callback
```

This endpoint handles the callback from iPayroll after the user has authorized the application. It exchanges the authorization code for tokens, stores them, and redirects the user back to the original page.

## Data Synchronization

The application provides server actions to sync data from iPayroll to the local database:

1. `syncEmployees()`: Syncs employee data from iPayroll (requires `employees` scope)
2. `syncLeaveRecords()`: Syncs leave records from iPayroll (requires `leaverequests` scope)

These functions check for a valid token and handle the OAuth flow if needed:

```typescript
// Example usage in a component
const handleSync = async () => {
  const result = await syncEmployees();

  if (result.error && result.authUrl) {
    // Redirect to auth URL if authentication is required
    window.location.href = result.authUrl;
    return;
  }

  // Handle success or other errors
  // ...
};
```

## Development

When developing locally, make sure to:

1. Set up the environment variables in your `.env.local` file.
2. Register `http://localhost:3000/api/ipayroll/auth/callback` as a redirect URI in your iPayroll developer account.

## Resources

- [OAuth 2.0 Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/)
- [iPayroll API Documentation](https://developer.ipayroll.co.nz/)
