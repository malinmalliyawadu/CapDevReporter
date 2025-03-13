import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { EmployeesTable } from "./EmployeesTable";
import { EmployeesTableSkeleton } from "./EmployeesTableSkeleton";
import { getEmployees } from "./actions";
import { Header } from "./Header";

async function getRoles() {
  return prisma.role.findMany();
}

export default async function EmployeesPage() {
  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<EmployeesTableSkeleton />}>
        <EmployeesTable
          initialEmployeesPromise={getEmployees()}
          rolesPromise={getRoles()}
        />
      </Suspense>
    </div>
  );
}
