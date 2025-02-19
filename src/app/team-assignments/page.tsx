import * as React from "react";
import { Suspense } from "react";
import { LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { TeamAssignmentsTable } from "./TeamAssignmentsTable";
import { TeamAssignmentsTableSkeleton } from "./loading";

async function getEmployees() {
  const employees = await prisma.employee.findMany({
    select: {
      id: true,
      name: true,
      payrollId: true,
      hoursPerWeek: true,
      roleId: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      assignments: {
        select: {
          id: true,
          teamId: true,
          employeeId: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
              description: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          startDate: "desc",
        },
      },
    },
  });
  return employees;
}

async function getTeams() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return teams;
}

async function getRoles() {
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return roles;
}

export default async function TeamAssignmentsPage() {
  const [employees, teams, roles] = await Promise.all([
    getEmployees(),
    getTeams(),
    getRoles(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-7 w-7 text-orange-500" />
              <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Team Assignments
              </span>
            </span>
          }
          description="Track and manage employee team assignments across your organization."
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">Employee Assignments</h3>
              <p className="text-sm text-muted-foreground">
                View current team assignments and assignment history for each
                employee
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TeamAssignmentsTableSkeleton />}>
            <TeamAssignmentsTable
              initialEmployees={employees}
              teams={teams}
              roles={roles}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
