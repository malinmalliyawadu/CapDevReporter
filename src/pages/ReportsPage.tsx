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
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { timeReports } from "@/data/timeReports";
import type { TimeReport } from "@/types/timeReport";

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

// Add this helper function before the ReportsPage component
const getCurrentWeek = () => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - monday.getDay() + 1); // Set to Monday of current week
  return monday.toISOString().split("T")[0]; // Format as YYYY-MM-DD
};

// Add this helper function to generate weeks for the last 24 months
const getLastTwoYearsWeeks = () => {
  const weeks = [];
  const now = new Date();

  // Go back 24 months
  for (let i = 0; i < 24 * 4.33; i++) {
    // approximately 4.33 weeks per month
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);

    // Find Monday of this week
    const monday = new Date(date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);

    weeks.push(monday.toISOString().split("T")[0]); // Format as YYYY-MM-DD
  }

  return [...new Set(weeks)].sort().reverse(); // Remove duplicates and sort descending
};

export function ReportsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {
      id: "week",
      value: getCurrentWeek(),
    },
  ]);

  // Add this handler function
  const handleFilterChange = (columnId: string, value: string) => {
    const filterValue = value === "All" ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(filterValue);
  };

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
    data: timeReports,
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

  // Calculate totals and percentages for the pie chart from filtered data
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const totalCapdev = filteredData.reduce(
    (sum, row) => sum + row.capdevTime,
    0
  );
  const totalNonCapdev = filteredData.reduce(
    (sum, row) => sum + row.nonCapdevTime,
    0
  );
  const totalTime = totalCapdev + totalNonCapdev;

  const capdevPercentage = totalTime > 0 ? (totalCapdev / totalTime) * 100 : 0;
  const nonCapdevPercentage =
    totalTime > 0 ? (totalNonCapdev / totalTime) * 100 : 0;

  const chartData = [
    { name: "CapDev Time", value: capdevPercentage, color: "#0ea5e9" }, // sky-500
    { name: "Non-CapDev Time", value: nonCapdevPercentage, color: "#f43f5e" }, // rose-500
  ];

  // Get the weeks once when component mounts
  const availableWeeks = getLastTwoYearsWeeks();

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight animate-slide-down">
          Time Reports
        </h1>
        <p className="text-muted-foreground">
          View and analyze time tracking reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-sm font-medium">CapDev Time</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {capdevPercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({totalCapdev.toFixed(1)} hours)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm font-medium">Non-CapDev Time</span>
                </div>
                <div className="text-right">
                  <span className="font-medium">
                    {nonCapdevPercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({totalNonCapdev.toFixed(1)} hours)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                (table.getColumn("week")?.getFilterValue() as string) ?? ""
              }
              onValueChange={(value) => handleFilterChange("week", value)}
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue placeholder="Filter by week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">Last Two Years</SelectItem>
                {availableWeeks.map((week) => (
                  <SelectItem key={week} value={week}>
                    {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={
                (table.getColumn("team")?.getFilterValue() as string) ?? ""
              }
              onValueChange={(value) => handleFilterChange("team", value)}
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
              onValueChange={(value) => handleFilterChange("role", value)}
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
