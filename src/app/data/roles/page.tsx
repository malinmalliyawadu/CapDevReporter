import * as React from "react";
import { Suspense } from "react";
import { Drama } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RolesTable } from "./RolesTable";
import { RolesTableSkeleton } from "./loading";
import { Header } from "./Header";

async function getRoles() {
  const roles = await prisma.role.findMany({
    include: {
      employees: true,
    },
  });
  return roles;
}

export default async function RolesPage() {
  const roles = await getRoles();

  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<RolesTableSkeleton />}>
        <RolesTable initialRoles={roles} />
      </Suspense>
    </div>
  );
}
