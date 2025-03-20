"use client";

import * as React from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteTeam } from "../actions";

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface DeleteTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function DeleteTeamDialog({
  isOpen,
  onOpenChange,
  team,
}: DeleteTeamDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleConfirm = async () => {
    if (!team) return;

    startTransition(async () => {
      try {
        const result = await deleteTeam(team.id);

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          });
          return;
        }

        onOpenChange(false);
        toast({
          variant: "success",
          title: "Success",
          description: "Team deleted successfully",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete team",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete {team?.name}? This action cannot be
            undone. All associated Jira board assignments will also be removed.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Note: You cannot delete a team if it has boards with associated
            projects. Please delete or reassign all projects first.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            data-testid="confirm-delete-team"
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
