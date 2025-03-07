"use client";

import { IPayrollSyncButton } from "@/components/IPayrollSyncButton";
import { useToast } from "@/hooks/use-toast";

export function EmployeeSyncClient() {
  const { toast } = useToast();

  const handleError = (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  return <IPayrollSyncButton type="employees" onError={handleError} />;
}
