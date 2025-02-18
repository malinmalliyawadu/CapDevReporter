"use client";

import { useState } from "react";
import { User, RefreshCw, AlertCircle, Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployeesPage() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string;
    name: string;
    hoursPerWeek: number;
  } | null>(null);

  const { data: employees, refetch: refetchEmployees } =
    trpc.employee.getAll.useQuery();

  const { mutate: syncEmployees } = trpc.employee.sync.useMutation({
    onSuccess: () => {
      refetchEmployees();
      setLastSynced(new Date());
      toast.success("Employees synced with iPayroll");
      setIsSyncing(false);
    },
    onError: () => {
      toast.error("Failed to sync employees");
      setIsSyncing(false);
    },
  });

  const { mutate: updateHours } = trpc.employee.updateHoursPerWeek.useMutation({
    onSuccess: () => {
      refetchEmployees();
      setEditingEmployee(null);
      toast.success("Hours updated successfully");
    },
    onError: () => {
      toast.error("Failed to update hours");
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    syncEmployees();
  };

  const handleUpdateHours = () => {
    if (!editingEmployee) return;

    const hours = Number(editingEmployee.hoursPerWeek);
    if (isNaN(hours) || hours < 0 || hours > 168) {
      toast.error("Please enter a valid number of hours (0-168)");
      return;
    }

    updateHours({
      id: editingEmployee.id,
      hoursPerWeek: hours,
    });
  };

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <User className="h-6 w-6 text-green-500" />
            Employees
          </span>
        }
        description="View employee directory synced from iPayroll."
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
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Payroll ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[150px]">Hours per Week</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.payrollId}</TableCell>
                  <TableCell>{employee.role.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {employee.hoursPerWeek || "-"}
                        {!employee.hoursPerWeek && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingEmployee({
                            id: employee.id,
                            name: employee.name,
                            hoursPerWeek: employee.hoursPerWeek,
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Hours for {editingEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="hours">Hours per Week</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                max={168}
                value={editingEmployee?.hoursPerWeek || ""}
                onChange={(e) =>
                  setEditingEmployee(
                    (prev) =>
                      prev && {
                        ...prev,
                        hoursPerWeek: e.target.valueAsNumber,
                      }
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateHours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
