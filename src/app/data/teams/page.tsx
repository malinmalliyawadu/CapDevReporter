import * as React from "react";
import { Suspense } from "react";
import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { TeamsTableSkeleton } from "./loading";
import { TeamsTable } from "./TeamsTable";

async function getTeams() {
  const teams = await prisma.team.findMany({
    include: {
      jiraBoards: {
        include: {
          projects: true,
        },
      },
    },
  });
  return teams;
}

export default async function TeamsPage() {
  const teams = await getTeams();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Users className="h-7 w-7 text-blue-500" />
              <span className="bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
                Teams
              </span>
            </span>
          }
          description="View and manage teams and their Jira board assignments."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TeamsTableSkeleton />}>
            <TeamsTable initialTeams={teams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
