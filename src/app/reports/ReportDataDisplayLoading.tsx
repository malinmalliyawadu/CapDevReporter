import { Skeleton } from "@/components/ui/skeleton";
import { TableLoading } from "@/components/loading/TableLoading";

export function ReportDataDisplayLoading() {
  return (
    <>
      <div className="sticky top-4 z-10">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>
      </div>

      <div className="space-y-8 relative">
        {/* Time Distribution Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <div className="aspect-[4/3]">
                  <Skeleton className="h-full w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Utilization Issues */}
        <div className="rounded-lg border bg-card p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Time Report Table */}
        <TableLoading rows={8} cols={6} />
      </div>
    </>
  );
}
