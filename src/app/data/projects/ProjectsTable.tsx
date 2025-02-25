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
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Download,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import confetti, { Options as ConfettiOptions } from "canvas-confetti";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface SyncLog {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error" | "warning";
  operation?: string;
}

interface SyncConfig {
  boards: string[];
  maxIssuesPerBoard: number;
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
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(Number(searchParams.page) || 1);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    boards: ["all"],
    maxIssuesPerBoard: 50,
  });
  const [availableBoards, setAvailableBoards] = useState<JiraBoard[]>([]);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [boardSearchOpen, setBoardSearchOpen] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const scrollAreaRef = React.useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
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

  // Debug log for board selection
  useEffect(() => {
    console.log("Current sync config:", syncConfig);
    console.log("Available boards:", availableBoards);
  }, [syncConfig, availableBoards]);

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

  const addSyncLog = (
    message: string,
    type: SyncLog["type"] = "info",
    operation?: string
  ) => {
    setSyncLogs((prev) => {
      // If we have an operation, try to find and update an existing log
      if (operation) {
        const existingLogIndex = prev.findIndex(
          (log) => log.operation === operation && log.type === "info"
        );

        if (existingLogIndex !== -1) {
          const newLogs = [...prev];
          newLogs[existingLogIndex] = {
            message,
            type,
            operation,
            timestamp: new Date(),
          };
          return newLogs;
        }
      }

      // If no operation or no existing log found, add a new one
      return [...prev, { message, type, operation, timestamp: new Date() }];
    });
  };

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

  const handleSync = async () => {
    try {
      setSyncLogs([]);

      // Create URL with config parameters
      const params = new URLSearchParams({
        boards: syncConfig.boards.join(","),
        maxIssuesPerBoard: syncConfig.maxIssuesPerBoard.toString(),
      });

      const response = await fetch(`/api/projects/sync?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to start sync");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Append new chunk to buffer and split by newlines
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Process all complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          try {
            const data = JSON.parse(line) as {
              type?: "complete";
              message: string;
              progress: number;
              operation?: string;
            };

            if (data.type === "complete") {
              // Handle completion
              const currentParams = new URLSearchParams();
              currentParams.set("page", String(page));
              currentParams.set(
                "size",
                String(Number(searchParams.size) || 10)
              );
              if (debouncedSearch) {
                currentParams.set("search", formatSearchQuery(debouncedSearch));
              }

              // Fetch current page data
              await fetchProjects(currentParams);

              setLastSynced(new Date());
              addSyncLog(
                "Projects updated successfully",
                "success",
                "fetch-projects"
              );

              toast({
                title: "Projects synced successfully!",
                description: (
                  <div className="flex flex-col gap-2">
                    <p>All projects have been synchronized with Jira.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        openSyncDialogFromEvent();
                        router.push("/data/projects");
                        router.refresh();
                      }}
                    >
                      View All Projects
                    </Button>
                  </div>
                ),
                duration: 5000,
              });
            } else {
              // Handle progress update
              addSyncLog(
                data.message,
                data.type || "info",
                data.operation || "sync"
              );
            }
          } catch (error) {
            console.error("Error parsing sync message:", error);
          }
        }

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error(error);
      addSyncLog("Sync process failed with an error", "error", "sync-error");
      toast({
        title: "Error",
        description: "Failed to sync projects with Jira",
        variant: "destructive",
      });
    }
  };

  // Function to trigger confetti
  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: ConfettiOptions) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  // Add effect to trigger confetti on successful completion
  useEffect(() => {
    const hasSuccessLog = syncLogs.some(
      (log) =>
        log.type === "success" &&
        log.message === "Sync complete!" &&
        log.operation === "finalize"
    );

    if (hasSuccessLog) {
      triggerConfetti();
    }
  }, [syncLogs]);

  // Add effect for auto-scrolling
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [syncLogs]);

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

  const filteredBoards = useMemo(() => {
    if (!boardSearchQuery) return availableBoards;
    return availableBoards.filter(
      (board) =>
        board.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) ||
        board.team.name.toLowerCase().includes(boardSearchQuery.toLowerCase())
    );
  }, [availableBoards, boardSearchQuery]);

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
            {lastSynced && (
              <span className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-md">
                <Clock className="h-3.5 w-3.5" />
                Last synced: {lastSynced.toLocaleString("en-NZ")}
              </span>
            )}
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
