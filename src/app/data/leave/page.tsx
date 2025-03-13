import * as React from "react";
import { Suspense } from "react";
import { LeaveTable } from "./LeaveTable";
import { LeaveTableSkeleton } from "./loading";
import { getLeaveRecords } from "./actions";
import { Header } from "./Header";

export default async function LeavePage() {
  const leaveRecords = await getLeaveRecords();

  return (
    <div className="space-y-8">
      <Header />

      <Suspense fallback={<LeaveTableSkeleton />}>
        <LeaveTable initialLeaveRecords={leaveRecords} />
      </Suspense>
    </div>
  );
}
