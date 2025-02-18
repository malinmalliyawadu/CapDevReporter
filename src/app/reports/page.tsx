"use client";

import React, { useState, useEffect } from "react";
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
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table";
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
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronDown,
  ChevronRight,
  BarChart,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TimeReport, TimeReportEntry } from "@/types/timeReport";
import { PageHeader } from "@/components/ui/page-header";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  parseISO,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
} from "date-fns";
import { trpc } from "@/trpc/client";
import { ErrorBoundary } from "react-error-boundary";

// Add color palette for the detailed chart
const timeTypeColors = [
  "#2563eb", // blue-600
  "#db2777", // pink-600
  "#16a34a", // green-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0891b2", // cyan-600
  "#4f46e5", // indigo-600
  "#be123c", // rose-600
  "#15803d", // green-700
  "#7c3aed", // violet-600
  "#c2410c", // orange-700
  "#0369a1", // sky-700
  "#6d28d9", // purple-700
  "#be185d", // pink-700
  "#1d4ed8", // blue-700
];

// Add this function before the component
const exportToCsv = (data: TimeReport[]) => {
  const headers = [
    "Employee",
    "Week",
    "Payroll ID",
    "Full Hours",
    "CapDev Time",
    "Non-CapDev Time",
    "Team",
    "Role",
  ];

  const csvData = data.map((row) => [
    row.employeeName,
    row.week,
    row.payrollId,
    row.fullHours,
    row.timeEntries
      .filter((entry) => entry.isCapDev)
      .reduce((sum, entry) => sum + entry.hours, 0),
    row.timeEntries
      .filter((entry) => !entry.isCapDev)
      .reduce((sum, entry) => sum + entry.hours, 0),
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

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="p-3 rounded-full bg-red-100 text-red-600">
          <XCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ReportsContent />
    </ErrorBoundary>
  );
}

function ReportsContent() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(subYears(new Date(), 1)),
    to: new Date(),
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const { data, isLoading } = trpc.timeReports.getAll.useQuery(
    {
      dateRange: {
        from: (dateRange.from ?? new Date()).toDateString(),
        to: (dateRange.to ?? new Date()).toDateString(),
      },
    },
    {
      retry: 3,
      retryDelay: 1000,
    }
  );

  const timeReport = data?.timeReports ?? [];
  const timeTypes = data?.timeTypes ?? [];
  const teams = data?.teams ?? [];
  const roles = data?.roles ?? [];

  const handleFilterChange = (columnId: string, value: string) => {
    const filterValue = value === "All" ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(filterValue);
  };

  const columns: ColumnDef<TimeReport>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        const isUnderutilized = row.original.isUnderutilized;
        const missingHours = row.original.missingHours;
        const reason = row.original.underutilizationReason;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                row.toggleExpanded();
              }}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            {isUnderutilized && (
              <div
                className="text-amber-500 dark:text-amber-400"
                title={`${missingHours.toFixed(
                  1
                )} hours under target\nReason: ${reason}`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "employeeName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            Employee
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
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
            className="group"
          >
            Week
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        );
      },
      filterFn: (row) => {
        if (!dateRange?.from) return true;
        const date = parseISO(row.getValue("week"));
        return isWithinInterval(date, {
          start: dateRange.from,
          end: dateRange.to || new Date(),
        });
      },
    },
    {
      accessorKey: "payrollId",
      header: "Payroll ID",
    },
    {
      accessorKey: "fullHours",
      header: "Total Hours",
      cell: ({ row }) => {
        const hours = row.original.fullHours;
        const expectedHours = row.original.expectedHours;
        const isUnderutilized = row.original.isUnderutilized;
        const missingHours = row.original.missingHours;
        const reason = row.original.underutilizationReason;

        return (
          <div className="flex items-center gap-2">
            <span
              className={
                isUnderutilized
                  ? "text-amber-600 dark:text-amber-400 font-medium"
                  : ""
              }
            >
              {hours.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {expectedHours.toFixed(1)}
            </span>
            {isUnderutilized && (
              <div
                className="text-amber-500 dark:text-amber-400"
                title={`${missingHours.toFixed(
                  1
                )} hours under target\nReason: ${reason}`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "capdevTime",
      header: "CapDev Time",
      cell: ({ row }) => {
        const capdevHours = row.original.timeEntries
          .filter((entry) => entry.isCapDev)
          .reduce((sum, entry) => sum + entry.hours, 0);
        return capdevHours.toFixed(1);
      },
    },
    {
      accessorKey: "nonCapdevTime",
      header: "Non-CapDev Time",
      cell: ({ row }) => {
        const nonCapdevHours = row.original.timeEntries
          .filter((entry) => !entry.isCapDev)
          .reduce((sum, entry) => sum + entry.hours, 0);
        return nonCapdevHours.toFixed(1);
      },
    },
    {
      accessorKey: "team",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            Team
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
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
            className="group"
          >
            Role
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: timeReport,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
  });

  useEffect(() => {
    if (dateRange?.from) {
      table.getColumn("week")?.setFilterValue(dateRange);
    }
  }, [dateRange, table]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">No data available</h3>
          <p className="text-sm text-muted-foreground">
            Please try again later or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);

  const datePresets = [
    {
      label: "This Week",
      value: {
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
    },
    {
      label: "Last Week",
      value: {
        from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
        to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      },
    },
    {
      label: "This Month",
      value: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: "Last Month",
      value: {
        from: startOfMonth(subMonths(new Date(), 1)),
        to: endOfMonth(subMonths(new Date(), 1)),
      },
    },
    {
      label: "This Year",
      value: {
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
      },
    },
    {
      label: "Last 2 Years",
      value: {
        from: startOfYear(subYears(new Date(), 1)),
        to: endOfYear(new Date()),
      },
    },
  ];

  // Calculate detailed time type data including leave
  const timeTypeHours = new Map<
    string,
    { hours: number; isCapDev: boolean; name: string; isLeave?: boolean }
  >();

  filteredData.forEach((report) => {
    report.timeEntries.forEach((entry: TimeReportEntry) => {
      const key = entry.isLeave ? "leave" : entry.timeTypeId;
      const current = timeTypeHours.get(key) || {
        hours: 0,
        isCapDev: entry.isCapDev,
        name: entry.isLeave
          ? "Leave"
          : timeTypes.find((t) => t.id === entry.timeTypeId)?.name ||
            "Projects",
        isLeave: entry.isLeave,
      };
      current.hours += Math.abs(entry.hours); // Use absolute value for leave hours
      timeTypeHours.set(key, current);
    });
  });

  // Calculate rolled up CapDev data (excluding leave)
  const totalCapDevHours = Array.from(timeTypeHours.values())
    .filter((data) => !data.isLeave && data.isCapDev)
    .reduce((sum, data) => sum + data.hours, 0);

  const totalNonCapDevHours = Array.from(timeTypeHours.values())
    .filter((data) => !data.isLeave && !data.isCapDev)
    .reduce((sum, data) => sum + data.hours, 0);

  const totalLeaveHours = Array.from(timeTypeHours.values())
    .filter((data) => data.isLeave)
    .reduce((sum, data) => sum + data.hours, 0);

  const rolledUpData = [
    { name: "CapDev", value: totalCapDevHours, color: "#0ea5e9" },
    { name: "Non-CapDev", value: totalNonCapDevHours, color: "#f43f5e" },
    { name: "Leave", value: totalLeaveHours, color: "#f97316" },
  ];

  const detailedChartData = Array.from(timeTypeHours.entries()).map(
    ([, data], index) => ({
      name: data.name,
      value: data.hours,
      color: data.isLeave
        ? "#f97316"
        : timeTypeColors[index % timeTypeColors.length],
      isCapDev: data.isCapDev,
      isLeave: data.isLeave,
    })
  );

  const totalTime = rolledUpData.reduce((sum, item) => sum + item.value, 0);
  const totalDetailedTime = detailedChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const renderSubRow = (row: TimeReport) => {
    return (
      <TableRow key={`${row.id}-expanded`} className="bg-muted/50">
        <TableCell colSpan={columns.length} className="p-4">
          <div className="rounded-md border">
            <div className="bg-muted px-4 py-2 font-medium border-b">
              <span>Time Entries</span>
            </div>
            <div className="divide-y">
              {row.timeEntries.map((entry: TimeReportEntry, index) => {
                if (entry.isPublicHoliday) {
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {entry.publicHolidayName}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-900 px-2 py-0.5 text-xs font-medium text-purple-800 dark:text-purple-100">
                          Public Holiday
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {entry.hours} hours
                        </span>
                      </div>
                    </div>
                  );
                }

                if (entry.isLeave) {
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {entry.leaveType}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900 px-2 py-0.5 text-xs font-medium text-orange-800 dark:text-orange-100">
                          Leave
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {Math.abs(entry.hours / 8)} day(s)
                        </span>
                      </div>
                    </div>
                  );
                }

                const timeType = timeTypes.find(
                  (t) => t.id === entry.timeTypeId
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-2">
                      {entry.jiraId ? (
                        <>
                          <a
                            href={entry.jiraUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline"
                          >
                            {entry.jiraId}
                          </a>
                          <span className="text-muted-foreground">
                            {entry.projectName}
                          </span>
                        </>
                      ) : (
                        <span className="font-medium">
                          {timeType?.name || "Projects"}
                        </span>
                      )}
                      {entry.isCapDev && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                          CapDev
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {entry.hours.toFixed(1)} hours
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <BarChart className="h-6 w-6 text-rose-500" />
            Time Reports
          </span>
        }
        description="View and analyze time tracking reports."
      />

      <div className="sticky top-4 z-10">
        <Card className="mb-6 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Input
                placeholder="Filter employees..."
                value={
                  (table
                    .getColumn("employeeName")
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn("employeeName")
                    ?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={(range) => {
                  if (range) {
                    setDateRange(range);
                  }
                }}
                presets={datePresets}
              />
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
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
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
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Rolled Up Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rolledUpData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {rolledUpData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toFixed(1)} hours (${(
                        (value / totalTime) *
                        100
                      ).toFixed(1)}%)`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {rolledUpData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {((item.value / totalTime) * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.value.toFixed(1)} hours)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Detailed Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={detailedChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {detailedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `${value.toFixed(1)} hours (${(
                        (value / totalDetailedTime) *
                        100
                      ).toFixed(1)}%)`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {detailedChartData.map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium flex items-center gap-2">
                      {item.name}
                      {item.isCapDev && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                          CapDev
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">
                      {((item.value / totalDetailedTime) * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({item.value.toFixed(1)} hours)
                    </span>
                  </div>
                </div>
              ))}
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
                    <React.Fragment key={row.id}>
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={
                          row.original.isUnderutilized
                            ? "bg-amber-50 dark:bg-amber-950/20"
                            : ""
                        }
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
                      {row.getIsExpanded() && renderSubRow(row.original)}
                    </React.Fragment>
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
