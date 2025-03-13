import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TeamsTableSkeleton } from "./TeamsTableSkeleton";
import { TeamsTable } from "./TeamsTable";
import { Header } from "./Header";

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
      <Header />

      <Suspense fallback={<TeamsTableSkeleton />}>
        <TeamsTable initialTeamsPromise={getTeams()} />
      </Suspense>
    </div>
  );
}
