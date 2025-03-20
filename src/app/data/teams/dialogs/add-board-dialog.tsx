"use client";

import * as React from "react";
import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addJiraBoard } from "../actions";

interface AddBoardDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export function AddBoardDialog({
  isOpen,
  onOpenChange,
  teamId,
}: AddBoardDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [newBoard, setNewBoard] = useState({
    name: "",
    boardId: "",
    teamId: "",
  });

  useEffect(() => {
    if (isOpen) {
      setNewBoard((prev) => ({ ...prev, teamId }));
    }
  }, [isOpen, teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoard.name.trim() || !newBoard.boardId.trim() || !newBoard.teamId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await addJiraBoard({
          name: newBoard.name,
          boardId: newBoard.boardId,
          team: {
            connect: {
              id: newBoard.teamId,
            },
          },
        });

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          });
          return;
        }

        onOpenChange(false);
        setNewBoard({ name: "", boardId: "", teamId: "" });
        toast({
          variant: "success",
          title: "Success",
          description: "Board added successfully",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add board",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form>
          <DialogHeader>
            <DialogTitle>Add Jira Board</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="board-name">Board Name</Label>
              <Input
                id="board-name"
                value={newBoard.name}
                onChange={(e) =>
                  setNewBoard((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Team Board"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="board-id">Board ID</Label>
              <Input
                id="board-id"
                value={newBoard.boardId}
                onChange={(e) =>
                  setNewBoard((prev) => ({
                    ...prev,
                    boardId: e.target.value,
                  }))
                }
                placeholder="123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="add-board-submit"
              onClick={handleSubmit}
            >
              {isPending ? "Adding..." : "Add Board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
