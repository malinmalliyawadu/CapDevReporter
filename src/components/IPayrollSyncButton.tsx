import { Button } from "@/components/ui/button";
import { syncEmployees } from "@/app/data/employees/actions";
import { syncLeaveRecords } from "@/app/data/leave/actions";
import { useState } from "react";

interface IPayrollSyncButtonProps {
  type: "employees" | "leave";
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export function IPayrollSyncButton({
  type,
  className,
  onSuccess,
  onError,
}: IPayrollSyncButtonProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    console.log(`[IPayrollSync] Starting sync for ${type}`);
    try {
      setIsSyncing(true);
      console.log(`[IPayrollSync] Set syncing state to true for ${type}`);

      // Call the appropriate sync function based on type
      console.log(`[IPayrollSync] Calling sync function for ${type}`);
      const result =
        type === "employees" ? await syncEmployees() : await syncLeaveRecords();
      console.log(`[IPayrollSync] Received result for ${type} sync:`, result);

      // Check if authentication is required - log the exact structure of the result
      console.log(`[IPayrollSync] Result structure:`, JSON.stringify(result));

      // Check specifically for authUrl property
      if (result.authUrl) {
        console.log(
          `[IPayrollSync] Authentication required for ${type}, redirecting to: ${result.authUrl}`
        );
        // Redirect to the auth URL with a small delay to ensure logs are visible
        setTimeout(() => {
          window.location.href = result.authUrl;
        }, 100);
        return;
      }

      // Check for errors without authUrl
      if ("error" in result && !result.authUrl) {
        console.error(`[IPayrollSync] Error in ${type} sync:`, result.error);
        throw new Error(result.error);
      }

      // Call success callback
      const successMessage = `Successfully synced ${type} data from iPayroll.`;
      console.log(`[IPayrollSync] ${successMessage}`);
      onSuccess?.(successMessage);
      console.log(`[IPayrollSync] Success callback called for ${type}`);
    } catch (error) {
      console.error(`[IPayrollSync] Failed to sync ${type}:`, error);

      // Call error callback
      const errorMessage = `Failed to sync ${type} data from iPayroll.`;
      console.log(`[IPayrollSync] Calling error callback for ${type}`);
      onError?.(errorMessage);
    } finally {
      console.log(`[IPayrollSync] Setting syncing state to false for ${type}`);
      setIsSyncing(false);
    }
  };

  return (
    <Button onClick={handleSync} disabled={isSyncing} className={className}>
      {isSyncing
        ? `Syncing ${type} from iPayroll...`
        : `Sync ${type} from iPayroll`}
    </Button>
  );
}
