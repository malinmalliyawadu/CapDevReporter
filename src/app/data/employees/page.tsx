"use client";

import { useState } from "react";
import {
  User,
  RefreshCw,
  Pencil,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/datepicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { type EmployeeWithRelations } from "@/trpc/routers/employee";

interface Assignment {
  id: string;
  startDate: Date;
  endDate: Date | null;
}

interface EditingAssignment {
  employeeId: string;
  assignmentId?: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export default function EmployeesPage() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<EditingAssignment | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set()
  );

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

  const { mutate: createAssignment } =
    trpc.employeeAssignment.create.useMutation({
      onSuccess: () => {
        refetchEmployees();
        setEditingAssignment(null);
        toast.success("Assignment added successfully");
      },
      onError: () => {
        toast.error("Failed to add assignment");
      },
    });

  const { mutate: updateAssignment } =
    trpc.employeeAssignment.update.useMutation({
      onSuccess: () => {
        refetchEmployees();
        setEditingAssignment(null);
        toast.success("Assignment updated successfully");
      },
      onError: () => {
        toast.error("Failed to update assignment");
      },
    });

  const handleSync = async () => {
    setIsSyncing(true);
    syncEmployees();
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy");
  };

  const handleSaveAssignment = () => {
    if (!editingAssignment || !editingAssignment.startDate) {
      toast.error("Please select a start date");
      return;
    }

    if (editingAssignment.assignmentId) {
      updateAssignment({
        id: editingAssignment.assignmentId,
        startDate: editingAssignment.startDate,
        endDate: editingAssignment.endDate,
      });
    } else {
      createAssignment({
        employeeId: editingAssignment.employeeId,
        startDate: editingAssignment.startDate,
        endDate: editingAssignment.endDate,
      });
    }
  };

  const toggleExpanded = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
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
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Payroll ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[150px]">Hours per Week</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <>
                  <TableRow key={employee.id}>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpanded(employee.id)}
                      >
                        {expandedEmployees.has(employee.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.payrollId}</TableCell>
                    <TableCell>{employee.role.name}</TableCell>
                    <TableCell>{employee.hoursPerWeek}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditingAssignment({
                            employeeId: employee.id,
                            startDate: undefined,
                            endDate: undefined,
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedEmployees.has(employee.id) && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <div className="pl-12 py-2">
                          <div className="text-sm font-medium mb-2">
                            Assignment History
                          </div>
                          <div className="space-y-2">
                            {employee.assignments?.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center justify-between border rounded-lg p-2"
                              >
                                <div>
                                  <div className="font-medium">
                                    From: {formatDate(assignment.startDate)}
                                  </div>
                                  {assignment.endDate && (
                                    <div className="text-muted-foreground">
                                      To: {formatDate(assignment.endDate)}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setEditingAssignment({
                                      employeeId: employee.id,
                                      assignmentId: assignment.id,
                                      startDate: new Date(assignment.startDate),
                                      endDate: assignment.endDate
                                        ? new Date(assignment.endDate)
                                        : undefined,
                                    })
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {(!employee.assignments ||
                              employee.assignments.length === 0) && (
                              <div className="text-muted-foreground">
                                No assignments found
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!editingAssignment}
        onOpenChange={(open) => !open && setEditingAssignment(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAssignment?.assignmentId
                ? "Edit Assignment"
                : "Add Assignment"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker
                date={editingAssignment?.startDate}
                onSelect={(date) =>
                  setEditingAssignment(
                    (prev) => prev && { ...prev, startDate: date }
                  )
                }
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker
                date={editingAssignment?.endDate}
                onSelect={(date) =>
                  setEditingAssignment(
                    (prev) => prev && { ...prev, endDate: date }
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingAssignment(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
