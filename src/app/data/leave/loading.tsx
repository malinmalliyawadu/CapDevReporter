import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { Palmtree } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-teal-500" />
            Leave
          </span>
        }
        description="View and manage employee leave."
      />

      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <TableLoading title="Leave Records" rows={8} cols={4} />
    </div>
  );
}
