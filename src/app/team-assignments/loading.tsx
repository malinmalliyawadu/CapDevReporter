import { PageHeader } from "@/components/ui/page-header";
import { LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-7 w-7 text-orange-500" />
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Team Assignments
              </span>
            </span>
          }
          description="Track and manage employee team assignments across your organization."
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Employee Assignments</h3>
              <p className="text-sm text-muted-foreground">
                View current team assignments and assignment history for each
                employee
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamAssignmentsTableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}

export function TeamAssignmentsTableSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-6 w-[100px] rounded-full" />
              </div>
              <Skeleton className="h-9 w-[140px]" />
            </div>
            <div className="pl-12 bg-muted/50 border rounded-md">
              <div className="p-4 space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <Skeleton className="h-4 w-[200px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[80px]" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
          <Skeleton className="h-8 w-[80px]" />
        </div>
      </div>
    </div>
  );
}
