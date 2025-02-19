"use client";

import { useState } from "react";
import {
  Clock,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { trpc } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  flexRender,
} from "@tanstack/react-table";
import { Switch } from "@/components/ui/switch";

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  description: string | null;
  employeeId: string;
  projectId: string;
}

interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
  timeEntries: TimeEntry[];
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

export default function GeneralTimeTypesPage() {
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

  const { data: timeTypes, refetch: refetchTimeTypes } =
    trpc.timeType.getAll.useQuery();

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
                >
                  {uniqueRoles.size} {uniqueRoles.size === 1 ? "role" : "roles"}
                </span>
                {row.original.isCapDev && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                    CapDev
                  </span>
                )}
              </div>
            </div>
            {assignments.length > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
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
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {totalHoursPerWeek.toFixed(1)}h
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div title="Total hours per week across all roles">
                    <span className="font-medium">
                      {totalHoursPerWeek.toFixed(1)}
                    </span>{" "}
                    hours/week
                  </div>
                  <div
                    title="Average hours per week per role"
                    className="text-right"
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
        const hasEntries = row.original.timeEntries.length > 0;
        return (
          <Button
            variant="ghost"
            size="sm"
            className={`${
              hasEntries ? "text-gray-400" : "text-red-600 hover:text-red-700"
            }`}
            onClick={() => handleDeleteClick(row.original)}
            disabled={hasEntries}
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-2">Delete</span>
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: timeTypes || [],
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

  const { mutate: createTimeType } = trpc.timeType.create.useMutation({
    onSuccess: () => {
      refetchTimeTypes();
      setNewTypeName("");
      setNewTypeDescription("");
      setIsCapDev(false);
      toast.success("Time type created successfully");
    },
    onError: () => {
      toast.error("Failed to create time type");
    },
  });

  const { mutate: deleteTimeType } = trpc.timeType.delete.useMutation({
    onSuccess: () => {
      refetchTimeTypes();
      toast.success("Time type deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete time type");
    },
  });

  const handleAddTimeType = () => {
    if (!newTypeName.trim()) {
      toast.error("Please enter a time type name");
      return;
    }

    if (
      timeTypes?.some(
        (type) => type.name.toLowerCase() === newTypeName.trim().toLowerCase()
      )
    ) {
      toast.error("This time type already exists");
      return;
    }

    createTimeType({
      name: newTypeName.trim(),
      description: newTypeDescription.trim() || undefined,
      isCapDev,
    });
    setOpen(false);
    setNewTypeName("");
    setNewTypeDescription("");
    setIsCapDev(false);
  };

  const handleDeleteClick = (timeType: TimeType) => {
    setTimeTypeToDelete(timeType);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (timeTypeToDelete) {
      deleteTimeType(timeTypeToDelete.id);
      setDeleteConfirmOpen(false);
      setTimeTypeToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-7 w-7 text-amber-500" />
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Time Types
              </span>
            </span>
          }
          description="View and manage time tracking categories."
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Type
            </Button>
          </DialogTrigger>
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
              <Button
                onClick={handleAddTimeType}
                disabled={!newTypeName.trim()}
              >
                Add Time Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Type</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the time type &quot
              <span className="font-medium">{timeTypeToDelete?.name}</span>
              &quot?
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Time Type List</CardTitle>
            <div className="w-72">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search time types..."
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableCell colSpan={3} className="h-24 text-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
