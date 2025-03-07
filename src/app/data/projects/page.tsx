import * as React from "react";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectsTableSkeleton } from "./loading";
import { ProjectsTable } from "./ProjectsTable";
import { getProjects, getBoards } from "./actions";

export const dynamic = "force-dynamic";

export interface ProjectsPageQueryString {
  page?: string;
  size?: string;
  search?: string;
  projectId?: string;
  sync?: string;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<ProjectsPageQueryString>;
}) {
  const params = await searchParams;

  // Fetch initial data on the server
  const [{ projects, total }, boards] = await Promise.all([
    getProjects({
      page: Number(params.page) || 1,
      size: Number(params.size) || 10,
      search: params.search,
    }),
    getBoards(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-indigo-500" />
              <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
                Projects
              </span>
            </span>
          }
          description="Manage and view all projects"
        />
      </div>

      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsTable
          initialProjects={projects}
          totalProjects={total}
          searchParams={params}
          availableBoards={boards}
        />
      </Suspense>
    </div>
  );
}
