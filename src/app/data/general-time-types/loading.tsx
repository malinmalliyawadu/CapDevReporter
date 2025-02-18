import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-purple-500" />
            Time Types
          </span>
        }
        description="Manage time tracking categories."
      />

      <div className="flex justify-end mb-8">
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <TableLoading title="Time Types" rows={6} cols={4} />
    </div>
  );
}
