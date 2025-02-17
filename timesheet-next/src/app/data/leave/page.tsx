"use client";

import { trpc } from "@/utils/trpc";
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
import { useToast } from "@/hooks/use-toast";
import type { RouterOutputs } from "@/utils/trpc";

export default function LeavePage() {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const { data: leaveRecords, isLoading } = trpc.leave.getAll.useQuery();
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // TODO: Add actual iPayroll sync logic here
      await utils.leave.getAll.invalidate();
      setLastSynced(new Date());
      toast({
        title: "Success",
        description: "Leave data synced successfully",
      });
    } catch (error) {
      console.error("Failed to sync leave data:", error);
      toast({
        title: "Error",
        description: "Failed to sync leave data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Palmtree className="h-6 w-6 text-teal-500" />
            Leave
          </span>
        }
        description="View and manage employee leave."
      />

      <div className="mb-8 flex justify-between items-center">
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
                <TableHead>Payroll ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRecords?.map(
                (leave: RouterOutputs["leave"]["getAll"][number]) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.employee.name}</TableCell>
                    <TableCell>{leave.employee.payrollId}</TableCell>
                    <TableCell>
                      {new Date(leave.date).toLocaleDateString("en-NZ")}
                    </TableCell>
                    <TableCell>{leave.type}</TableCell>
                    <TableCell>{leave.status}</TableCell>
                    <TableCell>
                      {leave.duration} day{leave.duration !== 1 ? "s" : ""}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
