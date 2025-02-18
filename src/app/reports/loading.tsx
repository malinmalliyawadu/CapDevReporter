import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <BarChart className="h-6 w-6 text-rose-500" />
            Time Reports
          </span>
        }
        description="View and analyze time tracking reports."
      />

      <div className="sticky top-4 z-10 mb-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>

        <TableLoading rows={8} cols={6} />
      </div>
    </div>
  );
}
