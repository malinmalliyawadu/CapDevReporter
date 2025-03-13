import { PageHeader } from "@/components/ui/page-header";
import { EmployeeSyncClient } from "./EmployeeSyncClient";
import { User } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <User className="h-7 w-7 text-green-500" />
            <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              Employees
            </span>
          </span>
        }
        description="View and manage employees."
      />
      <EmployeeSyncClient />
    </div>
  );
}
