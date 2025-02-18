"use client";

import React from "react";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/datepicker";
import { PageHeader } from "@/components/ui/page-header";
import {
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type EmployeeWithRelations } from "@/trpc/routers/employee";

interface Team {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  startDate: string;
  endDate: string | null;
  team: Team;
}

interface EditingAssignment {
  employeeId: string;
  assignmentId?: string;
  teamId?: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export default function TeamAssignmentsPage() {
  const [editingAssignment, setEditingAssignment] =
    useState<EditingAssignment | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set()
  );

  const {
    data: employees,
    isLoading,
    refetch,
  } = trpc.employee.getAll.useQuery() as {
    data: EmployeeWithRelations[] | undefined;
    isLoading: boolean;
    refetch: () => Promise<any>;
  };
  const { data: teamsData } = trpc.team.getAll.useQuery() as {
    data: Team[] | undefined;
  };
  const teams: Team[] = teamsData ?? [];
  const { mutate: createAssignment } =
    trpc.employeeAssignment.create.useMutation({
      onSuccess: () => {
        refetch();
        toast.success("Assignment added successfully");
        setEditingAssignment(null);
      },
      onError: (error) => {
        console.error("Failed to create assignment:", error);
        toast.error("Failed to create assignment");
      },
    });

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "-";
    return format(new Date(date), "dd MMM yyyy");
  };

  const getCurrentAssignment = (assignments: any[] | undefined) => {
    if (!assignments?.length) return null;
    const today = new Date();
    return assignments.find(
      (a) =>
        new Date(a.startDate) <= today &&
        (!a.endDate || new Date(a.endDate) >= today)
    );
  };

  const handleSubmit = async () => {
    if (
      !editingAssignment ||
      !editingAssignment.startDate ||
      !editingAssignment.teamId
    ) {
      toast.error("Please select a team and start date");
      return;
    }

    if (editingAssignment.assignmentId) {
      // TODO: Implement update
      toast.error("Update not implemented yet");
      return;
    }

    createAssignment({
      employeeId: editingAssignment.employeeId,
      teamId: editingAssignment.teamId,
      startDate: editingAssignment.startDate,
      endDate: editingAssignment.endDate ? editingAssignment.endDate : null,
    });
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

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-orange-500" />
            Team Assignments
          </span>
        }
        description="Manage team memberships and assignments."
      />

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30px]"></TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Current Team</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <React.Fragment key={employee.id}>
                  <TableRow className="border-b-0">
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
                    <TableCell>{employee.role.name}</TableCell>
                    <TableCell>
                      {getCurrentAssignment(employee.assignments) ? (
                        <span className="text-green-600 dark:text-green-400">
                          {employee.team.name}
                        </span>
                      ) : (
                        <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          No current assignment
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingAssignment({
                            employeeId: employee.id,
                            startDate: undefined,
                            endDate: undefined,
                          });
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedEmployees.has(employee.id) && (
                    <TableRow>
                      <TableCell className="p-0" colSpan={5}>
                        <div className="bg-muted/50 border-y">
                          <div className="divide-y">
                            {employee.assignments?.map((assignment) => {
                              const isCurrentAssignment =
                                !assignment.endDate ||
                                new Date(assignment.endDate) >= new Date();
                              return (
                                <div
                                  key={assignment.id}
                                  className={`flex items-center justify-between px-4 py-2 ${
                                    isCurrentAssignment
                                      ? "bg-green-50 dark:bg-green-900/10"
                                      : ""
                                  }`}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-[30px]"></div>
                                    <div>
                                      <div className="font-medium flex items-center gap-2">
                                        {formatDate(assignment.startDate)}
                                        {isCurrentAssignment && (
                                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                            Current
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-muted-foreground space-y-1">
                                        <div>Team: {assignment.team.name}</div>
                                        {assignment.endDate && (
                                          <div>
                                            Until{" "}
                                            {formatDate(assignment.endDate)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingAssignment({
                                        employeeId: employee.id,
                                        assignmentId: assignment.id,
                                        startDate: new Date(
                                          assignment.startDate
                                        ),
                                        endDate: assignment.endDate
                                          ? new Date(assignment.endDate)
                                          : undefined,
                                      });
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              );
                            })}
                            {(!employee.assignments ||
                              employee.assignments.length === 0) && (
                              <div className="px-4 py-2 text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                                <div className="w-[30px]"></div>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                No assignments found
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
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
              <Label htmlFor="team">Team</Label>
              <Select
                value={editingAssignment?.teamId}
                onValueChange={(value) =>
                  setEditingAssignment(
                    (prev) => prev && { ...prev, teamId: value }
                  )
                }
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button onClick={handleSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
