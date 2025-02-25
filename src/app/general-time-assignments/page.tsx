import * as React from "react";
import { Suspense } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { GeneralTimeAssignmentsTable } from "./GeneralTimeAssignmentsTable";
import { GeneralTimeAssignmentsTableSkeleton } from "./loading";

export const dynamic = "force-dynamic";

async function getRoles() {
  const roles = await prisma.role.findMany({
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
  return roles;
}

async function getTimeTypes() {
  const timeTypes = await prisma.timeType.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      isCapDev: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return timeTypes;
}

export default async function GeneralTimeAssignmentsPage() {
  const [roles, timeTypes] = await Promise.all([getRoles(), getTimeTypes()]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-7 w-7 text-cyan-500" />
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
                General Time Assignments
              </span>
            </span>
          }
          description="Manage default time type allocations for each role."
        />
      </div>

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
              initialRoles={roles}
              timeTypes={timeTypes}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
