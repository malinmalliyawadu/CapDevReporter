import * as React from "react";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { GeneralTimeAssignmentsTable } from "./GeneralTimeAssignmentsTable";
import { GeneralTimeAssignmentsTableSkeleton } from "./GeneralTimeAssignmentsTableSkeleton";
import { Header } from "./Header";

async function getRoles() {
  return prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      generalAssignments: {
        select: {
          id: true,
          roleId: true,
          timeTypeId: true,
          hoursPerWeek: true,
          createdAt: true,
          updatedAt: true,
          timeType: {
            select: {
              id: true,
              name: true,
              description: true,
              isCapDev: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });
}

async function getTimeTypes() {
  return prisma.timeType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      isCapDev: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export default async function GeneralTimeAssignmentsPage() {
  return (
    <div className="space-y-8">
      <Header />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Role Time Allocations</h3>
              <p className="text-sm text-muted-foreground">
                Set default weekly hours for general time types by role
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<GeneralTimeAssignmentsTableSkeleton />}>
            <GeneralTimeAssignmentsTable
              initialRolesPromise={getRoles()}
              timeTypesPromise={getTimeTypes()}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
