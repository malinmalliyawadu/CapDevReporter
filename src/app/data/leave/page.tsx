import * as React from "react";
import { Suspense } from "react";
import { Palmtree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LeaveTable } from "./LeaveTable";
import { LeaveTableSkeleton } from "./loading";
import { getLeaveRecords } from "./actions";
import { LeaveSyncClient } from "./LeaveSyncClient";

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
        <LeaveSyncClient />
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
