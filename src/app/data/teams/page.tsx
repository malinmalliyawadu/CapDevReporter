import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TeamsTableSkeleton } from "./teams-table-skeleton";
import { TeamsTable } from "./teams-table";
import { PageHeader } from "@/components/ui/page-header";
import { Users } from "lucide-react";

async function getTeams() {
  return prisma.team.findMany({
    include: {
      jiraBoards: {
        include: {
          projects: true,
        },
      },
    },
  });
}

export default async function TeamsPage() {
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
          description="Manage your team structure and configure Jira board integrations for seamless project tracking."
        />
      </div>

      <Suspense fallback={<TeamsTableSkeleton />}>
        <TeamsTable initialTeamsPromise={getTeams()} />
      </Suspense>
    </div>
  );
}
