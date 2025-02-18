import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { FolderGit2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <FolderGit2 className="h-6 w-6 text-blue-500" />
            Projects
          </span>
        }
        description="View and manage projects synced from Jira."
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <TableLoading title="Project List" rows={6} cols={5} />
    </div>
  );
}
