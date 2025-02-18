import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-500" />
            Teams
          </span>
        }
        description="View and manage teams and their Jira board assignments."
      />

      <div className="flex justify-end mb-8">
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TableLoading rows={3} cols={4} showHeader={false} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
