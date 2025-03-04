import { StoredToken } from "@/utils/ipayroll";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

// Delete the token (clear)
export const deleteToken = (): void => {
  console.log("[Session] Deleting token from storage");
  tokenStore = null;
  console.log("[Session] Token deleted successfully");
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
    // Find the state in the database using a raw query
    const storedStates = await prisma.$queryRaw<
      Array<{ id: string; expiresAt: Date }>
    >(
      Prisma.sql`SELECT "id", "expiresAt" FROM "IPayrollOAuthState" WHERE "state" = ${state}`
    );

    if (!storedStates || storedStates.length === 0) {
      console.log("[Session] iPayroll OAuth state not found in database");
      return false;
    }

    const storedState = storedStates[0];

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

    // Delete the state after validation
    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM "IPayrollOAuthState" WHERE "id" = ${storedState.id}`
    );
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

    // Delete all expired states
    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM "IPayrollOAuthState" WHERE "expiresAt" < ${now}`
    );

    console.log(`[Session] Cleaned up expired iPayroll OAuth states`);

    // Count remaining states
    const remainingResult = await prisma.$queryRaw<Array<{ count: number }>>(
      Prisma.sql`SELECT COUNT(*) as count FROM "IPayrollOAuthState"`
    );
    const remainingCount = remainingResult[0]?.count || 0;

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
