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
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronsUpDown,
  Download,
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
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState(initialProjects);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(Number(searchParams.page) || 1);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
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
      if (syncDialogOpen && availableBoards.length === 0) {
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
  }, [syncDialogOpen, availableBoards.length, toast]);

  // Debug log for board selection
  useEffect(() => {
    console.log("Current sync config:", syncConfig);
    console.log("Available boards:", availableBoards);
  }, [syncConfig, availableBoards]);

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

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncProgress({ message: "Starting sync...", progress: 0 });
      setSyncLogs([]);

      // Create EventSource with config parameters
      const params = new URLSearchParams({
        boards: syncConfig.boards.join(","),
        maxIssuesPerBoard: syncConfig.maxIssuesPerBoard.toString(),
      });
      const eventSource = new EventSource(
        `/api/projects/sync?${params.toString()}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setSyncProgress(data);
        // Use the operation field from the server if provided
        addSyncLog(data.message, data.type || "info", data.operation);
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsSyncing(false);
        setSyncProgress(null);
        addSyncLog("Failed to sync with Jira", "error", "sync-error");
        toast({
          title: "Error",
          description: "Failed to sync projects with Jira",
          variant: "destructive",
        });
      };

      // Listen for completion
      eventSource.addEventListener("sync-complete", async () => {
        eventSource.close();

        addSyncLog("Fetching updated projects...", "info", "fetch-projects");
        // Fetch updated projects
        const projectsResponse = await fetch("/api/projects");
        const updatedProjects = await projectsResponse.json();
        setProjects(updatedProjects);
        setLastSynced(new Date());
        addSyncLog(
          "Projects updated successfully",
          "success",
          "fetch-projects"
        );

        setIsSyncing(false);
        setSyncProgress(null);

        toast({
          title: "Success",
          description: "Projects synced with Jira",
        });
      });
    } catch (error) {
      console.error(error);
      setIsSyncing(false);
      setSyncProgress(null);
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
    if (
      syncLogs.some(
        (log) =>
          log.type === "success" &&
          log.message === "Sync complete!" &&
          log.operation === "finalize"
      )
    ) {
      triggerConfetti();
    }
  }, [syncLogs]);

  // Add effect for auto-scrolling
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [syncLogs]);

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
          <div className="flex items-center gap-4">
            {lastSynced && !isSyncing && (
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last synced: {lastSynced.toLocaleString("en-NZ")}
              </span>
            )}
            <Button
              onClick={() => setSyncDialogOpen(true)}
              disabled={isSyncing}
              size="sm"
              className={`relative transition-all duration-300 ${
                isSyncing
                  ? "bg-primary/90 text-primary-foreground min-w-[120px]"
                  : ""
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 transition-all duration-300 ${
                  isSyncing ? "animate-spin-fast" : "hover:rotate-180"
                }`}
              />
              {isSyncing ? "Syncing..." : "Sync with Jira"}
              {isSyncing && (
                <span className="absolute bottom-0 left-0 h-[2px] bg-primary-foreground/20 w-full">
                  <span
                    className="absolute h-full bg-primary-foreground/40 animate-[progress_2s_ease-in-out_infinite]"
                    style={{ width: "40%" }}
                  />
                </span>
              )}
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

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {isSyncing ? (
                <>
                  <span className="text-primary py-1">
                    Syncing Projects with Jira
                  </span>
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </>
              ) : (
                <>
                  <span
                    className={
                      syncLogs.some((log) => log.type === "error")
                        ? "text-destructive"
                        : "text-primary"
                    }
                  >
                    {syncLogs.length
                      ? syncLogs.some((log) => log.type === "error")
                        ? "Sync Failed"
                        : "Sync Complete"
                      : "Sync Configuration"}
                  </span>
                  {syncLogs.some((log) => log.type === "error") && (
                    <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                  )}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isSyncing
                ? "Updating project information and activities from Jira"
                : syncLogs.some((log) => log.type === "error")
                ? "Sync process encountered errors. Please check the logs below."
                : syncLogs.length
                ? "Sync process completed successfully."
                : "Configure the sync process parameters"}
            </DialogDescription>
          </DialogHeader>

          {/* Sync Configuration Section */}
          {!isSyncing && !syncLogs.length && (
            <div className="space-y-4 mb-4">
              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Advanced Configuration</Label>
                    <p className="text-sm text-muted-foreground">
                      Customize which boards to sync and how many issues to
                      process
                    </p>
                  </div>
                  <Switch
                    checked={showAdvancedConfig}
                    onCheckedChange={setShowAdvancedConfig}
                  />
                </div>

                {showAdvancedConfig && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="boards">Boards to Sync</Label>
                      <Popover
                        open={boardSearchOpen}
                        onOpenChange={setBoardSearchOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={boardSearchOpen}
                            className="w-full justify-between"
                          >
                            <div className="flex gap-1 flex-wrap">
                              {syncConfig.boards[0] === "all" ? (
                                <span>All Boards</span>
                              ) : (
                                <>
                                  {syncConfig.boards.map((boardId) => {
                                    const board = availableBoards.find(
                                      (b) => b.boardId === boardId
                                    );
                                    return board ? (
                                      <Badge
                                        key={board.id}
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                      >
                                        {board.name}
                                      </Badge>
                                    ) : null;
                                  })}
                                </>
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search boards..."
                              value={boardSearchQuery}
                              onValueChange={setBoardSearchQuery}
                            />
                            <CommandEmpty>No boards found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="all-boards"
                                className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                onSelect={() => {
                                  setSyncConfig((prev) => ({
                                    ...prev,
                                    boards: ["all"],
                                  }));
                                  setBoardSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    syncConfig.boards[0] === "all"
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                All Boards
                              </CommandItem>
                              {filteredBoards.map((board) => (
                                <CommandItem
                                  key={board.id}
                                  value={board.boardId}
                                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                  onSelect={() => {
                                    setSyncConfig((prev) => ({
                                      ...prev,
                                      boards:
                                        prev.boards[0] === "all"
                                          ? [board.boardId]
                                          : prev.boards.includes(board.boardId)
                                          ? prev.boards.filter(
                                              (id) => id !== board.boardId
                                            )
                                          : [...prev.boards, board.boardId],
                                    }));
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      syncConfig.boards.includes(board.boardId)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="font-medium">
                                    {board.name}
                                  </span>
                                  {board.team && (
                                    <span className="ml-2 text-muted-foreground">
                                      ({board.team.name} • {board.boardId})
                                    </span>
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxIssues">
                        Maximum Issues per Board
                      </Label>
                      <Input
                        id="maxIssues"
                        type="number"
                        min={1}
                        max={100}
                        value={syncConfig.maxIssuesPerBoard}
                        onChange={(e) =>
                          setSyncConfig((prev) => ({
                            ...prev,
                            maxIssuesPerBoard: Math.max(
                              1,
                              Math.min(100, parseInt(e.target.value) || 50)
                            ),
                          }))
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Limit the number of issues to process per board (1-100)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSync} disabled={isSyncing}>
                  Start Sync
                </Button>
              </div>
            </div>
          )}

          {/* Progress Section */}
          {(syncProgress || isSyncing) && (
            <div className="space-y-4 mb-4">
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                <h4 className="text-base flex items-center gap-2">
                  {syncProgress?.message || "Starting sync..."}
                </h4>
                <Badge
                  variant={isSyncing ? "default" : "secondary"}
                  className="text-sm px-2 py-0.5"
                >
                  {syncProgress?.progress || 0}%
                </Badge>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary relative overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 absolute top-0 left-0"
                  style={{ width: `${syncProgress?.progress || 0}%` }}
                />
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-[shine_1s_ease-in-out_infinite]" />
              </div>
              {isSyncing && syncProgress?.progress === 100 && (
                <p className="text-sm text-muted-foreground">
                  Finalizing sync process...
                </p>
              )}
              {isSyncing && (syncProgress?.progress || 0) >= 95 && (
                <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 text-sm px-3 py-2 rounded-md border border-yellow-500/20">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <p>Sync will timeout after 5 minutes if not completed</p>
                </div>
              )}
            </div>
          )}

          {/* Logs Section */}
          {syncLogs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm text-foreground">Sync Log</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-background/50 px-2 py-1 rounded-md">
                    {syncLogs.length}{" "}
                    {syncLogs.length === 1 ? "entry" : "entries"}
                  </span>
                  {syncLogs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        const logText = syncLogs
                          .map(
                            (log) =>
                              `[${log.timestamp.toLocaleString()}] ${log.type.toUpperCase()}: ${
                                log.message
                              }`
                          )
                          .join("\n");

                        const blob = new Blob([logText], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `sync-log-${
                          new Date().toISOString().split("T")[0]
                        }.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea
                className="h-[300px] rounded-md border p-4 bg-muted/5"
                viewportRef={scrollAreaRef}
              >
                <div className="space-y-2">
                  {syncLogs.map((log, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 text-sm bg-background/30 p-2 rounded-lg"
                    >
                      <span className="mt-0.5">
                        {log.type === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {log.type === "error" && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {log.type === "warning" && (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                        {log.type === "info" && (
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin-fast" />
                        )}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="leading-none">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
