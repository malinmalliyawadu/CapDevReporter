"use client";

import * as React from "react";
import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  generalAssignments: GeneralTimeAssignment[];
}

interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface GeneralTimeAssignment {
  id: string;
  roleId: string;
  timeTypeId: string;
  hoursPerWeek: number;
  createdAt: Date;
  updatedAt: Date;
  timeType: TimeType;
}

interface GeneralTimeAssignmentsTableProps {
  initialRoles: Role[];
  timeTypes: TimeType[];
}

export function GeneralTimeAssignmentsTable({
  initialRoles,
  timeTypes,
}: GeneralTimeAssignmentsTableProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeTypeFilter, setTimeTypeFilter] = useState<string>("all");
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<GeneralTimeAssignment | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    roleId: "",
    timeTypeId: "",
    hoursPerWeek: 0,
  });

  const toggleRole = (roleId: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const handleCreateAssignment = async () => {
    if (
      !newAssignment.roleId ||
      !newAssignment.timeTypeId ||
      newAssignment.hoursPerWeek <= 0
    ) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    try {
      const response = await fetch("/api/general-time-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAssignment),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create assignment");
      }

      const createdAssignment = await response.json();

      setRoles((prevRoles) =>
        prevRoles.map((role) => {
          if (role.id === newAssignment.roleId) {
            return {
              ...role,
              generalAssignments: [
                ...role.generalAssignments,
                createdAssignment,
              ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
            };
          }
          return role;
        })
      );

      setNewAssignment({ roleId: "", timeTypeId: "", hoursPerWeek: 0 });
      setIsDialogOpen(false);
      toast.success("Assignment created successfully");
    } catch (error) {
      console.error("Failed to create assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create assignment"
      );
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      const response = await fetch(`/api/general-time-assignments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete assignment");
      }

      setRoles((prevRoles) =>
        prevRoles.map((role) => ({
          ...role,
          generalAssignments: role.generalAssignments.filter(
            (assignment) => assignment.id !== id
          ),
        }))
      );

      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      toast.success("Assignment deleted successfully");
    } catch (error) {
      console.error("Failed to delete assignment:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete assignment"
      );
    }
  };

  const filteredRoles = roles.filter((role) => {
    const matchesSearch = role.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTimeType =
      timeTypeFilter === "all" ||
      role.generalAssignments.some(
        (assignment) => assignment.timeTypeId === timeTypeFilter
      );
    return matchesSearch && matchesTimeType;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={timeTypeFilter} onValueChange={setTimeTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Time Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time Types</SelectItem>
                {timeTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      <div className="grid gap-6">
        {filteredRoles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleRole(role.id)}
                  >
                    {expandedRoles.has(role.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <div>
                    <h4 className="text-lg font-semibold">{role.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {role.generalAssignments.length} time type
                      {role.generalAssignments.length === 1 ? "" : "s"} assigned
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewAssignment((prev) => ({
                      ...prev,
                      roleId: role.id,
                    }));
                    setIsDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Type
                </Button>
              </div>
            </CardHeader>
            {expandedRoles.has(role.id) && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time Type</TableHead>
                      <TableHead>Hours per Week</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {role.generalAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                assignment.timeType.isCapDev
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200"
                              }`}
                            >
                              {assignment.timeType.name}
                            </span>
                            {assignment.timeType.description && (
                              <span className="text-sm text-muted-foreground">
                                {assignment.timeType.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.hoursPerWeek}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAssignmentToDelete(assignment);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Assignment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select
              value={newAssignment.roleId}
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, roleId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={newAssignment.timeTypeId}
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, timeTypeId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Time Type" />
              </SelectTrigger>
              <SelectContent>
                {timeTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={0}
              value={newAssignment.hoursPerWeek || ""}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  hoursPerWeek: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Hours per week"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment}>Add Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this time type assignment? This
              action cannot be undone.
            </p>
            {assignmentToDelete && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Time Type:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      assignmentToDelete.timeType.isCapDev
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200"
                    }`}
                  >
                    {assignmentToDelete.timeType.name}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Hours per week:</span>{" "}
                  <span className="text-sm">
                    {assignmentToDelete.hoursPerWeek}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setAssignmentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                assignmentToDelete?.id &&
                handleDeleteAssignment(assignmentToDelete.id)
              }
            >
              Delete Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
