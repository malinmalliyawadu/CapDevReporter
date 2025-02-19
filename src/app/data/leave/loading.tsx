import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { Palmtree, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Palmtree className="h-8 w-8 text-teal-500" />
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent text-3xl font-bold">
                Leave
              </span>
            </span>
          }
          description="View and manage employee leave records"
        />
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-48" />
          <Button disabled>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync with iPayroll
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Leave Records
            </CardTitle>
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[140px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableLoading rows={8} cols={5} />
          <div className="flex items-center justify-between p-4 border-t">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[80px]" />
              <Skeleton className="h-9 w-[80px]" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
