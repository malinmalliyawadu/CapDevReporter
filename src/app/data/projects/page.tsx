import * as React from "react";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { ProjectsTableSkeleton } from "./loading";
import { ProjectsTable } from "./ProjectsTable";

async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      board: {
        include: {
          team: true,
        },
      },
      timeEntries: true,
    },
  });
  return projects;
}

export default async function ProjectsPage() {
  const projects = await getProjects();

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
            <ProjectsTable initialProjects={projects} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
