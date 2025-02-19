import * as React from "react";
import { Suspense } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { TimeTypesTable } from "./TimeTypesTable";
import { TimeTypesTableSkeleton } from "./loading";

async function getTimeTypes() {
  const timeTypes = await prisma.timeType.findMany({
    include: {
      timeEntries: true,
      generalAssignments: {
        include: {
          role: true,
        },
      },
    },
  });
  return timeTypes;
}

export default async function GeneralTimeTypesPage() {
  const timeTypes = await getTimeTypes();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-7 w-7 text-blue-500" />
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                General Time Types
              </span>
            </span>
          }
          description="Manage general time types and their role assignments."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Time Types</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TimeTypesTableSkeleton />}>
            <TimeTypesTable initialTimeTypes={timeTypes} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
