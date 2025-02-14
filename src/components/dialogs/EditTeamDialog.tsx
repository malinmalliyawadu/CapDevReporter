import { jiraBoards } from "@/data/jiraBoards";
import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Team } from "@/types/team";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

interface EditTeamDialogProps {
  team: Team;
  onSave: (team: Team) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamDialog({
  team,
  onSave,
  open,
  onOpenChange,
}: EditTeamDialogProps) {
  const [editedTeam, setEditedTeam] = useState<Team>(team);

  const handleSave = () => {
    onSave(editedTeam);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Make changes to the team details here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="edit-team-name">Team Name</Label>
            <Input
              id="edit-team-name"
              value={editedTeam.name}
              onChange={(e) =>
                setEditedTeam({ ...editedTeam, name: e.target.value })
              }
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="edit-jira-board">Jira Board</Label>
            <Select
              value={editedTeam.jiraBoard}
              onValueChange={(value) =>
                setEditedTeam({ ...editedTeam, jiraBoard: value })
              }
            >
              <SelectTrigger id="edit-jira-board">
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {jiraBoards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {board.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
