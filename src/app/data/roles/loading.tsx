import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { UserCog } from "lucide-react";
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
              <UserCog className="h-8 w-8 text-violet-500" />
              <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent text-3xl font-bold">
                Roles
              </span>
            </span>
          }
          description="View and manage employee roles"
        />
        <Button disabled>
          <Skeleton className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Role List
            </CardTitle>
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
              <Skeleton className="h-10 w-[200px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableLoading rows={6} cols={3} />
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
