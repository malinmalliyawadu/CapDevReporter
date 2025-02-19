import * as React from "react";
import { Suspense } from "react";
import { Palmtree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { LeaveTable } from "./LeaveTable";
import { LeaveTableSkeleton } from "./loading";

async function getLeaveRecords() {
  const leaveRecords = await prisma.leave.findMany({
    include: {
      employee: true,
    },
  });
  return leaveRecords.map((record) => ({
    ...record,
    date: record.date.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    employee: {
      ...record.employee,
      createdAt: record.employee.createdAt.toISOString(),
      updatedAt: record.employee.updatedAt.toISOString(),
    },
  }));
}

export default async function LeavePage() {
  const leaveRecords = await getLeaveRecords();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Palmtree className="h-8 w-8 text-teal-500" />
              <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent text-3xl font-bold">
                Leave
              </span>
            </span>
          }
          description="View and manage employee leave records"
        />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Leave Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<LeaveTableSkeleton />}>
            <LeaveTable initialLeaveRecords={leaveRecords} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
