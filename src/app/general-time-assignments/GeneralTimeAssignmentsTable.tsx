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
  Clock,
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
import { createAssignment, deleteAssignment } from "./actions";

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

interface TimeBreakdown {
  timeType: TimeType;
  hoursPerWeek: number;
  percentage: number;
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

    const result = await createAssignment(newAssignment);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id === newAssignment.roleId) {
          return {
            ...role,
            generalAssignments: [...role.generalAssignments, result.data].sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            ),
          };
        }
        return role;
      })
    );

    setNewAssignment({ roleId: "", timeTypeId: "", hoursPerWeek: 0 });
    setIsDialogOpen(false);
    toast.success("Assignment created successfully");
  };

  const handleDeleteAssignment = async (id: string) => {
    const result = await deleteAssignment(id);

    if (!result.success) {
      toast.error(result.error);
      return;
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
  };

  const calculateTimeBreakdown = (
    assignments: GeneralTimeAssignment[]
  ): { total: number; breakdown: TimeBreakdown[] } => {
    const total = assignments.reduce(
      (sum, assignment) => sum + assignment.hoursPerWeek,
      0
    );

    const breakdown = assignments.map((assignment) => ({
      timeType: assignment.timeType,
      hoursPerWeek: assignment.hoursPerWeek,
      percentage: (assignment.hoursPerWeek / 40) * 100,
    }));

    return {
      total,
      breakdown: breakdown.sort((a, b) => b.hoursPerWeek - a.hoursPerWeek),
    };
  };

  // Color utility function for progress bar
  const getProgressBarColor = (percentage: number): string => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 90) return "bg-amber-500";
    if (percentage > 75) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  // Color utility function for time types
  const getTimeTypeColor = (
    timeType: TimeType
  ): { bg: string; text: string; dot: string } => {
    if (timeType.isCapDev) {
      return {
        bg: "bg-blue-100 dark:bg-blue-900/50",
        text: "text-blue-700 dark:text-blue-200",
        dot: "bg-blue-500 dark:bg-blue-400",
      };
    }

    // Create a hash of the time type name to consistently assign colors
    const hash = timeType.name
      .split("")
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    const colors = [
      {
        bg: "bg-purple-100 dark:bg-purple-900/50",
        text: "text-purple-700 dark:text-purple-200",
        dot: "bg-purple-500 dark:bg-purple-400",
      },
      {
        bg: "bg-green-100 dark:bg-green-900/50",
        text: "text-green-700 dark:text-green-200",
        dot: "bg-green-500 dark:bg-green-400",
      },
      {
        bg: "bg-orange-100 dark:bg-orange-900/50",
        text: "text-orange-700 dark:text-orange-200",
        dot: "bg-orange-500 dark:bg-orange-400",
      },
      {
        bg: "bg-rose-100 dark:bg-rose-900/50",
        text: "text-rose-700 dark:text-rose-200",
        dot: "bg-rose-500 dark:bg-rose-400",
      },
      {
        bg: "bg-teal-100 dark:bg-teal-900/50",
        text: "text-teal-700 dark:text-teal-200",
        dot: "bg-teal-500 dark:bg-teal-400",
      },
    ];

    return colors[hash % colors.length];
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

      <div className="space-y-4">
        {filteredRoles.map((role) => {
          const { total: totalHours, breakdown } = calculateTimeBreakdown(
            role.generalAssignments
          );
          const totalPercentage = (totalHours / 40) * 100;

          return (
            <Card key={role.id}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedRoles.has(role.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <div>
                      <h4 className="text-lg font-medium">{role.name}</h4>
                      {role.description && (
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {totalHours.toFixed(1)} hours/week (
                      {totalPercentage.toFixed(1)}
                      %)
                    </div>
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
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
                </div>

                {/* Time breakdown visualization */}
                <div className="space-y-3">
                  <div className="h-3 w-full bg-secondary/30 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                        totalPercentage
                      )}`}
                      style={{
                        width: `${Math.min(totalPercentage, 100)}%`,
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {breakdown.map(({ timeType, hoursPerWeek, percentage }) => {
                      const colors = getTimeTypeColor(timeType);
                      return (
                        <div
                          key={timeType.id}
                          className="flex items-center gap-1.5"
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${colors.dot}`}
                          />
                          <span className="text-xs">
                            {timeType.name} ({hoursPerWeek}h,{" "}
                            {percentage.toFixed(1)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                              {(() => {
                                const colors = getTimeTypeColor(
                                  assignment.timeType
                                );
                                return (
                                  <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
                                  >
                                    {assignment.timeType.name}
                                  </span>
                                );
                              })()}
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
          );
        })}
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
