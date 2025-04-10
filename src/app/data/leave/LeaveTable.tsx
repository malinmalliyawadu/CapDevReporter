"use client";

import * as React from "react";
import { use, useState } from "react";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { format } from "date-fns";

interface LeaveRecord {
  id: string;
  employee: { name: string };
  date: string;
  type: string;
  status: string;
  duration: number;
}

interface LeaveTableProps {
  initialLeaveRecordsPromise: Promise<LeaveRecord[]>;
}

export function LeaveTable({ initialLeaveRecordsPromise }: LeaveTableProps) {
  const leaveRecords = use(initialLeaveRecordsPromise);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "annual leave":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "sick leave":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "bereavement":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const columns: ColumnDef<LeaveRecord>[] = [
    {
      accessorKey: "employee.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
            data-testid="sort-button-employee"
          >
            Employee
            {column.getIsSorted() === "asc" ? (
              <ArrowUp
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-employee"
              />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-employee"
              />
            ) : (
              <ArrowUpDown
                className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
                data-testid="sort-icon-employee"
              />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium">{row.original.employee.name}</span>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
            data-testid="sort-button-date"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-date" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-date"
              />
            ) : (
              <ArrowUpDown
                className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
                data-testid="sort-icon-date"
              />
            )}
          </Button>
        );
      },
      cell: ({ row }) => format(new Date(row.original.date), "dd MMM yyyy"),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            getLeaveTypeColor(row.original.type)
          )}
        >
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            getStatusColor(row.original.status)
          )}
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "duration",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
            data-testid="sort-button-duration"
          >
            Duration
            {column.getIsSorted() === "asc" ? (
              <ArrowUp
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-duration"
              />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-duration"
              />
            ) : (
              <ArrowUpDown
                className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
                data-testid="sort-icon-duration"
              />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.duration} hour{row.original.duration !== 1 ? "s" : ""}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data: leaveRecords,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const uniqueStatuses = Array.from(
    new Set(leaveRecords.map((record) => record.status))
  );
  const uniqueTypes = Array.from(
    new Set(leaveRecords.map((record) => record.type))
  );

  return (
    <div>
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-4">
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => {
              const filter = value === "all" ? null : value;
              setStatusFilter(filter);
              table.getColumn("status")?.setFilterValue(filter);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter || "all"}
            onValueChange={(value) => {
              const filter = value === "all" ? null : value;
              setTypeFilter(filter);
              table.getColumn("type")?.setFilterValue(filter);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Leave Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No leave records found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
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

      <div className="flex items-center justify-between pt-4">
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
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize} rows
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
