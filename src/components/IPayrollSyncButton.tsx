import { Button } from "@/components/ui/button";
import { syncEmployees } from "@/app/data/employees/actions";
import { syncLeaveRecords } from "@/app/data/leave/actions";
import { useState, useEffect } from "react";
import { Loader2, RefreshCw, LogIn, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface IPayrollSyncButtonProps {
  type: "employees" | "leave";
  className?: string;
  onError?: (message: string) => void;
}

type SyncState =
  | "idle"
  | "syncing"
  | "auth_required"
  | "error"
  | "success"
  | "checking_auth";

export function IPayrollSyncButton({
  type,
  className,
  onError,
}: IPayrollSyncButtonProps) {
  const [syncState, setSyncState] = useState<SyncState>("checking_auth");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [syncCount, setSyncCount] = useState<number>(0);
  const { toast } = useToast();

  // Check authentication status on component mount by making a lightweight request
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Make a lightweight request to check auth status
        // We'll use the same sync function but catch the auth error
        console.log(`[IPayrollSync] Checking auth status for ${type}`);
        const result =
          type === "employees"
            ? await syncEmployees()
            : await syncLeaveRecords();

        // If we get an authUrl, we're not authenticated
        if (result.authUrl) {
          console.log(`[IPayrollSync] Auth required for ${type}`);
          setSyncState("auth_required");
        } else {
          console.log(`[IPayrollSync] Auth valid for ${type}`);
          setSyncState("idle");
        }
      } catch (error) {
        console.error("[IPayrollSync] Error checking auth status:", error);
        setSyncState("idle"); // Default to idle if we can't check
      }
    };

    checkAuthStatus();
  }, [type]);

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

        // Show error toast
        toast({
          variant: "destructive",
          title: "Sync Failed",
          description:
            result.error || `Failed to sync ${type} data from iPayroll.`,
        });

        throw new Error(result.error);
      }

      // Extract count from result
      let count = 0;
      if (
        type === "employees" &&
        "data" in result &&
        result.data &&
        typeof result.data.count === "number"
      ) {
        count = result.data.count;
      } else if (
        type === "leave" &&
        "count" in result &&
        typeof result.count === "number"
      ) {
        count = result.count;
      }

      setSyncCount(count);

      // Call success callback
      const successMessage = `Successfully synced ${count} ${type} from iPayroll.`;
      console.log(`[IPayrollSync] ${successMessage}`);
      setSyncState("success");

      // Show success toast with count
      toast({
        title: "Sync Successful",
        description: successMessage,
        variant: "success",
      });

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

      // Show error toast
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: errorMessage,
      });

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
      case "checking_auth":
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking authentication...
          </>
        );
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
            Login to iPayroll
          </>
        );
      case "error":
        return (
          <>
            <AlertCircle className="mr-2 h-4 w-4" />
            {errorMessage || `Failed to sync ${type}`}
          </>
        );
      case "success":
        return `Synced ${syncCount} ${type}`;
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
      case "checking_auth":
        return "secondary";
      default:
        return "default";
    }
  };

  const handleButtonClick = () => {
    if (syncState === "auth_required") {
      // If not authenticated, redirect to auth URL immediately
      const authUrl =
        type === "employees"
          ? "/api/ipayroll/auth?callbackUrl=/data/employees"
          : "/api/ipayroll/auth?callbackUrl=/data/leave";
      window.location.href = authUrl;
    } else {
      // Otherwise, proceed with sync
      handleSync();
    }
  };

  // Render the button with a tooltip for auth_required state
  if (syncState === "auth_required") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleButtonClick}
              className={`${className} border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600`}
              variant="outline"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login to iPayroll
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Authentication required to sync {type} from iPayroll</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Regular button for other states
  return (
    <Button
      onClick={handleButtonClick}
      disabled={syncState === "syncing" || syncState === "checking_auth"}
      className={className}
      variant={getButtonVariant()}
    >
      {getButtonContent()}
    </Button>
  );
}
