import { StoredToken } from "@/utils/ipayroll";
import { prisma } from "@/lib/prisma";

// Function to generate a random UUID
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// In-memory token storage (for development)
// In production, this should be replaced with a more persistent storage solution
let tokenStore: StoredToken | null = null;

// Save token to storage
export const saveToken = (token: StoredToken): void => {
  console.log("[Session] Saving token to storage");
  console.log(
    `[Session] Token expires at: ${new Date(token.expiresAt).toISOString()}`
  );
  tokenStore = token;
  console.log("[Session] Token saved successfully");
};

// Get token from storage
export const getToken = (): StoredToken | null => {
  console.log("[Session] Getting token from storage");
  if (!tokenStore) {
    console.log("[Session] No token found in storage");
    return null;
  }
  console.log(
    `[Session] Token found, expires at: ${new Date(
      tokenStore.expiresAt
    ).toISOString()}`
  );
  return tokenStore;
};

// Check if we have a valid token
export const hasValidToken = (): boolean => {
  console.log("[Session] Checking if token is valid");
  if (!tokenStore) {
    console.log("[Session] No token found");
    return false;
  }

  // Check if token is expired
  const isValid = tokenStore.expiresAt > Date.now();
  console.log(
    `[Session] Token expires at: ${new Date(
      tokenStore.expiresAt
    ).toISOString()}`
  );
  console.log(`[Session] Current time: ${new Date().toISOString()}`);
  console.log(`[Session] Token is ${isValid ? "valid" : "expired"}`);
  return isValid;
};

// Save state with expiration to database
export const saveState = async (state: string): Promise<void> => {
  console.log(
    `[Session] Saving iPayroll OAuth state: ${state.substring(0, 10)}...`
  );

  try {
    // Store state with expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Use Prisma's type-safe create method instead of raw SQL
    await prisma.iPayrollOAuthState.create({
      data: {
        id: generateUUID(),
        state,
        expiresAt,
        createdAt: new Date(),
      },
    });

    console.log(
      `[Session] iPayroll OAuth state saved to database, expires at: ${expiresAt.toISOString()}`
    );

    // Clean up expired states
    await cleanupExpiredStates();
  } catch (error) {
    console.error(
      "[Session] Error saving iPayroll OAuth state to database:",
      error
    );
    throw error;
  }
};

// Validate state from database
export const validateState = async (state: string): Promise<boolean> => {
  console.log(
    `[Session] Validating iPayroll OAuth state: ${state.substring(0, 10)}...`
  );

  try {
    // Find the state in the database using Prisma's type-safe query
    const storedState = await prisma.iPayrollOAuthState.findFirst({
      where: {
        state: state,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

    if (!storedState) {
      console.log("[Session] iPayroll OAuth state not found in database");
      return false;
    }

    // Check if state is expired
    const now = new Date();
    const isValid = storedState.expiresAt > now;

    console.log(
      `[Session] iPayroll OAuth state expires at: ${storedState.expiresAt.toISOString()}`
    );
    console.log(`[Session] Current time: ${now.toISOString()}`);
    console.log(
      `[Session] iPayroll OAuth state is ${isValid ? "valid" : "expired"}`
    );

    // Delete the state after validation using Prisma's type-safe delete
    await prisma.iPayrollOAuthState.delete({
      where: {
        id: storedState.id,
      },
    });

    console.log(
      "[Session] iPayroll OAuth state deleted from database after validation"
    );

    return isValid;
  } catch (error) {
    console.error("[Session] Error validating iPayroll OAuth state:", error);
    return false;
  }
};

// Clean up expired states from database
const cleanupExpiredStates = async (): Promise<void> => {
  console.log("[Session] Cleaning up expired iPayroll OAuth states");

  try {
    const now = new Date();

    // Delete all expired states using Prisma's type-safe deleteMany
    const deleteResult = await prisma.iPayrollOAuthState.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(
      `[Session] Cleaned up ${deleteResult.count} expired iPayroll OAuth states`
    );

    // Count remaining states using Prisma's type-safe count
    const remainingCount = await prisma.iPayrollOAuthState.count();

    console.log(
      `[Session] ${remainingCount} iPayroll OAuth states remaining in database`
    );
  } catch (error) {
    console.error(
      "[Session] Error cleaning up expired iPayroll OAuth states:",
      error
    );
  }
};
