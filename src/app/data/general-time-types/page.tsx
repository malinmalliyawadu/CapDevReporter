import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TimeTypesTable } from "./TimeTypesTable";
import { TimeTypesTableSkeleton } from "./loading";
import { Header } from "./Header";

async function getTimeTypes() {
  const timeTypes = await prisma.timeType.findMany({
    include: {
      generalAssignments: {
        include: {
          role: true,
        },
      },
    },
  });
  return timeTypes.map((type) => ({
    ...type,
    createdAt: type.createdAt.toISOString(),
    updatedAt: type.updatedAt.toISOString(),
  }));
}

export default async function GeneralTimeTypesPage() {
  const timeTypes = await getTimeTypes();

  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<TimeTypesTableSkeleton />}>
        <TimeTypesTable initialTimeTypes={timeTypes} />
      </Suspense>
    </div>
  );
}
