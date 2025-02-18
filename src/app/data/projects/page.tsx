"use client";

import * as React from "react";
import { useState } from "react";
import {
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { RouterOutputs, trpc } from "@/trpc/client";

type Project = RouterOutputs["project"]["getAll"][number];

export default function ProjectsPage() {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const { data: projects, isLoading: isLoadingProjects } =
    trpc.project.getAll.useQuery();
  const { data: teams } = trpc.team.getAll.useQuery();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncProjects = trpc.project.sync.useMutation({
    onSuccess: (data) => {
      utils.project.getAll.invalidate();
      setLastSynced(new Date(data.timestamp));
      setIsSyncing(false);
      toast({
        title: "Success",
        description: "Projects synced with Jira",
      });
    },
    onError: () => {
      setIsSyncing(false);
      toast({
        title: "Error",
        description: "Failed to sync projects with Jira",
        variant: "destructive",
      });
    },
  });

  const handleSync = () => {
    setIsSyncing(true);
    syncProjects.mutate();
  };

  const columns: ColumnDef<Project>[] = [
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
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            Project Name
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
      accessorKey: "jiraId",
      header: "Jira ID",
      cell: ({ row }) => (
        <a
          href={`${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${row.original.jiraId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 hover:underline"
        >
          {row.original.jiraId}
        </a>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "team.name",
      id: "teamName",
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
      accessorKey: "isCapDev",
      header: "Type",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            row.original.isCapDev
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.original.isCapDev ? "CapDev" : "Non-CapDev"}
        </span>
      ),
    },
  ];

  const renderSubRow = (row: Project) => {
    const activityDates = row.timeEntries
      .map((entry) => new Date(entry.date))
      .sort((a, b) => b.getTime() - a.getTime());

    const uniqueDates = Array.from(
      new Set(activityDates.map((date) => date.toISOString().split("T")[0]))
    ).map((dateStr) => new Date(dateStr));

    return (
      <TableRow key={`${row.id}-expanded`} className="bg-muted/50">
        <TableCell colSpan={columns.length} className="p-4">
          <div className="rounded-md border">
            <div className="bg-muted px-4 py-2 font-medium border-b flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Activity Dates</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {uniqueDates.map((date, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-md bg-background"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(date, "dd MMM yyyy")}
                    </span>
                  </div>
                ))}
              </div>
              {uniqueDates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No activity dates recorded
                </p>
              )}
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const table = useReactTable({
    data: projects ?? [],
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

  if (isLoadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="View and manage projects synced from Jira."
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter projects..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="pl-8 max-w-sm"
            />
          </div>
          <Select
            value={
              (table.getColumn("teamName")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("teamName")
                ?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((team: RouterOutputs["team"]["getAll"][number]) => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={
              (table.getColumn("isCapDev")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) => {
              if (value === "all") {
                table.getColumn("isCapDev")?.setFilterValue("");
              } else {
                table.getColumn("isCapDev")?.setFilterValue(value === "true");
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="true">CapDev</SelectItem>
              <SelectItem value="false">Non-CapDev</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-auto"
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
          />
          {isSyncing ? "Syncing..." : "Sync with Jira"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Project List</CardTitle>
            {lastSynced && (
              <p className="text-sm text-muted-foreground">
                Last synced: {lastSynced.toLocaleString()}
              </p>
            )}
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
                      <TableRow>
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
                      No projects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} project(s) total
            </div>
            <div className="flex items-center space-x-2">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
