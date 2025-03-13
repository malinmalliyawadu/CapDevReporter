import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { TeamAssignmentsTable } from "./TeamAssignmentsTable";
import { TeamAssignmentsTableSkeleton } from "./TeamAssignmentsTableSkeleton";
import { Header } from "./Header";

async function getEmployees() {
  return prisma.employee.findMany({
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
}

async function getTeams() {
  return prisma.team.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function getRoles() {
  return prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export default async function TeamAssignmentsPage() {
  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<TeamAssignmentsTableSkeleton />}>
        <TeamAssignmentsTable
          initialEmployeesPromise={getEmployees()}
          teamsPromise={getTeams()}
          rolesPromise={getRoles()}
        />
      </Suspense>
    </div>
  );
}
