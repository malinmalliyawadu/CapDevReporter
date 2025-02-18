import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <User className="h-6 w-6 text-green-500" />
            Employees
          </span>
        }
        description="View employee directory synced from iPayroll."
      />

      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <TableLoading title="Employee List" rows={8} cols={4} />
    </div>
  );
}
