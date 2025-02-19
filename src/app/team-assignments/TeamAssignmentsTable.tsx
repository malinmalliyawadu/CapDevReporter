"use client";

import * as React from "react";
import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Assignment {
  id: string;
  teamId: string;
  employeeId: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  team: Team;
}

interface Employee {
  id: string;
  name: string;
  payrollId: string;
  hoursPerWeek: number;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  role: Role;
  assignments: Assignment[];
}

interface TeamAssignmentsTableProps {
  initialEmployees: Employee[];
  teams: Team[];
  roles: Role[];
}

interface EditingAssignment {
  employeeId: string;
  assignmentId?: string;
  teamId?: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
}

export function TeamAssignmentsTable({
  initialEmployees,
  teams,
  roles,
}: TeamAssignmentsTableProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingAssignment, setEditingAssignment] =
    useState<EditingAssignment | null>(null);
  const itemsPerPage = 10;

  const getCurrentAssignment = (assignments: Assignment[]) => {
    if (!assignments?.length) return null;
    const today = new Date();
    return assignments.find(
      (a) =>
        new Date(a.startDate) <= today &&
        (!a.endDate || new Date(a.endDate) >= today)
    );
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTeam =
      teamFilter === "all"
        ? true
        : getCurrentAssignment(employee.assignments)?.team.id === teamFilter;
    const matchesRole =
      roleFilter === "all" ? true : employee.role.id === roleFilter;
    return matchesSearch && matchesTeam && matchesRole;
  });

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCreateAssignment = async () => {
    if (
      !editingAssignment ||
      !editingAssignment.startDate ||
      !editingAssignment.teamId
    ) {
      toast.error("Please select a team and start date");
      return;
    }

    try {
      const response = await fetch("/api/employee-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: editingAssignment.employeeId,
          teamId: editingAssignment.teamId,
          startDate: editingAssignment.startDate.toISOString(),
          endDate: editingAssignment.endDate
            ? editingAssignment.endDate.toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create assignment");
      }

      const newAssignment = await response.json();

      // Update local state
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) => {
          if (employee.id === editingAssignment.employeeId) {
            return {
              ...employee,
              assignments: [...employee.assignments, newAssignment],
            };
          }
          return employee;
        })
      );

      toast.success("Assignment added successfully");
      setEditingAssignment(null);
    } catch (error) {
      console.error("Failed to create assignment:", error);
      toast.error("Failed to create assignment");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={teamFilter}
            onValueChange={(value) => {
              setTeamFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roleFilter}
            onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 mt-4">
        {paginatedEmployees.map((employee) => {
          const currentAssignment = getCurrentAssignment(employee.assignments);
          const isUnassigned = !currentAssignment;

          return (
            <div
              key={employee.id}
              className={`space-y-4 rounded-lg border ${
                isUnassigned
                  ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                  : "border-transparent"
              } p-4`}
            >
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
                  <div className="flex flex-col">
                    <span className="font-medium">{employee.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {employee.role.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnassigned ? (
                      <span className="inline-flex items-center rounded-md bg-red-100 dark:bg-red-900 px-2 py-1 text-sm font-medium text-red-700 dark:text-red-200">
                        Unassigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-green-100 dark:bg-green-900 px-2 py-1 text-sm font-medium text-green-700 dark:text-green-200">
                        {currentAssignment.team.name}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={isUnassigned ? "default" : "outline"}
                  onClick={() =>
                    setEditingAssignment({
                      employeeId: employee.id,
                      teamId: "",
                      startDate: new Date(),
                      endDate: undefined,
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isUnassigned ? "Assign to Team" : "New Assignment"}
                </Button>
              </div>
              {expandedEmployees.has(employee.id) && (
                <div className="pl-12 bg-muted/50 border rounded-md">
                  <div className="p-4 space-y-3">
                    {employee.assignments.length > 0 ? (
                      employee.assignments
                        .sort(
                          (a, b) =>
                            new Date(b.startDate).getTime() -
                            new Date(a.startDate).getTime()
                        )
                        .map((assignment) => (
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
                                  assignmentId: assignment.id,
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
                        ))
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        No previous assignments
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t pt-4 mt-4">
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          {Math.min(
            (currentPage - 1) * itemsPerPage + 1,
            filteredEmployees.length
          )}{" "}
          to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of{" "}
          {filteredEmployees.length} employees
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => page - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((page) => page + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>

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
            <Button onClick={handleCreateAssignment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
