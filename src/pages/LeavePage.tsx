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
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface LeaveDay {
  employeeName: string;
  payrollId: string;
  date: string;
  type: "Annual Leave" | "Sick Leave" | "Bereavement Leave" | "Other";
  status: "Approved" | "Pending" | "Taken";
  duration: number; // in days
}

export function LeavePage() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveData, setLeaveData] = useState<LeaveDay[]>([
    {
      employeeName: "John Doe",
      payrollId: "123456",
      date: "2024-02-15",
      type: "Annual Leave",
      status: "Taken",
      duration: 1,
    },
    {
      employeeName: "John Doe",
      payrollId: "123456",
      date: "2024-02-16",
      type: "Annual Leave",
      status: "Taken",
      duration: 1,
    },
    {
      employeeName: "Jane Smith",
      payrollId: "123457",
      date: "2024-03-01",
      type: "Sick Leave",
      status: "Taken",
      duration: 0.5,
    },
    {
      employeeName: "Jane Smith",
      payrollId: "123457",
      date: "2024-03-15",
      type: "Annual Leave",
      status: "Approved",
      duration: 1,
    },
  ]);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // TODO: Replace with actual iPayroll API call
      // const response = await fetch('ipayroll-api-endpoint');
      // const data = await response.json();
      // setLeaveData(data);

      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to sync leave data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Days</h1>
          <p className="text-muted-foreground">
            Employee leave records from iPayroll
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString("en-NZ")}
            </span>
          )}
          <Button onClick={handleSync} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
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
              {leaveData.map((leave, index) => (
                <TableRow key={`${leave.payrollId}-${leave.date}-${index}`}>
                  <TableCell>{leave.employeeName}</TableCell>
                  <TableCell>{leave.payrollId}</TableCell>
                  <TableCell>
                    {new Date(leave.date).toLocaleDateString("en-NZ")}
                  </TableCell>
                  <TableCell>{leave.type}</TableCell>
                  <TableCell>{leave.status}</TableCell>
                  <TableCell>
                    {leave.duration} day{leave.duration !== 1 ? "s" : ""}
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
