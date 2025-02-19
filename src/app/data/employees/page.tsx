"use client";

import { useState } from "react";
import {
  User,
  RefreshCw,
  AlertCircle,
  Pencil,
  ChevronDown,
  ChevronUp,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Employee {
  id: string;
  name: string;
  payrollId: string;
  role: {
    name: string;
  };
  hoursPerWeek: number;
}

export default function EmployeesPage() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string;
    name: string;
    hoursPerWeek: number;
  } | null>(null);

  const { data: employees, refetch: refetchEmployees } =
    trpc.employee.getAll.useQuery();

  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
    },
    {
      accessorKey: "payrollId",
      header: () => "Payroll ID",
    },
    {
      accessorKey: "role.name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Role
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
    },
    {
      accessorKey: "hoursPerWeek",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Hours per Week
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-2 h-4 w-4" />
          ) : null}
        </Button>
      ),
      cell: ({ row }: { row: { original: Employee } }) => (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {row.original.hoursPerWeek || "-"}
            {!row.original.hoursPerWeek && (
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
                hoursPerWeek: row.original.hoursPerWeek,
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
    data: employees || [],
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

  const { mutate: updateHours } = trpc.employee.updateHoursPerWeek.useMutation({
    onSuccess: () => {
      refetchEmployees();
      setEditingEmployee(null);
      toast.success("Hours updated successfully");
    },
    onError: () => {
      toast.error("Failed to update hours");
    },
  });

  const handleSync = async () => {
    setIsSyncing(true);
    syncEmployees();
  };

  const handleUpdateHours = () => {
    if (!editingEmployee) return;

    const hours = Number(editingEmployee.hoursPerWeek);
    if (isNaN(hours) || hours < 0 || hours > 168) {
      toast.error("Please enter a valid number of hours (0-168)");
      return;
    }

    updateHours({
      id: editingEmployee.id,
      hoursPerWeek: hours,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <User className="h-7 w-7 text-green-500" />
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Employees
              </span>
            </span>
          }
          description="View and manage employees."
        />
        <Button onClick={handleSync} disabled={isSyncing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
          />
          Sync with iPayroll
        </Button>
      </div>

      {lastSynced && (
        <div className="text-sm text-muted-foreground">
          Last synced: {lastSynced.toLocaleString("en-NZ")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
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
                (table.getColumn("role.name")?.getFilterValue() as string) ??
                "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("role.name")
                  ?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {Array.from(
                  new Set(employees?.map((emp) => emp.role.name) || [])
                ).map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
        </CardContent>
      </Card>

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
