import * as React from "react";
import { Suspense } from "react";
import { LeaveTable } from "./LeaveTable";
import { LeaveTableSkeleton } from "./LeaveTableSkeleton";
import { getLeaveRecords } from "./actions";
import { Header } from "./Header";

export default async function LeavePage() {
  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<LeaveTableSkeleton />}>
        <LeaveTable initialLeaveRecordsPromise={getLeaveRecords()} />
      </Suspense>
    </div>
  );
}
