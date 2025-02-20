"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { ProjectsPageQueryString } from "./page";

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
  totalProjects: number;
  searchParams: ProjectsPageQueryString;
}

export function ProjectsTable({
  initialProjects,
  totalProjects,
  searchParams,
}: ProjectsTableProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState(initialProjects);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(Number(searchParams.page) || 1);

  const uniqueTeams = useMemo(() => {
    const teams = new Set(projects.map((p) => p.board.team.name));
    return Array.from(teams).sort();
  }, [projects]);

  // Effect to handle automatic row expansion when projectId is present
  useEffect(() => {
    if (searchParams.projectId) {
      const projectToExpand = projects.find(
        (p) => p.id === searchParams.projectId
      );
      if (projectToExpand) {
        setExpanded({ [searchParams.projectId]: true });
      }
    }
  }, [searchParams.projectId, projects]);

  // Effect to handle automatic row expansion when jira: search is present
  useEffect(() => {
    if (debouncedSearch.toLowerCase().startsWith("jira:")) {
      const jiraId = debouncedSearch.slice(5).trim();
      const projectToExpand = projects.find((p) => p.jiraId === jiraId);
      if (projectToExpand) {
        setExpanded({ [projectToExpand.id]: true });
      }
    }
  }, [debouncedSearch, projects]);

  // Helper function to format search query
  const formatSearchQuery = (query: string) => {
    if (query.toLowerCase().startsWith("jira:")) {
      // Remove any spaces after the colon
      return query.replace(/^jira:\s*/i, "jira:");
    }
    return query;
  };

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Update URL for pagination and search
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (searchParams.size) {
      params.set("size", searchParams.size);
    }
    if (debouncedSearch) {
      params.set("search", formatSearchQuery(debouncedSearch));
    }

    const newQueryString = params.toString();
    const currentQueryString = window.location.search.slice(1);

    if (newQueryString !== currentQueryString) {
      router.push(`${pathname}?${newQueryString}`, { scroll: false });
    }
  }, [page, debouncedSearch, searchParams.size, router, pathname]);

  // Apply local filters
  useEffect(() => {
    const filters: { id: string; value: string | boolean }[] = [];

    // Add team filter
    if (selectedTeam !== "all") {
      filters.push({
        id: "teamName",
        value: selectedTeam,
      });
    }

    // Add type filter
    if (selectedType !== "all") {
      filters.push({
        id: "isCapDev",
        value: selectedType === "capdev",
      });
    }

    setColumnFilters(filters);
  }, [selectedTeam, selectedType]);

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
      console.error(error);
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
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      ),
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
      filterFn: (row, id, value) => {
        return row.getValue<string>(id).toLowerCase().includes(value);
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
      pagination: {
        pageIndex: page - 1,
        pageSize: Number(searchParams.size) || 10,
      },
    },
    manualPagination: true,
    pageCount: Math.ceil(totalProjects / (Number(searchParams.size) || 10)),
    enableExpanding: true,
    getRowId: (row) => row.id,
  });

  return (
    <div>
      <div className="flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                placeholder="Search projects... (use jira:TF-123 for exact Jira ID)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-[150px] lg:w-[250px]"
              />
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {uniqueTeams.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="capdev">CapDev</SelectItem>
                  <SelectItem value="non-capdev">Non-CapDev</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSynced && (
              <span className="text-sm text-muted-foreground">
                Last synced: {lastSynced.toLocaleString("en-NZ")}
              </span>
            )}
            <Button onClick={handleSync} disabled={isSyncing} size="sm">
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
              />
              Sync with Jira
            </Button>
          </div>
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
          Showing {table.getRowModel().rows.length} of {totalProjects} projects
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(totalProjects / 10)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
