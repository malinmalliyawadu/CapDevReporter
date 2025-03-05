"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      let errorMessage = "An error occurred during sign in";

      switch (error) {
        case "Configuration":
          errorMessage =
            "There is a problem with the server configuration. Please contact support.";
          break;
        case "AccessDenied":
          errorMessage = "You do not have permission to sign in.";
          break;
        case "Verification":
          errorMessage = "The verification failed. Please try again.";
          break;
        default:
          if (error.includes("AZURE_AD")) {
            errorMessage =
              "Azure AD configuration is incomplete. Please contact support.";
          }
      }

      toast.error(errorMessage);
    }
  }, [error]);

  return null;
}
