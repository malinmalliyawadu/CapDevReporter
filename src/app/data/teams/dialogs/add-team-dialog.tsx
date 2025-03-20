"use client";

import * as React from "react";
import { useState, useTransition } from "react";
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
import { createTeam } from "../actions";

interface AddTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTeamDialog({ isOpen, onOpenChange }: AddTeamDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Team name is required",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createTeam(newTeam);

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          });
          return;
        }

        onOpenChange(false);
        setNewTeam({ name: "", description: "" });
        toast({
          variant: "success",
          title: "Success",
          description: "Team created successfully",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create team",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form>
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeam.name}
                onChange={(e) =>
                  setNewTeam((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Engineering Team"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newTeam.description}
                onChange={(e) =>
                  setNewTeam((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Team description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              data-testid="create-team-submit"
              disabled={isPending}
              onClick={handleSubmit}
            >
              {isPending ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
