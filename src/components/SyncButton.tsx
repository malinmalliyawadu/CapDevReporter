import { Button } from "@/components/ui/button";
import { syncEmployees } from "@/app/data/employees/actions";
import { syncLeaveRecords } from "@/app/data/leave/actions";
import { useState } from "react";

interface SyncButtonProps {
  type: "employees" | "leave";
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function SyncButton({
  type,
  className,
  onSuccess,
  onError,
}: SyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    console.log(`[SyncButton] Starting sync for ${type}`);
    try {
      setIsSyncing(true);
      console.log(`[SyncButton] Set syncing state to true for ${type}`);

      // Call the appropriate sync function based on type
      console.log(`[SyncButton] Calling sync function for ${type}`);
      const result =
        type === "employees" ? await syncEmployees() : await syncLeaveRecords();
      console.log(`[SyncButton] Received result for ${type} sync:`, result);

      // Check if authentication is required - log the exact structure of the result
      console.log(`[SyncButton] Result structure:`, JSON.stringify(result));

      // Check specifically for authUrl property
      if (result.authUrl) {
        console.log(
          `[SyncButton] Authentication required for ${type}, redirecting to: ${result.authUrl}`
        );
        // Redirect to the auth URL with a small delay to ensure logs are visible
        setTimeout(() => {
          window.location.href = result.authUrl;
        }, 100);
        return;
      }

      // Check for errors without authUrl
      if ("error" in result && !result.authUrl) {
        console.error(`[SyncButton] Error in ${type} sync:`, result.error);
        throw new Error(result.error);
      }

      // Call success callback
      const successMessage = `Successfully synced ${type} data from iPayroll.`;
      console.log(`[SyncButton] ${successMessage}`);
      onSuccess?.(successMessage);
      console.log(`[SyncButton] Success callback called for ${type}`);
    } catch (error) {
      console.error(`[SyncButton] Failed to sync ${type}:`, error);

      // Call error callback
      const errorMessage = `Failed to sync ${type} data from iPayroll.`;
      console.log(`[SyncButton] Calling error callback for ${type}`);
      onError?.(errorMessage);
    } finally {
      console.log(`[SyncButton] Setting syncing state to false for ${type}`);
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={isSyncing} className={className}>
      {isSyncing ? `Syncing ${type}...` : `Sync ${type}`}
    </Button>
  );
}
