"use client";

import { useState } from "react";
import { Pencil, Users, Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { RouterOutputs, trpc } from "@/trpc/client";
import { TableSkeleton } from "@/components/ui/skeleton";

type Team = RouterOutputs["team"]["getAll"][number];

export default function TeamsPage() {
  const utils = trpc.useContext();
  const { data: teams, isLoading } = trpc.team.getAll.useQuery();
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

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      setIsAddTeamDialogOpen(false);
      setNewTeam({ name: "", description: "" });
      toast.success("Team created successfully");
    },
  });

  const addJiraBoard = trpc.team.addJiraBoard.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      setIsAddBoardDialogOpen(false);
      setNewBoard({ name: "", boardId: "", teamId: "" });
      toast.success("Jira board added successfully");
    },
  });

  const deleteJiraBoard = trpc.team.removeJiraBoard.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      toast.success("Jira board removed successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      setIsDeleteDialogOpen(false);
      setTeamToDelete(null);
      toast.success("Team deleted successfully");
    },
    onError: (error) => {
      setIsDeleteDialogOpen(false);
      setTeamToDelete(null);
      toast.error(error.message);
    },
  });

  const updateTeam = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      toast.success("Team updated successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    createTeam.mutate(newTeam);
  };

  const handleAddJiraBoard = () => {
    if (!newBoard.name.trim() || !newBoard.boardId.trim() || !newBoard.teamId) {
      toast.error("All fields are required");
      return;
    }

    addJiraBoard.mutate(newBoard);
  };

  const handleDeleteTeam = () => {
    if (!teamToDelete) return;
    deleteTeam.mutate(teamToDelete.id);
  };

  const handleUpdateTeam = () => {
    if (!selectedTeam || !editTeamData.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    updateTeam.mutate({
      id: selectedTeam.id,
      name: editTeamData.name,
      description: editTeamData.description,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <span className="flex items-center gap-2">
                <Users className="h-6 w-6 text-indigo-500" />
                Teams
              </span>
            }
            description="View and manage teams and their Jira board assignments."
          />
          <div className="w-[120px] h-10 bg-muted animate-pulse rounded-md" />
        </div>

        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="w-48 h-6 bg-muted animate-pulse rounded-md" />
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-muted animate-pulse rounded-md" />
                    <div className="w-10 h-10 bg-muted animate-pulse rounded-md" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TableSkeleton rows={3} cols={4} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-500" />
              Teams
            </span>
          }
          description="View and manage teams and their Jira board assignments."
        />
        <Button onClick={() => setIsAddTeamDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </Button>
      </div>

      <div className="grid gap-6">
        {teams?.map((team) => (
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
                  {team.jiraBoards.map((board) => (
                    <TableRow key={board.id}>
                      <TableCell>{board.name}</TableCell>
                      <TableCell>{board.boardId}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteJiraBoard.mutate({
                              boardId: board.id,
                              teamId: team.id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
          <div className="flex justify-end">
            <Button onClick={handleCreateTeam} disabled={createTeam.isPending}>
              {createTeam.isPending ? "Creating..." : "Create Team"}
            </Button>
          </div>
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
          <div className="flex justify-end">
            <Button
              onClick={handleAddJiraBoard}
              disabled={addJiraBoard.isPending}
            >
              {addJiraBoard.isPending ? "Adding..." : "Add Board"}
            </Button>
          </div>
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              disabled={deleteTeam.isPending}
            >
              {deleteTeam.isPending ? "Deleting..." : "Delete Team"}
            </Button>
          </div>
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
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTeam} disabled={updateTeam.isPending}>
              {updateTeam.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
