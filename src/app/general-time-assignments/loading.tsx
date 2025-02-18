import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Timer className="h-6 w-6 text-rose-500" />
            General Time Assignments
          </span>
        }
        description="Manage general time hours per week based on role."
      />

      <div className="flex justify-end mb-8">
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <TableLoading title="Current Assignments" rows={6} cols={4} />
    </div>
  );
}
