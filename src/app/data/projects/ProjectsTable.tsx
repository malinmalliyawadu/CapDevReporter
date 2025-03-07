"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  X,
  Trash2,
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
  useReactTable,
  ExpandedState,
  getExpandedRowModel,
} from "@tanstack/react-table";
import { format } from "date-fns";
import { useRouter, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { ProjectsPageQueryString } from "./page";
import { useSyncDialog } from "@/contexts/dialog-context";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getProjects,
  deleteProject,
  type Project,
  type JiraBoard,
} from "./actions";

interface ProjectsTableProps {
  initialProjects: Project[];
  totalProjects: number;
  searchParams: ProjectsPageQueryString;
  availableBoards: JiraBoard[];
}

export function ProjectsTable({
  initialProjects,
  totalProjects,
  searchParams,
  availableBoards,
}: ProjectsTableProps) {
  const { toast } = useToast();
  const { openFromEvent: openSyncDialogFromEvent } = useSyncDialog();
  const router = useRouter();
  const pathname = usePathname();

  // Group related state together
  const [tableState, setTableState] = useState({
    projects: initialProjects,
    projectsCount: totalProjects,
    page: Number(searchParams.page) || 1,
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Memoize unique teams from availableBoards instead of projects
  const uniqueTeams = useMemo(() => {
    const teams = new Set(availableBoards.map((board) => board.team.name));
    return Array.from(teams).sort();
  }, [availableBoards]);

  // Effect to handle automatic row expansion when projectId is present
  useEffect(() => {
    if (searchParams.projectId) {
      const projectToExpand = tableState.projects.find(
        (p) => p.id === searchParams.projectId
      );
      if (projectToExpand) {
        setExpanded({ [searchParams.projectId]: true });
      }
    }
  }, [searchParams.projectId, tableState.projects]);

  // Effect to handle automatic row expansion when jira: search is present
  useEffect(() => {
    if (debouncedSearch.toLowerCase().startsWith("jira:")) {
      const jiraId = debouncedSearch.slice(5).trim();
      const projectToExpand = tableState.projects.find(
        (p) => p.jiraId === jiraId
      );
      if (projectToExpand) {
        setExpanded({ [projectToExpand.id]: true });
      }
    }
  }, [debouncedSearch, tableState.projects]);

  // Memoize formatSearchQuery
  const formatSearchQuery = useCallback((query: string) => {
    if (query.toLowerCase().startsWith("jira:")) {
      return query.replace(/^jira:\s*/i, "jira:");
    }
    return query;
  }, []);

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

  // Effect to handle sync parameter
  useEffect(() => {
    if (searchParams.sync === "true") {
      openSyncDialogFromEvent();
      // Remove the sync parameter from the URL
      const params = new URLSearchParams(window.location.search);
      params.delete("sync");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams.sync, router, pathname, openSyncDialogFromEvent]);

  // Combine URL update and data fetching into a single effect
  useEffect(() => {
    const updateUrlAndFetchData = async () => {
      const params = new URLSearchParams();
      params.set("page", String(tableState.page));
      if (searchParams.size) {
        params.set("size", searchParams.size);
      }
      if (debouncedSearch) {
        params.set("search", formatSearchQuery(debouncedSearch));
      }

      const newQueryString = params.toString();
      const currentQueryString = window.location.search.slice(1);

      // Only update URL if it's different
      if (newQueryString !== currentQueryString) {
        await router.push(`${pathname}?${newQueryString}`, { scroll: false });
      }

      // Fetch data
      try {
        const result = await getProjects({
          page: tableState.page,
          size: Number(searchParams.size) || 10,
          search: debouncedSearch
            ? formatSearchQuery(debouncedSearch)
            : undefined,
        });

        setTableState((prev) => ({
          ...prev,
          projects: result.projects,
          projectsCount: result.total,
        }));
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    updateUrlAndFetchData();
  }, [
    tableState.page,
    debouncedSearch,
    searchParams.size,
    router,
    pathname,
    formatSearchQuery,
  ]);

  // Reset page when search changes - keep this separate to avoid race conditions
  useEffect(() => {
    setTableState((prev) => {
      if (prev.page === 1) return prev; // Avoid unnecessary updates
      return { ...prev, page: 1 };
    });
  }, [debouncedSearch]);

  // Memoize handleDeleteProject with fewer dependencies
  const handleDeleteProject = useCallback(
    async (project: Project) => {
      if (!project?.id) {
        toast({
          title: "Error",
          description: "Invalid project data",
          variant: "destructive",
        });
        return;
      }

      try {
        await deleteProject(project.id);
        toast({
          title: "Project deleted",
          description: `Project ${project.name} has been deleted successfully.`,
        });

        // Instead of updating state directly and then fetching, just trigger a re-fetch
        // by updating the page number to itself, which will trigger the main effect
        setTableState((prev) => ({ ...prev, page: prev.page }));
      } catch (error) {
        console.error("Error deleting project:", error);
        toast({
          title: "Error",
          description: "Failed to delete project. Please try again.",
          variant: "destructive",
        });
      } finally {
        setProjectToDelete(null);
      }
    },
    [toast]
  );

  // Memoize columns
  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
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
        accessorKey: "jiraId",
        header: "Jira ID",
        cell: ({ row }) => (
          <a
            href={`${process.env.NEXT_PUBLIC_JIRA_URL}/browse/${row.original.jiraId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block whitespace-nowrap"
          >
            <Badge
              variant="outline"
              className="hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap max-w-[120px] overflow-hidden text-ellipsis"
            >
              {row.original.jiraId}
            </Badge>
          </a>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
            data-testid="sort-button-name"
          >
            Project Name
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-name" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-name"
              />
            ) : (
              <ArrowUpDown
                className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
                data-testid="sort-icon-name"
              />
            )}
          </Button>
        ),
        filterFn: (row, id, value) => {
          return row.getValue<string>(id).toLowerCase().includes(value);
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-[300px]">
            <p className="text-muted-foreground text-sm truncate">
              {row.original.description || "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "board.team.name",
        id: "teamName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
            data-testid="sort-button-team"
          >
            Team
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-team" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown
                className="ml-2 h-4 w-4"
                data-testid="sort-icon-team"
              />
            ) : (
              <ArrowUpDown
                className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
                data-testid="sort-icon-team"
              />
            )}
          </Button>
        ),
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
      {
        id: "sync",
        cell: ({ row }) => {
          const project = row.original;
          return (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={openSyncDialogFromEvent({
                defaultIssueKey: project.jiraId,
              })}
              title="Sync this project"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setProjectToDelete(project)}
                title="Delete project"
                data-testid={`delete-project-${project.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openSyncDialogFromEvent]
  ); // Only depend on openSyncDialogFromEvent since it's used in the sync column

  // Memoize renderSubRow
  const renderSubRow = useCallback(
    (row: Project) => {
      if (!row.activities) return null;

      const sortedActivities = [...row.activities].sort(
        (a, b) =>
          new Date(b.activityDate).getTime() -
          new Date(a.activityDate).getTime()
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
    },
    [columns.length]
  );

  // Memoize table configuration
  const tableConfig = useMemo(
    () => ({
      data: tableState.projects,
      columns,
      getCoreRowModel: getCoreRowModel(),
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      onExpandedChange: setExpanded,
      state: {
        sorting,
        columnFilters,
        expanded,
        pagination: {
          pageIndex: tableState.page - 1,
          pageSize: Number(searchParams.size) || 10,
        },
      },
      manualPagination: true,
      pageCount: Math.ceil(
        tableState.projectsCount / (Number(searchParams.size) || 10)
      ),
      enableExpanding: true,
      getRowId: (row: Project) => row.id,
    }),
    [
      tableState.projects,
      tableState.projectsCount,
      tableState.page,
      columns,
      sorting,
      columnFilters,
      expanded,
      searchParams.size,
    ]
  );

  // Use the table hook at the top level with memoized config
  const table = useReactTable(tableConfig);

  return (
    <div>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                <Input
                  placeholder="Search projects... (use jira:TF-123 for exact Jira ID)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-[250px] lg:w-[400px] transition-all duration-200 focus:w-[300px] lg:focus:w-[450px] pr-8"
                  data-testid="projects-search-input"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setSearchQuery("")}
                    data-testid="clear-search-button"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger
                    className="h-9 w-[140px] bg-background/50 hover:bg-background/80 transition-colors"
                    data-testid="team-filter-select"
                  >
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-muted-foreground">
                      All Teams
                    </SelectItem>
                    {uniqueTeams.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger
                    className="h-9 w-[140px] bg-background/50 hover:bg-background/80 transition-colors"
                    data-testid="type-filter-select"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-muted-foreground">
                      All Types
                    </SelectItem>
                    <SelectItem value="capdev">CapDev</SelectItem>
                    <SelectItem value="non-capdev">Non-CapDev</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={openSyncDialogFromEvent()}
              data-testid="sync-with-jira-button"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync with Jira
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table data-testid="projects-table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="hover:bg-transparent border-b-2"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-4 text-muted-foreground font-medium"
                  >
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
                    className="hover:bg-muted/50 transition-colors"
                    data-testid={`project-row-${row.original.id}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3">
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
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-6 w-6" />
                    <p>No projects found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {tableState.projectsCount} projects
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTableState((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={tableState.page <= 1}
            className="h-8 w-8 p-0 hover:bg-muted"
            data-testid="previous-page-button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium" data-testid="current-page">
              {tableState.page}
            </div>
            <div className="text-sm text-muted-foreground">/</div>
            <div
              className="text-sm text-muted-foreground"
              data-testid="total-pages"
            >
              {Math.ceil(
                tableState.projectsCount / (Number(searchParams.size) || 10)
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setTableState((prev) => ({
                ...prev,
                page: Math.min(
                  Math.ceil(
                    prev.projectsCount / (Number(searchParams.size) || 10)
                  ),
                  prev.page + 1
                ),
              }))
            }
            disabled={
              tableState.page >=
              Math.ceil(
                tableState.projectsCount / (Number(searchParams.size) || 10)
              )
            }
            className="h-8 w-8 p-0 hover:bg-muted"
            data-testid="next-page-button"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <AlertDialog
        open={!!projectToDelete}
        onOpenChange={() => setProjectToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project &quot;
              {projectToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                projectToDelete && handleDeleteProject(projectToDelete)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
