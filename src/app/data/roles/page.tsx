import * as React from "react";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RolesTable } from "./RolesTable";
import { RolesTableSkeleton } from "./RolesTableSkeleton";
import { Header } from "./Header";

async function getRoles() {
  return prisma.role.findMany({
    include: {
      employees: true,
    },
  });
}

export default async function RolesPage() {
  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<RolesTableSkeleton />}>
        <RolesTable initialRolesPromise={getRoles()} />
      </Suspense>
    </div>
  );
}
