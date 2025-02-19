"use client";

import { useState } from "react";
import { Palmtree, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { format } from "date-fns";

export default function LeavePage() {
  const utils = trpc.useContext();
  const { data: leaveRecords } = trpc.leave.getAll.useQuery();
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncMutation = trpc.leave.sync.useMutation({
    onSuccess: () => {
      utils.leave.getAll.invalidate();
      setLastSynced(new Date());
      toast.success("Leave data synced successfully");
    },
    onError: (error) => {
      console.error("Failed to sync leave data:", error);
      toast.error("Failed to sync leave data");
    },
    onSettled: () => {
      setIsSyncing(false);
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    syncMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Palmtree className="h-6 w-6 text-teal-500" />
              Leave
            </span>
          }
          description="View and manage employee leave."
        />
        <div className="flex items-center gap-4">
          {lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString("en-NZ")}
            </span>
          )}
          <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            Sync with iPayroll
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRecords?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.employee.name}</TableCell>
                  <TableCell>
                    {format(new Date(record.date), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>{record.status}</TableCell>
                  <TableCell>
                    {record.duration} day{record.duration !== 1 ? "s" : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
