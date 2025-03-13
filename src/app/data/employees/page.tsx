import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { EmployeesTable } from "./EmployeesTable";
import { EmployeesTableSkeleton } from "./loading";
import { getEmployees } from "./actions";
import { Header } from "./Header";

async function getRoles() {
  const roles = await prisma.role.findMany();
  return roles;
}

export default async function EmployeesPage() {
  const [{ data: employees = [] }, roles] = await Promise.all([
    getEmployees(),
    getRoles(),
  ]);

  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<EmployeesTableSkeleton />}>
        <EmployeesTable initialEmployees={employees} roles={roles} />
      </Suspense>
    </div>
  );
}
