import * as React from "react";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { ProjectsTableSkeleton } from "./loading";
import { ProjectsTable } from "./ProjectsTable";

async function getProjects(searchParams: ProjectsPageQueryString) {
  const page = Number(searchParams.page) || 1;
  const size = Number(searchParams.size) || 10;
  const search = searchParams.search || "";

  let where = {};

  if (search) {
    if (search.toLowerCase().startsWith("jira:")) {
      // Exact match for Jira ID
      const jiraId = search.slice(5); // Remove "jira:" prefix
      where = {
        jiraId: {
          equals: jiraId,
        },
      };
    } else {
      // Regular search across multiple fields
      const searchLower = search.toLowerCase();
      where = {
        OR: [
          { name: { contains: searchLower } },
          { description: { contains: searchLower } },
          { jiraId: { contains: searchLower } },
        ],
      };
    }
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        board: {
          include: {
            team: true,
          },
        },
        timeEntries: true,
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * size,
      take: size,
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
}

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
  const { projects, total } = await getProjects(params ?? {});

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
