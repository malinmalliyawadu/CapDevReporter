"use client";

import * as React from "react";
import { useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUpDown,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
}

interface GeneralTimeAssignment {
  id: string;
  roleId: string;
  timeTypeId: string;
  hoursPerWeek: number;
  role: Role;
  timeType: TimeType;
}

type SortField = "role" | "timeType" | "hours";
type SortOrder = "asc" | "desc";

export default function GeneralTimeAssignmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<GeneralTimeAssignment | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    roleId: "",
    timeTypeId: "",
    hoursPerWeek: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [timeTypeFilter, setTimeTypeFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("role");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data, isLoading, refetch } =
    trpc.generalTimeAssignments.getAll.useQuery();
  const createMutation = trpc.generalTimeAssignments.create.useMutation({
    onSuccess: () => {
      refetch();
      setNewAssignment({ roleId: "", timeTypeId: "", hoursPerWeek: 0 });
      setIsDialogOpen(false);
      toast.success("Assignment added successfully");
    },
    onError: (error) => {
      console.error("Failed to add assignment:", error);
      toast.error("Failed to add assignment");
    },
  });

  const deleteMutation = trpc.generalTimeAssignments.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete assignment:", error);
      toast.error("Failed to delete assignment");
    },
  });

  const assignments = data?.assignments ?? [];
  const roles = data?.roles ?? [];
  const timeTypes = data?.timeTypes ?? [];

  // Filter assignments
  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.timeType.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "all" || assignment.roleId === roleFilter;
    const matchesTimeType =
      timeTypeFilter === "all" || assignment.timeTypeId === timeTypeFilter;
    return matchesSearch && matchesRole && matchesTimeType;
  });

  // Sort assignments
  const sortedAssignments = [...filteredAssignments].sort((a, b) => {
    let comparison = 0;
    if (sortField === "role") {
      comparison = a.role.name.localeCompare(b.role.name);
    } else if (sortField === "timeType") {
      comparison = a.timeType.name.localeCompare(b.timeType.name);
    } else if (sortField === "hours") {
      comparison = a.hoursPerWeek - b.hoursPerWeek;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Group assignments by role
  const groupedAssignments = sortedAssignments.reduce((groups, assignment) => {
    const roleId = assignment.role.id;
    if (!groups[roleId]) {
      groups[roleId] = {
        role: assignment.role,
        assignments: [],
        totalHours: 0,
      };
    }
    groups[roleId].assignments.push(assignment);
    groups[roleId].totalHours += assignment.hoursPerWeek;
    return groups;
  }, {} as Record<string, { role: Role; assignments: GeneralTimeAssignment[]; totalHours: number }>);

  // Paginate grouped assignments
  const groupedEntries = Object.entries(groupedAssignments);
  const totalPages = Math.ceil(groupedEntries.length / itemsPerPage);
  const paginatedGroups = groupedEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleAdd = async () => {
    if (
      !newAssignment.roleId ||
      !newAssignment.timeTypeId ||
      newAssignment.hoursPerWeek <= 0
    ) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    createMutation.mutate(newAssignment);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate({ id });
    setIsDeleteDialogOpen(false);
    setAssignmentToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <span className="flex items-center gap-2">
                <Timer className="h-7 w-7 text-violet-500" />
                <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  General Time Assignments
                </span>
              </span>
            }
            description="Manage general time hours per week based on role."
          />
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Assignment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={6} cols={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Timer className="h-7 w-7 text-violet-500" />
              <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                General Time Assignments
              </span>
            </span>
          }
          description="Manage general time hours per week based on role."
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
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
                  {roles.map((role: Role) => (
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
                  {timeTypes.map((type: TimeType) => (
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
              <Button onClick={handleAdd} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle>Current Assignments</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 w-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={roleFilter}
                  onValueChange={(value) => {
                    setRoleFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="All Roles" />
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
                <Select
                  value={timeTypeFilter}
                  onValueChange={(value) => {
                    setTimeTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]" />
                  <TableHead className="w-[300px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("role")}
                      className="group -ml-4"
                    >
                      Role
                      <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
                    </Button>
                  </TableHead>
                  <TableHead>Time Types</TableHead>
                  <TableHead className="w-[120px]">Total Hours</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="text-muted-foreground">
                        No assignments found
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filter criteria
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedGroups.map(([roleId, group]) => (
                    <React.Fragment key={roleId}>
                      <TableRow className="group">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleRole(roleId)}
                          >
                            {expandedRoles.has(roleId) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{group.role.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.assignments.length} time type
                            {group.assignments.length === 1 ? "" : "s"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {group.assignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                  assignment.timeType.isCapDev
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200"
                                }`}
                                title={`${assignment.timeType.name}: ${assignment.hoursPerWeek} hours per week`}
                              >
                                {assignment.timeType.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{group.totalHours}</div>
                          <div className="text-sm text-muted-foreground">
                            hours per week
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNewAssignment((prev) => ({
                                ...prev,
                                roleId: roleId,
                              }));
                              setIsDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Type
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRoles.has(roleId) && (
                        <TableRow>
                          <TableCell colSpan={5} className="p-0">
                            <div className="bg-muted/50 border-t">
                              <div className="divide-y">
                                {group.assignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center justify-between p-4"
                                  >
                                    <div className="flex items-center gap-4">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                          assignment.timeType.isCapDev
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200"
                                        }`}
                                      >
                                        {assignment.timeType.name}
                                      </span>
                                      <span className="text-sm">
                                        {assignment.hoursPerWeek} hours per week
                                      </span>
                                    </div>
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
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                groupedEntries.length
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, groupedEntries.length)}{" "}
              of {groupedEntries.length} roles
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => page - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
              <div className="sm:hidden">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
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
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete the assignment for{" "}
              <span className="font-medium text-foreground">
                {assignmentToDelete?.role.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium">Time Type:</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                  assignmentToDelete?.timeType.isCapDev
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-200"
                }`}
              >
                {assignmentToDelete?.timeType.name}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-sm font-medium">Hours per week:</span>{" "}
              <span className="text-sm">
                {assignmentToDelete?.hoursPerWeek}
              </span>
            </div>
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
                assignmentToDelete?.id && handleDelete(assignmentToDelete.id)
              }
              disabled={deleteMutation.isPending || !assignmentToDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
