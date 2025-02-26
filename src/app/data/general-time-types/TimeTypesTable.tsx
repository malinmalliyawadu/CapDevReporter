"use client";

import * as React from "react";
import { useState } from "react";
import { Plus, Search, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";

interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
  generalAssignments: {
    id: string;
    role: {
      id: string;
      name: string;
    };
    hoursPerWeek: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface TimeTypesTableProps {
  initialTimeTypes: TimeType[];
}

export function TimeTypesTable({ initialTimeTypes }: TimeTypesTableProps) {
  const { toast } = useToast();
  const [timeTypes, setTimeTypes] = useState(initialTimeTypes);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [isCapDev, setIsCapDev] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [timeTypeToDelete, setTimeTypeToDelete] = useState<TimeType | null>(
    null
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns: ColumnDef<TimeType>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="pl-0"
        >
          Type Name
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      id: "usage",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="pl-0"
        >
          Usage Stats
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => {
        const assignments = row.original.generalAssignments;
        const totalHoursPerWeek = assignments.reduce(
          (sum, assignment) => sum + assignment.hoursPerWeek,
          0
        );
        const uniqueRoles = new Set(
          assignments.map((assignment) => assignment.role.name)
        );
        const rolesList = Array.from(uniqueRoles).sort();

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    assignments.length > 0
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                  }`}
                  title={
                    rolesList.length > 0
                      ? `Roles: ${rolesList.join(", ")}`
                      : "No roles assigned"
                  }
                  data-testid="role-count-badge"
                >
                  {uniqueRoles.size} {uniqueRoles.size === 1 ? "role" : "roles"}
                </span>
                {row.original.isCapDev && (
                  <span
                    className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100"
                    data-testid="capdev-badge"
                  >
                    CapDev
                  </span>
                )}
              </div>
            </div>
            {assignments.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800"
                    data-testid="usage-progress-container"
                  >
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (totalHoursPerWeek / (40 * uniqueRoles.size)) * 100,
                          100
                        )}%`,
                      }}
                      title={`${(
                        (totalHoursPerWeek / (40 * uniqueRoles.size)) *
                        100
                      ).toFixed(1)}% of total capacity`}
                      data-testid="usage-progress-bar"
                    />
                  </div>
                  <span
                    className="text-xs font-medium"
                    data-testid="total-hours"
                  >
                    {totalHoursPerWeek.toFixed(1)}h
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div
                    title="Total hours per week across all roles"
                    data-testid="total-hours-per-week"
                  >
                    <span className="font-medium">
                      {totalHoursPerWeek.toFixed(1)}
                    </span>{" "}
                    hours/week
                  </div>
                  <div
                    title="Average hours per week per role"
                    className="text-right"
                    data-testid="avg-hours-per-role"
                  >
                    <span className="font-medium">
                      {(totalHoursPerWeek / uniqueRoles.size).toFixed(1)}
                    </span>{" "}
                    avg/role
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      },
      sortingFn: (rowA, rowB) =>
        rowA.original.generalAssignments.length -
        rowB.original.generalAssignments.length,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDeleteClick(row.original)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-2">Delete</span>
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: timeTypes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  const handleAddTimeType = async () => {
    if (!newTypeName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a time type name",
        variant: "destructive",
      });
      return;
    }

    if (
      timeTypes.some(
        (type) => type.name.toLowerCase() === newTypeName.trim().toLowerCase()
      )
    ) {
      toast({
        title: "Error",
        description: "This time type already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/general-time-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTypeName.trim(),
          description: newTypeDescription.trim() || undefined,
          isCapDev,
        }),
      });

      if (!response.ok) throw new Error("Failed to create time type");

      const timeTypesResponse = await fetch("/api/general-time-types");
      const updatedTimeTypes = await timeTypesResponse.json();
      setTimeTypes(updatedTimeTypes);
      setOpen(false);
      setNewTypeName("");
      setNewTypeDescription("");
      setIsCapDev(false);
      toast({
        title: "Success",
        description: "Time type created successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create time type",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (timeType: TimeType) => {
    setTimeTypeToDelete(timeType);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!timeTypeToDelete) return;

    try {
      const response = await fetch(
        `/api/general-time-types/${timeTypeToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete time type");

      const timeTypesResponse = await fetch("/api/general-time-types");
      const updatedTimeTypes = await timeTypesResponse.json();
      setTimeTypes(updatedTimeTypes);
      setDeleteConfirmOpen(false);
      setTimeTypeToDelete(null);
      toast({
        title: "Success",
        description: "Time type deleted successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete time type",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="w-72">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search time types..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              data-testid="time-types-search"
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Time Type
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No time types found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Time Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="time-type-name">Time Type Name</Label>
              <Input
                id="time-type-name"
                type="text"
                placeholder="Administrative"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="time-type-description">Description</Label>
              <Input
                id="time-type-description"
                type="text"
                placeholder="General administrative tasks and emails"
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="cap-dev"
                checked={isCapDev}
                onCheckedChange={setIsCapDev}
              />
              <Label htmlFor="cap-dev">Capital Development</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setNewTypeName("");
                setNewTypeDescription("");
                setIsCapDev(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTimeType} disabled={!newTypeName.trim()}>
              Add Time Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the time type &quot;
              <span className="font-medium">{timeTypeToDelete?.name}</span>
              &quot;?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setTimeTypeToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
