import * as React from "react";
import { Suspense } from "react";
import { ProjectsTableSkeleton } from "./loading";
import { ProjectsTable } from "./ProjectsTable";
import { getProjects, getBoards } from "./actions";
import { Header } from "./Header";

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
      <Header />

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
