"use client";

import * as React from "react";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface JiraBoard {
  id: string;
  name: string;
  boardId: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  jiraBoards: JiraBoard[];
}

interface TeamsTableProps {
  initialTeams: Team[];
}

export function TeamsTable({ initialTeams }: TeamsTableProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });
  const [newBoard, setNewBoard] = useState({
    name: "",
    boardId: "",
    teamId: "",
  });
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isAddBoardDialogOpen, setIsAddBoardDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editTeamData, setEditTeamData] = useState({
    name: "",
    description: "",
  });

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTeam),
      });

      if (!response.ok) throw new Error("Failed to create team");

      const teamsResponse = await fetch("/api/teams");
      const updatedTeams = await teamsResponse.json();
      setTeams(updatedTeams);
      setIsAddTeamDialogOpen(false);
      setNewTeam({ name: "", description: "" });
      toast.success("Team created successfully");
    } catch (error) {
      toast.error("Failed to create team");
    }
  };

  const handleAddJiraBoard = async () => {
    if (!newBoard.name.trim() || !newBoard.boardId.trim() || !newBoard.teamId) {
      toast.error("All fields are required");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${newBoard.teamId}/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newBoard.name,
          boardId: newBoard.boardId,
        }),
      });

      if (!response.ok) throw new Error("Failed to add board");

      const teamsResponse = await fetch("/api/teams");
      const updatedTeams = await teamsResponse.json();
      setTeams(updatedTeams);
      setIsAddBoardDialogOpen(false);
      setNewBoard({ name: "", boardId: "", teamId: "" });
      toast.success("Board added successfully");
    } catch (error) {
      toast.error("Failed to add board");
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    try {
      const response = await fetch(`/api/teams/${teamToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete team");

      const teamsResponse = await fetch("/api/teams");
      const updatedTeams = await teamsResponse.json();
      setTeams(updatedTeams);
      setIsDeleteDialogOpen(false);
      setTeamToDelete(null);
      toast.success("Team deleted successfully");
    } catch (error) {
      toast.error("Failed to delete team");
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !editTeamData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editTeamData),
      });

      if (!response.ok) throw new Error("Failed to update team");

      const teamsResponse = await fetch("/api/teams");
      const updatedTeams = await teamsResponse.json();
      setTeams(updatedTeams);
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      toast.success("Team updated successfully");
    } catch (error) {
      toast.error("Failed to update team");
    }
  };

  const handleDeleteBoard = async (teamId: string, boardId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete board");

      const teamsResponse = await fetch("/api/teams");
      const updatedTeams = await teamsResponse.json();
      setTeams(updatedTeams);
      toast.success("Board deleted successfully");
    } catch (error) {
      toast.error("Failed to delete board");
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddTeamDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      <div className="grid gap-6">
        {teams.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">{team.name}</h3>
                  {team.description && (
                    <span className="text-sm text-muted-foreground">
                      {team.description}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedTeam(team);
                      setEditTeamData({
                        name: team.name,
                        description: team.description || "",
                      });
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setNewBoard((prev) => ({ ...prev, teamId: team.id }));
                      setIsAddBoardDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTeamToDelete(team);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Board Name</TableHead>
                    <TableHead>Board ID</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.jiraBoards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No Jira boards assigned
                      </TableCell>
                    </TableRow>
                  ) : (
                    team.jiraBoards.map((board) => (
                      <TableRow key={board.id}>
                        <TableCell>{board.name}</TableCell>
                        <TableCell>{board.boardId}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBoard(team.id, board.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddTeamDialogOpen} onOpenChange={setIsAddTeamDialogOpen}>
        <DialogContent>
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
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddBoardDialogOpen}
        onOpenChange={setIsAddBoardDialogOpen}
      >
        <DialogContent>
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
                  setNewBoard((prev) => ({ ...prev, boardId: e.target.value }))
                }
                placeholder="123"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddJiraBoard}>Add Board</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete {teamToDelete?.name}? This action
              cannot be undone. All associated Jira board assignments will also
              be removed.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Note: You cannot delete a team if it has boards with associated
              projects. Please delete or reassign all projects first.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
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
                  setEditTeamData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Engineering Team"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={editTeamData.description}
                onChange={(e) =>
                  setEditTeamData((prev) => ({
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
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
