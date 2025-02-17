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
import { useState, useEffect } from "react";
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
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { timeTypes } from "@/data/timeTypes";
import { teams } from "@/data/teams";
import { roles } from "@/data/roles";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { TimeEntry } from "@/types/timeEntry";

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

// Add this color palette for the detailed chart
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

export function ReportsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(subYears(new Date(), 1)),
    to: endOfYear(new Date()),
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<TimeReport | null>(null);
  const [timeReport, setTimeReport] = useState<TimeReport[]>(timeReports);

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

  // Add this handler function
  const handleFilterChange = (columnId: string, value: string) => {
    const filterValue = value === "All" ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(filterValue);
  };

  const columns: ColumnDef<TimeReport>[] = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return (
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
        );
      },
    },
    {
      accessorKey: "user",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            User
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
      header: "Full Hours",
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

  const renderSubRow = (row: TimeReport) => {
    return (
      <TableRow key={`${row.id}-expanded`} className="bg-muted/50">
        <TableCell colSpan={columns.length} className="p-4">
          <div className="rounded-md border">
            <div className="bg-muted px-4 py-2 font-medium border-b flex justify-between items-center">
              <span>Time Entries</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingReport(row);
                  setSelectedEntry(null);
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
            <div className="divide-y">
              {row.timeEntries.map((entry, index) => {
                const timeType = timeTypes.find(
                  (t) => t.id === entry.timeTypeId
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {timeType?.name || "Unknown"}
                      </span>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReport(row);
                          setSelectedEntry(entry);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(row, entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);

  // Calculate detailed time type data
  const timeTypeHours = new Map<
    number,
    { hours: number; isCapDev: boolean; name: string }
  >();

  filteredData.forEach((report) => {
    report.timeEntries.forEach((entry) => {
      const current = timeTypeHours.get(entry.timeTypeId) || {
        hours: 0,
        isCapDev: entry.isCapDev,
        name:
          timeTypes.find((t) => t.id === entry.timeTypeId)?.name || "Unknown",
      };
      current.hours += entry.hours;
      timeTypeHours.set(entry.timeTypeId, current);
    });
  });

  // Calculate rolled up CapDev data
  const totalCapDevHours = Array.from(timeTypeHours.values())
    .filter((data) => data.isCapDev)
    .reduce((sum, data) => sum + data.hours, 0);

  const totalNonCapDevHours = Array.from(timeTypeHours.values())
    .filter((data) => !data.isCapDev)
    .reduce((sum, data) => sum + data.hours, 0);

  const rolledUpData = [
    { name: "CapDev", value: totalCapDevHours, color: "#0ea5e9" },
    { name: "Non-CapDev", value: totalNonCapDevHours, color: "#f43f5e" },
  ];

  const detailedChartData = Array.from(timeTypeHours.entries()).map(
    ([, data], index) => ({
      name: data.name,
      value: data.hours,
      color: timeTypeColors[index % timeTypeColors.length],
      isCapDev: data.isCapDev, // Keep this for the indicator
    })
  );

  const totalTime = rolledUpData.reduce((sum, item) => sum + item.value, 0);
  const totalDetailedTime = detailedChartData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  // Add this function to handle entry updates
  const handleEntrySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const newEntry = {
      id: selectedEntry?.id || Date.now(),
      timeTypeId: Number(formData.get("timeTypeId")),
      hours: Number(formData.get("hours")),
      isCapDev: Boolean(formData.get("isCapDev")),
    };

    if (editingReport) {
      const updatedTimeEntries = selectedEntry
        ? editingReport.timeEntries.map((entry) =>
            entry.id === selectedEntry.id ? newEntry : entry
          )
        : [...editingReport.timeEntries, newEntry];

      // Update the timeReports array with the new entry
      // Note: You'll need to implement proper state management here
      // This is just an example assuming local state
      const updatedReports = timeReport?.map((report) =>
        report.id === editingReport.id
          ? { ...report, timeEntries: updatedTimeEntries }
          : report
      );

      // Update your state management here
      setTimeReport(updatedReports);
    }

    setIsDialogOpen(false);
    setSelectedEntry(null);
    setEditingReport(null);
  };

  // Add this function to handle entry deletion
  const handleDeleteEntry = (report: TimeReport, entryId: number) => {
    const updatedTimeEntries = report.timeEntries.filter(
      (entry) => entry.id !== entryId
    );

    // Update the timeReports array without the deleted entry
    // Note: You'll need to implement proper state management here
    const updatedReports = timeReport.map((r) =>
      r.id === report.id ? { ...r, timeEntries: updatedTimeEntries } : r
    );

    // Update your state management here
    setTimeReport(updatedReports);
  };

  // Add this dialog component before the return statement
  const entryDialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedEntry ? "Edit Time Entry" : "Add Time Entry"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEntrySubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timeTypeId">Time Type</Label>
            <Select
              name="timeTypeId"
              defaultValue={selectedEntry?.timeTypeId.toString()}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time type" />
              </SelectTrigger>
              <SelectContent>
                {timeTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Hours</Label>
            <Input
              id="hours"
              name="hours"
              type="number"
              step="0.1"
              defaultValue={selectedEntry?.hours}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="isCapDev"
              name="isCapDev"
              type="checkbox"
              defaultChecked={selectedEntry?.isCapDev}
            />
            <Label htmlFor="isCapDev">CapDev Time</Label>
          </div>

          <DialogFooter>
            <Button type="submit">
              {selectedEntry ? "Save Changes" : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
                placeholder="Filter users..."
                value={
                  (table.getColumn("user")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("user")?.setFilterValue(event.target.value)
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
                    <>
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
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
                    </>
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
      {entryDialog}
    </div>
  );
}
