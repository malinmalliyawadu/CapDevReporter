import { Button } from "@/components/ui/button";
import { syncEmployees } from "@/app/data/employees/actions";
import { syncLeaveRecords } from "@/app/data/leave/actions";
import { useState } from "react";
import { Loader2, RefreshCw, LogIn } from "lucide-react";

interface IPayrollSyncButtonProps {
  type: "employees" | "leave";
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

type SyncState = "idle" | "syncing" | "auth_required" | "error" | "success";

export function IPayrollSyncButton({
  type,
  className,
  onSuccess,
  onError,
}: IPayrollSyncButtonProps) {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSync = async () => {
    console.log(`[IPayrollSync] Starting sync for ${type}`);
    try {
      setSyncState("syncing");
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
        setSyncState("auth_required");

        // Redirect to the auth URL with a small delay to ensure logs are visible
        setTimeout(() => {
          window.location.href = result.authUrl;
        }, 1500); // Increased delay to show the auth_required state
        return;
      }

      // Check for errors without authUrl
      if ("error" in result && !result.authUrl) {
        console.error(`[IPayrollSync] Error in ${type} sync:`, result.error);
        setErrorMessage(result.error || `Error syncing ${type}`);
        setSyncState("error");
        throw new Error(result.error);
      }

      // Call success callback
      const successMessage = `Successfully synced ${type} data from iPayroll.`;
      console.log(`[IPayrollSync] ${successMessage}`);
      setSyncState("success");
      onSuccess?.(successMessage);
      console.log(`[IPayrollSync] Success callback called for ${type}`);

      // Reset to idle after showing success state
      setTimeout(() => {
        setSyncState("idle");
      }, 3000);
    } catch (error) {
      console.error(`[IPayrollSync] Failed to sync ${type}:`, error);

      // Call error callback
      const errorMessage = `Failed to sync ${type} data from iPayroll.`;
      setErrorMessage(errorMessage);
      setSyncState("error");
      console.log(`[IPayrollSync] Calling error callback for ${type}`);
      onError?.(errorMessage);

      // Reset to idle after showing error state
      setTimeout(() => {
        setSyncState("idle");
      }, 3000);
    }
  };

  const getButtonContent = () => {
    switch (syncState) {
      case "syncing":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Syncing {type}...
          </>
        );
      case "auth_required":
        return (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Redirecting to login...
          </>
        );
      case "error":
        return `Error: ${errorMessage || `Failed to sync ${type}`}`;
      case "success":
        return `Successfully synced ${type}`;
      default:
        return (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync {type} from iPayroll
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (syncState) {
      case "error":
        return "destructive";
      case "success":
        return "success";
      case "auth_required":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={syncState === "syncing"}
      className={className}
      variant={getButtonVariant() as any}
    >
      {getButtonContent()}
    </Button>
  );
}
