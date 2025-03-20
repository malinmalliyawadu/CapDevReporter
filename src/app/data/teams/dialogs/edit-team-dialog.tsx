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
import { updateTeam } from "../actions";

interface Team {
  id: string;
  name: string;
  description: string | null;
}

interface EditTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function EditTeamDialog({
  isOpen,
  onOpenChange,
  team,
}: EditTeamDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [editTeamData, setEditTeamData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (team) {
      setEditTeamData({
        name: team.name,
        description: team.description || "",
      });
    }
  }, [team]);

  const handleSubmit = async () => {
    startTransition(async () => {
      if (!team || !editTeamData.name.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Team name is required",
        });
        return;
      }

      const result = await updateTeam(team.id, editTeamData);

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
        description: "Team updated successfully",
      });

      router.refresh();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editTeamData.name}
                onChange={(e) =>
                  setEditTeamData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Engineering Team"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="update-team-submit"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
