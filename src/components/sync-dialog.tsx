"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  RefreshCw,
  Check,
  ChevronsUpDown,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { cn } from "@/lib/utils";
import { useSyncDialog } from "@/contexts/dialog-context";
import confetti, { Options as ConfettiOptions } from "canvas-confetti";
import { getBoards, syncProjects, type SyncMessage } from "@/app/actions/sync";

interface JiraBoard {
  id: string;
  boardId: string;
  name: string;
  team: {
    name: string;
  };
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
  issueKey?: string;
}

export function SyncDialog() {
  const {
    state: { isOpen, defaultIssueKey, onSuccess },
    close,
  } = useSyncDialog();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    message: string;
    progress: number;
  } | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);
  const [syncConfig, setSyncConfig] = useState<SyncConfig>({
    boards: ["all"],
    maxIssuesPerBoard: 50,
    issueKey: "",
  });
  const [availableBoards, setAvailableBoards] = useState<JiraBoard[]>([]);
  const [boardSearchOpen, setBoardSearchOpen] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const hasShownConfetti = useRef(false);

  // Set default issue key when dialog opens
  useEffect(() => {
    if (isOpen && defaultIssueKey) {
      setSyncConfig((prev) => ({
        ...prev,
        issueKey: defaultIssueKey,
        boards: ["all"], // Reset boards when issue key is provided
      }));
      setShowAdvancedConfig(true); // Auto-expand advanced config when issue key is provided
    }
  }, [isOpen, defaultIssueKey]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSyncConfig({
        boards: ["all"],
        maxIssuesPerBoard: 50,
        issueKey: "",
      });
      setShowAdvancedConfig(false);
      setSyncLogs([]);
      setSyncProgress(null);
      hasShownConfetti.current = false;
    }
  }, [isOpen]);

  const filteredBoards = useMemo(() => {
    if (!boardSearchQuery) return availableBoards;
    return availableBoards.filter(
      (board) =>
        board.name.toLowerCase().includes(boardSearchQuery.toLowerCase()) ||
        board.team.name.toLowerCase().includes(boardSearchQuery.toLowerCase())
    );
  }, [availableBoards, boardSearchQuery]);

  // Fetch available boards when dialog opens
  useEffect(() => {
    const fetchBoards = async () => {
      if (isOpen && availableBoards.length === 0) {
        try {
          const result = await getBoards();
          if (!result.success) {
            throw new Error(result.error);
          }
          setAvailableBoards(result.boards as JiraBoard[]);
        } catch (error) {
          console.error("Failed to fetch boards:", error);
          addSyncLog("Failed to fetch available boards", "error");
        }
      }
    };

    fetchBoards();
  }, [isOpen, availableBoards.length]);

  // Add effect for auto-scrolling
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [syncLogs]);

  const addSyncLog = (
    message: string,
    type: SyncLog["type"] = "info",
    operation?: string
  ) => {
    setSyncLogs((prev) => {
      // If we have an operation, try to find and update an existing log
      if (operation) {
        const existingLogIndex = prev.findIndex(
          (log) => log.operation === operation
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

    if (hasSuccessLog && !isSyncing && !hasShownConfetti.current) {
      triggerConfetti();
      hasShownConfetti.current = true;
      onSuccess?.();
    }
  }, [syncLogs, isSyncing, onSuccess]);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncProgress({ message: "Starting sync...", progress: 0 });
      setSyncLogs([]);

      // Add initial sync log
      addSyncLog("Starting sync...", "info", "sync-start");

      const stream = await syncProjects({
        issueKey: syncConfig.issueKey,
        boards: syncConfig.boards,
        maxIssuesPerBoard: syncConfig.maxIssuesPerBoard,
      });

      const reader = stream.getReader();
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
            const data = JSON.parse(line) as SyncMessage;
            setSyncProgress({
              message: data.message,
              progress: data.progress,
            });
            addSyncLog(data.message, data.type, data.operation);
          } catch (error) {
            console.error("Error parsing sync message:", error);
          }
        }

        // Keep the last incomplete line in the buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error) {
      console.error(error);
      setIsSyncing(false);
      setSyncProgress(null);
      addSyncLog("Sync process failed with an error", "error", "sync-error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
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
                <div className="flex items-center justify-between w-full">
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
                </div>
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

        {!isSyncing && !syncLogs.length ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Advanced Configuration</Label>
                <p className="text-sm text-muted-foreground">
                  Customize which boards to sync and how many issues to process
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
                  <Label htmlFor="issueKey">Jira Issue Key (Optional)</Label>
                  <Input
                    id="issueKey"
                    placeholder="e.g. PROJ-123"
                    value={syncConfig.issueKey}
                    onChange={(e) => {
                      const newIssueKey = e.target.value.trim().toUpperCase();
                      setSyncConfig((prev) => ({
                        ...prev,
                        issueKey: newIssueKey,
                        // Reset boards to "all" when issue key is provided
                        boards: newIssueKey ? ["all"] : prev.boards,
                      }));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a specific Jira issue key to sync only that issue.
                    This will override board selection.
                  </p>
                </div>

                <div
                  className="space-y-2 opacity-100 transition-opacity duration-200"
                  style={{
                    opacity: syncConfig.issueKey ? "0.5" : "1",
                    pointerEvents: syncConfig.issueKey ? "none" : "auto",
                  }}
                >
                  <Label htmlFor="boards" className="flex items-center gap-2">
                    Boards to Sync
                    {syncConfig.issueKey && (
                      <span className="text-xs text-muted-foreground">
                        (Disabled when issue key is provided)
                      </span>
                    )}
                  </Label>
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
                              <span className="font-medium">{board.name}</span>
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

                <div
                  className="space-y-2 opacity-100 transition-opacity duration-200"
                  style={{
                    opacity: syncConfig.issueKey ? "0.5" : "1",
                    pointerEvents: syncConfig.issueKey ? "none" : "auto",
                  }}
                >
                  <Label
                    htmlFor="maxIssues"
                    className="flex items-center gap-2"
                  >
                    Maximum Issues per Board
                    {syncConfig.issueKey && (
                      <span className="text-xs text-muted-foreground">
                        (Disabled when issue key is provided)
                      </span>
                    )}
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

            <div className="pt-6">
              <Button
                className="w-full"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Sync
              </Button>
            </div>
          </div>
        ) : (
          <>
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
            <div>
              <div className="flex items-center justify-between mb-2">
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
                ref={scrollAreaRef}
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
                          <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
              {syncLogs.some(
                (log) =>
                  log.type === "success" &&
                  log.message === "Sync complete!" &&
                  log.operation === "finalize"
              ) && (
                <div className="mt-6 space-y-4 text-center p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Sync completed successfully! Please reload the page to see
                    the updated data.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Page
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
