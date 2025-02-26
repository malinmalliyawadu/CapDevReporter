"use client";

import * as React from "react";
import { useState } from "react";
import { RefreshCw, Search, ChevronDown } from "lucide-react";
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
import { toast } from "sonner";
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
import { syncLeaveRecords } from "./actions";

interface LeaveRecord {
  id: string;
  employee: { name: string };
  date: string;
  type: string;
  status: string;
  duration: number;
}

interface LeaveTableProps {
  initialLeaveRecords: LeaveRecord[];
}

export function LeaveTable({ initialLeaveRecords }: LeaveTableProps) {
  const [leaveRecords] = useState(initialLeaveRecords);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Employee
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.employee.name}</span>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      ),
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Duration
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.duration} day{row.original.duration !== 1 ? "s" : ""}
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

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const result = await syncLeaveRecords();

      if (!result.success) {
        throw new Error(result.error);
      }

      // The page will automatically revalidate and refresh the data
      setLastSynced(new Date());
      toast.success("Leave data synced successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync leave data");
    } finally {
      setIsSyncing(false);
    }
  };

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
        <div className="flex items-center gap-4">
          {lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString("en-NZ")}
            </span>
          )}
          <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            Sync with iPayroll
          </Button>
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

      <div className="flex items-center justify-between p-4 border-t">
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
