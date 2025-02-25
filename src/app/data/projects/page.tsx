import * as React from "react";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProjectsTableSkeleton } from "./loading";
import { ProjectsTable } from "./ProjectsTable";
import { getProjects } from "./actions";

export const dynamic = "force-dynamic";

export type ProjectsPageQueryString = {
  search?: string;
  page?: string;
  size?: string;
  projectId?: string;
  sync?: string;
};

export default async function ProjectsPage(props: {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    size?: string;
    projectId?: string;
  }>;
}) {
  const params = await props.searchParams;
  const { projects, total } = await getProjects({
    page: Number(params?.page) || 1,
    size: Number(params?.size) || 10,
    search: params?.search,
  });

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

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ProjectsTableSkeleton />}>
            <ProjectsTable
              initialProjects={projects}
              totalProjects={total}
              searchParams={params ?? {}}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
