"use client";

import * as React from "react";
import { useState } from "react";
import {
  AlertCircle,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
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
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import { updateEmployeeHours } from "./actions";

interface Employee {
  id: string;
  name: string;
  payrollId: string;
  role: {
    name: string;
  };
  hoursPerWeek: number;
}

interface Role {
  id: string;
  name: string;
}

interface EmployeesTableProps {
  initialEmployees: Employee[];
  roles: Role[];
}

export function EmployeesTable({
  initialEmployees,
  roles,
}: EmployeesTableProps) {
  const { toast } = useToast();
  const [employees] = useState(initialEmployees);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string;
    name: string;
    hoursPerWeek: number;
  } | null>(null);

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
          data-testid="sort-button-name"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-name" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-name" />
          ) : (
            <ArrowUpDown
              className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
              data-testid="sort-icon-name"
            />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "payrollId",
      header: () => "Payroll ID",
    },
    {
      id: "role",
      accessorFn: (row) => row.role.name,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
          data-testid="sort-button-role"
        >
          Role
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-role" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-role" />
          ) : (
            <ArrowUpDown
              className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
              data-testid="sort-icon-role"
            />
          )}
        </Button>
      ),
      filterFn: (row, columnId, filterValue) => {
        const roleName = row.getValue(columnId) as string;
        return filterValue === "all" || roleName === filterValue;
      },
    },
    {
      accessorKey: "hoursPerWeek",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
          data-testid="sort-button-hours"
        >
          Hours per Week
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-hours" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-hours" />
          ) : (
            <ArrowUpDown
              className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
              data-testid="sort-icon-hours"
            />
          )}
        </Button>
      ),
      cell: ({ row }: { row: { original: Employee } }) => (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {row.original.hoursPerWeek ?? "-"}
            {row.original.hoursPerWeek === null && (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setEditingEmployee({
                id: row.original.id,
                name: row.original.name,
                hoursPerWeek: row.original.hoursPerWeek ?? 0,
              })
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: employees,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleUpdateHours = async () => {
    if (!editingEmployee) return;

    const hours = Number(editingEmployee.hoursPerWeek);
    if (isNaN(hours) || hours < 0 || hours > 168) {
      toast({
        title: "Error",
        description: "Please enter a valid number of hours (0-168)",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await updateEmployeeHours(editingEmployee.id, hours);

      if (result.error) {
        throw new Error(result.error);
      }

      setEditingEmployee(null);
      toast({
        title: "Success",
        description: "Hours updated successfully",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update hours",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select
            value={
              (table.getColumn("role")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("role")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]" data-testid="role-filter">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
