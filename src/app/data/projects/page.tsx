import * as React from "react";
import { Suspense } from "react";
import { ProjectsTableSkeleton } from "./ProjectsTableSkeleton";
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

  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<ProjectsTableSkeleton />}>
        <ProjectsTable
          initialProjectsPromise={getProjects({
            page: Number(params.page) || 1,
            size: Number(params.size) || 10,
            search: params.search,
          })}
          searchParams={params}
          availableBoardsPromise={getBoards()}
        />
      </Suspense>
    </div>
  );
}
