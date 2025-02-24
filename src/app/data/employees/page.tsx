import * as React from "react";
import { Suspense } from "react";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { EmployeesTable } from "./EmployeesTable";
import { EmployeesTableSkeleton } from "./loading";

async function getEmployees() {
  const employees = await prisma.employee.findMany({
    include: {
      role: true,
    },
  });
  return employees;
}

async function getRoles() {
  const roles = await prisma.role.findMany();
  return roles;
}

export default async function EmployeesPage() {
  const [employees, roles] = await Promise.all([getEmployees(), getRoles()]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <User className="h-7 w-7 text-green-500" />
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Employees
              </span>
            </span>
          }
          description="View and manage employees."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<EmployeesTableSkeleton />}>
            <EmployeesTable initialEmployees={employees} roles={roles} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
