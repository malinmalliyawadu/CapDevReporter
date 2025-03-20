"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteJiraBoard, getBoardDetails } from "../actions";

interface DeleteBoardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  boardToDelete: {
    teamId: string;
    boardId: string;
    name: string;
  } | null;
}

export function DeleteBoardDialog({
  isOpen,
  onOpenChange,
  boardToDelete,
}: DeleteBoardDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [boardProjects, setBoardProjects] = useState<
    { id: string; name: string }[]
  >([]);
  const [showFullList, setShowFullList] = useState(false);

  useEffect(() => {
    if (isOpen && boardToDelete) {
      const fetchBoardDetails = async (boardId: string) => {
        setIsFetchingProjects(true);

        try {
          const result = await getBoardDetails(boardId);
          if (result.success && result.board) {
            setBoardProjects(result.board.projects);
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsFetchingProjects(false);
        }
      };

      fetchBoardDetails(boardToDelete.boardId);
    }
  }, [isOpen, boardToDelete]);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setBoardProjects([]);
      setShowFullList(false);
    }
  };

  const handleConfirm = async () => {
    if (!boardToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteJiraBoard(
          boardToDelete.teamId,
          boardToDelete.boardId
        );

        if (!result.success) {
          if (result.error?.includes("P2003")) {
            toast({
              variant: "destructive",
              title: "Error",
              description:
                "Cannot delete board: It has associated projects. Please delete or reassign them first.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Error",
              description: result.error || "Failed to delete board",
            });
          }
          return;
        }

        onOpenChange(false);
        toast({
          title: "Success",
          description: "Board deleted successfully",
          variant: "success",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete board",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Board</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the board &quot;
            {boardToDelete?.name}&quot;? This action cannot be undone.
          </p>
          {isFetchingProjects ? (
            <p className="text-sm text-muted-foreground mt-2">
              Checking for associated projects...
            </p>
          ) : boardProjects.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-destructive">
                This board cannot be deleted because it has{" "}
                {boardProjects.length} associated project
                {boardProjects.length === 1 ? "" : "s"}.
              </p>
              {boardProjects.length > 3 ? (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setShowFullList(!showFullList)}
                  >
                    <span>
                      {showFullList ? "Hide" : "Show"} full list of projects
                    </span>
                    {showFullList ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  {showFullList ? (
                    <ScrollArea className="mt-2 h-[200px] rounded-md border p-4">
                      <ul className="space-y-1">
                        {boardProjects.map((project) => (
                          <li
                            key={project.id}
                            className="text-sm text-muted-foreground"
                          >
                            • {project.name}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {boardProjects.slice(0, 3).map((project) => (
                        <li
                          key={project.id}
                          className="text-sm text-muted-foreground"
                        >
                          • {project.name}
                        </li>
                      ))}
                      <li className="text-sm text-muted-foreground">
                        • ... and {boardProjects.length - 3} more
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <ul className="mt-2 space-y-1">
                  {boardProjects.map((project) => (
                    <li
                      key={project.id}
                      className="text-sm text-muted-foreground"
                    >
                      • {project.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-2">
              This board has no associated projects and can be safely deleted.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            data-testid="confirm-delete-board"
            disabled={
              boardProjects.length > 0 || isFetchingProjects || isPending
            }
          >
            {isPending ? "Deleting..." : "Delete Board"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
