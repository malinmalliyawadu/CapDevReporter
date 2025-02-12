import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

// Define the type for our data
type TimeReport = {
  id: string;
  user: string;
  week: string;
  payrollId: string;
  fullHours: number;
  capdevTime: number;
  nonCapdevTime: number;
  team: string;
  role: string;
};

// Sample data
const data: TimeReport[] = [
  {
    id: "1",
    user: "John Doe",
    week: "2024-W10",
    payrollId: "EMP001",
    fullHours: 40,
    capdevTime: 32,
    nonCapdevTime: 8,
    team: "Engineering",
    role: "Software Engineer",
  },
  {
    id: "2",
    user: "Jane Smith",
    week: "2024-W10",
    payrollId: "EMP002",
    fullHours: 40,
    capdevTime: 24,
    nonCapdevTime: 16,
    team: "Design",
    role: "UX Designer",
  },
  // Add more dummy data as needed
];

// Add this function before the component
const exportToCsv = (data: TimeReport[]) => {
  const headers = [
    "User",
    "Week",
    "Payroll ID",
    "Full Hours",
    "CapDev Time",
    "Non-CapDev Time",
    "Team",
    "Role",
  ];

  const csvData = data.map((row) => [
    row.user,
    row.week,
    row.payrollId,
    row.fullHours,
    row.capdevTime,
    row.nonCapdevTime,
    row.team,
    row.role,
  ]);

  const csvContent = [
    headers.join(","),
    ...csvData.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `time-report-${new Date().toISOString()}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function ReportsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<TimeReport>[] = [
    {
      accessorKey: "user",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={
              column.getIsSorted()
                ? "bg-muted hover:bg-muted"
                : "hover:bg-muted/50"
            }
          >
            User
            {column.getIsSorted() &&
              (column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              ))}
          </Button>
        );
      },
    },
    {
      accessorKey: "week",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={
              column.getIsSorted()
                ? "bg-muted hover:bg-muted"
                : "hover:bg-muted/50"
            }
          >
            Week
            {column.getIsSorted() &&
              (column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              ))}
          </Button>
        );
      },
    },
    {
      accessorKey: "payrollId",
      header: "Payroll ID",
    },
    {
      accessorKey: "fullHours",
      header: "Full Hours",
    },
    {
      accessorKey: "capdevTime",
      header: "CapDev Time",
    },
    {
      accessorKey: "nonCapdevTime",
      header: "Non-CapDev Time",
    },
    {
      accessorKey: "team",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={
              column.getIsSorted()
                ? "bg-muted hover:bg-muted"
                : "hover:bg-muted/50"
            }
          >
            Team
            {column.getIsSorted() &&
              (column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              ))}
          </Button>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className={
              column.getIsSorted()
                ? "bg-muted hover:bg-muted"
                : "hover:bg-muted/50"
            }
          >
            Role
            {column.getIsSorted() &&
              (column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              ))}
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Time Reports</h1>
        <p className="text-muted-foreground">
          View and analyze time tracking reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Time Report</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportToCsv(
                  table.getFilteredRowModel().rows.map((row) => row.original)
                )
              }
              className="ml-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <div className="flex items-center gap-4 py-4">
            <Input
              placeholder="Filter users..."
              value={
                (table.getColumn("user")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("user")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Select
              value={
                (table.getColumn("team")?.getFilterValue() as string) ?? ""
              }
              onValueChange={(value) =>
                table.getColumn("team")?.setFilterValue(value)
              }
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Teams</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={
                (table.getColumn("role")?.getFilterValue() as string) ?? ""
              }
              onValueChange={(value) =>
                table.getColumn("role")?.setFilterValue(value)
              }
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Roles</SelectItem>
                <SelectItem value="Software Engineer">
                  Software Engineer
                </SelectItem>
                <SelectItem value="UX Designer">UX Designer</SelectItem>
                <SelectItem value="Project Manager">Project Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
                {table.getRowModel().rows?.length ? (
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
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
