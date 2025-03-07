import * as React from "react";
import { Suspense } from "react";
import { Drama } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { RolesTable } from "./RolesTable";
import { RolesTableSkeleton } from "./loading";

export const dynamic = "force-dynamic";

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
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Drama className="h-7 w-7 text-purple-500" />
              <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                Roles
              </span>
            </span>
          }
          description="View and manage employee roles."
        />
      </div>

      <Suspense fallback={<RolesTableSkeleton />}>
        <RolesTable initialRoles={roles} />
      </Suspense>
    </div>
  );
}
