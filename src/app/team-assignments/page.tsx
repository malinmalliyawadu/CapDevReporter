import * as React from "react";
import { Suspense } from "react";
import { LayoutGrid } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { TeamAssignmentsTable } from "./TeamAssignmentsTable";
import { TeamAssignmentsTableSkeleton } from "./loading";
import { Header } from "./Header";

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
      <Header />

      <Suspense fallback={<TeamAssignmentsTableSkeleton />}>
        <TeamAssignmentsTable
          initialEmployees={employees}
          teams={teams}
          roles={roles}
        />
      </Suspense>
    </div>
  );
}
