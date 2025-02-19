"use client";

import React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { RouterOutputs, trpc } from "@/trpc/client";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Team {
  id: string;
  name: string;
}

interface EditingAssignment {
  employeeId: string;
  assignmentId?: string;
  teamId?: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

type EmployeeAssignment =
  RouterOutputs["employee"]["getAll"][number]["assignments"][number];

export default function TeamAssignmentsPage() {
  const [editingAssignment, setEditingAssignment] =
    useState<EditingAssignment | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set()
  );

  const { data: employees, refetch } = trpc.employee.getAll.useQuery();
  const { data: teamsData } = trpc.team.getAll.useQuery();
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

  const getCurrentAssignment = (
    assignments: EmployeeAssignment[] | undefined
  ) => {
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
      startDate: editingAssignment.startDate.toISOString(),
      endDate: editingAssignment.endDate
        ? editingAssignment.endDate.toISOString()
        : null,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-orange-500" />
              Team Assignments
            </span>
          }
          description="Manage employee team assignments and track history."
        />
        <Button
          onClick={() =>
            setEditingAssignment({
              employeeId: "",
              teamId: "",
              startDate: new Date(),
              endDate: undefined,
            })
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Current Assignments</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees?.map((employee) => (
              <div key={employee.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setExpandedEmployees((prev) => {
                          const next = new Set(prev);
                          if (next.has(employee.id)) {
                            next.delete(employee.id);
                          } else {
                            next.add(employee.id);
                          }
                          return next;
                        })
                      }
                    >
                      {expandedEmployees.has(employee.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {employee.role.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {getCurrentAssignment(employee.assignments)?.team.name ??
                        "Unassigned"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setEditingAssignment({
                        employeeId: employee.id,
                        teamId: "",
                        startDate: new Date(),
                        endDate: undefined,
                      })
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {expandedEmployees.has(employee.id) && (
                  <div className="pl-12 bg-muted/50 border rounded-md">
                    <div className="p-4 space-y-3">
                      {employee.assignments
                        .sort(
                          (a: EmployeeAssignment, b: EmployeeAssignment) =>
                            new Date(b.startDate).getTime() -
                            new Date(a.startDate).getTime()
                        )
                        .map((assignment: EmployeeAssignment) => (
                          <div
                            key={assignment.id}
                            className="flex items-center justify-between"
                          >
                            <div className="space-y-1">
                              <div className="font-medium">
                                {assignment.team.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(
                                  new Date(assignment.startDate),
                                  "dd MMM yyyy"
                                )}{" "}
                                -{" "}
                                {assignment.endDate
                                  ? format(
                                      new Date(assignment.endDate),
                                      "dd MMM yyyy"
                                    )
                                  : "Present"}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setEditingAssignment({
                                  employeeId: employee.id,
                                  teamId: assignment.team.id,
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
