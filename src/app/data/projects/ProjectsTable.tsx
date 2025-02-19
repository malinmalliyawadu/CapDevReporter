"use client";

import * as React from "react";
import { useState } from "react";
import {
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
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
import { useToast } from "@/hooks/use-toast";
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

interface Project {
  id: string;
  name: string;
  description: string | null;
  jiraId: string;
  isCapDev: boolean;
  board: {
    team: {
      name: string;
    };
  };
  timeEntries: TimeEntry[];
  activities?: ProjectActivity[];
}

interface TimeEntry {
  date: string | Date;
}

interface ProjectActivity {
  activityDate: string | Date;
  jiraIssueId: string;
}

interface ProjectsTableProps {
  initialProjects: Project[];
}

export function ProjectsTable({ initialProjects }: ProjectsTableProps) {
  const { toast } = useToast();
  const [projects, setProjects] = useState(initialProjects);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/projects", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to sync");

      const projectsResponse = await fetch("/api/projects");
      const updatedProjects = await projectsResponse.json();
      setProjects(updatedProjects);
      setLastSynced(new Date());

      toast({
        title: "Success",
        description: "Projects synced with Jira",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync projects with Jira",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
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
      accessorKey: "board.team.name",
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
    // Sort activities by date in descending order
    const sortedActivities = [...(row.activities || [])].sort(
      (a, b) =>
        new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime()
    );

    return (
      <TableRow key={`${row.id}-expanded`} className="bg-muted/50">
        <TableCell colSpan={columns.length} className="p-4">
          <div className="text-sm">
            <div className="font-medium mb-2">Activity Dates</div>
            {sortedActivities.length > 0 ? (
              <div className="space-y-1">
                {sortedActivities.map((activity, index) => (
                  <div key={index} className="text-muted-foreground">
                    {format(new Date(activity.activityDate), "dd MMM yyyy")}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No activity recorded</p>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const table = useReactTable({
    data: projects,
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

  return (
    <div>
      <div className="flex items-center justify-end gap-4 mb-4">
        {lastSynced && (
          <span className="text-sm text-muted-foreground">
            Last synced: {lastSynced.toLocaleString("en-NZ")}
          </span>
        )}
        <Button onClick={handleSync} disabled={isSyncing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
          />
          Sync with Jira
        </Button>
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
    </div>
  );
}
