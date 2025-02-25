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
import { deleteProject, getProjects } from "./actions";

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
  activities?: ProjectActivity[];
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

interface JiraBoard {
  id: string;
  boardId: string;
  name: string;
  team: {
    name: string;
  };
}

export function ProjectsTable({
  initialProjects,
  totalProjects,
  searchParams,
}: ProjectsTableProps) {
  const { toast } = useToast();
  const { openFromEvent: openSyncDialogFromEvent } = useSyncDialog();
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState(initialProjects);
  const [projectsCount, setProjectsCount] = useState(totalProjects);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(Number(searchParams.page) || 1);
  const [availableBoards, setAvailableBoards] = useState<JiraBoard[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

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

  // Fetch available boards when dialog opens
  useEffect(() => {
    const fetchBoards = async () => {
      if (availableBoards.length === 0) {
        try {
          const response = await fetch("/api/boards");
          if (!response.ok) {
            throw new Error("Failed to fetch boards");
          }
          const data = await response.json();
          console.log("Fetched boards:", data); // Debug log
          setAvailableBoards(data);
        } catch (error) {
          console.error("Failed to fetch boards:", error);
          toast({
            title: "Error",
            description: "Failed to fetch available boards",
            variant: "destructive",
          });
        }
      }
    };

    fetchBoards();
  }, [availableBoards.length, toast]);

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

  // Add fetchProjects function
  const fetchProjects = useCallback(
    async (params: URLSearchParams) => {
      try {
        const result = await getProjects({
          page: Number(params.get("page")) || 1,
          size: Number(params.get("size")) || 10,
          search: params.get("search") || undefined,
        });

        setProjects(result.projects);
        setProjectsCount(result.total);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleDeleteProject = async (project: Project) => {
    if (!project?.id) {
      toast({
        title: "Error",
        description: "Invalid project data",
        variant: "destructive",
      });
      return;
    }

    try {
      const success = await deleteProject(project.id);

      if (!success) {
        throw new Error("Failed to delete project");
      }

      // Update local state
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setProjectsCount((prev) => prev - 1);

      toast({
        title: "Project deleted",
        description: `Project ${project.name} has been deleted successfully.`,
      });

      // Force a refresh of the data
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (searchParams.size) {
        params.set("size", searchParams.size);
      }
      if (debouncedSearch) {
        params.set("search", formatSearchQuery(debouncedSearch));
      }
      await fetchProjects(params);
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
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const renderSubRow = (row: Project) => {
    if (!row.activities) return null;

    const sortedActivities = [...row.activities].sort(
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
    pageCount: Math.ceil(projectsCount / (Number(searchParams.size) || 10)),
    enableExpanding: true,
    getRowId: (row) => row.id,
  });

  // Effect to update projects when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("search", formatSearchQuery(debouncedSearch));
    }
    params.set("page", "1"); // Reset to first page on search
    params.set("size", String(Number(searchParams.size) || 10));

    fetchProjects(params);
  }, [debouncedSearch, searchParams.size, fetchProjects]);

  // Effect to update projects when page changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("search", formatSearchQuery(debouncedSearch));
    }
    params.set("page", String(page));
    params.set("size", String(Number(searchParams.size) || 10));

    fetchProjects(params);
  }, [page, searchParams.size, debouncedSearch, fetchProjects]);

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
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="h-9 w-[140px] bg-background/50 hover:bg-background/80 transition-colors">
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
                  <SelectTrigger className="h-9 w-[140px] bg-background/50 hover:bg-background/80 transition-colors">
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
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync with Jira
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
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
                  <TableRow className="hover:bg-muted/50 transition-colors">
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
          Showing {table.getRowModel().rows.length} of {projectsCount} projects
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium">{page}</div>
            <div className="text-sm text-muted-foreground">/</div>
            <div className="text-sm text-muted-foreground">
              {Math.ceil(projectsCount / (Number(searchParams.size) || 10))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={
              page >=
              Math.ceil(projectsCount / (Number(searchParams.size) || 10))
            }
            className="h-8 w-8 p-0 hover:bg-muted"
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
