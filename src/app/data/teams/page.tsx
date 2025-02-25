import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TeamsTableSkeleton } from "./loading";
import { TeamsTable } from "./TeamsTable";
import { Header } from "./Header";

export const dynamic = "force-dynamic";

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
      <Header />

      <Suspense fallback={<TeamsTableSkeleton />}>
        <TeamsTable initialTeams={teams} />
      </Suspense>
    </div>
  );
}
