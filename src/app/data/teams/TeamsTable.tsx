"use client";

import * as React from "react";
import { use, useState, useTransition } from "react";
import { Pencil, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  createTeam,
  updateTeam,
  deleteTeam,
  addJiraBoard,
  deleteJiraBoard,
  getBoardDetails,
} from "./actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

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
  initialTeamsPromise: Promise<Team[]>;
}

export function TeamsTable({ initialTeamsPromise }: TeamsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const initialTeams = use(initialTeamsPromise);
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
  const [boardToDelete, setBoardToDelete] = useState<{
    teamId: string;
    boardId: string;
    name: string;
  } | null>(null);
  const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false);
  const [editTeamData, setEditTeamData] = useState({
    name: "",
    description: "",
  });
  const [boardProjects, setBoardProjects] = useState<
    { id: string; name: string }[]
  >([]);
  const [isFetchingProjects, setIsFetchingProjects] = useState(false);
  const [showFullList, setShowFullList] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
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

        if (result.teams) {
          setTeams(result.teams);
        }
        setIsAddTeamDialogOpen(false);
        setNewTeam({ name: "", description: "" });
        toast({
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

  const handleAddJiraBoard = async (e: React.FormEvent) => {
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

        if (result.teams) {
          setTeams(result.teams);
        }
        setIsAddBoardDialogOpen(false);
        setNewBoard({ name: "", boardId: "", teamId: "" });
        toast({
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

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteTeam(teamToDelete.id);

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          });
          return;
        }

        if (result.teams) {
          setTeams(result.teams);
        }
        setIsDeleteDialogOpen(false);
        setTeamToDelete(null);
        toast({
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

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !editTeamData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Team name is required",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateTeam(selectedTeam.id, editTeamData);

        if (!result.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
          });
          return;
        }

        if (result.teams) {
          setTeams(result.teams);
        }
        setIsEditDialogOpen(false);
        setSelectedTeam(null);
        toast({
          title: "Success",
          description: "Team updated successfully",
        });
        router.refresh();
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update team",
        });
      }
    });
  };

  const handleDeleteBoardClick = async (
    teamId: string,
    boardId: string,
    name: string
  ) => {
    setIsFetchingProjects(true);
    try {
      const result = await getBoardDetails(boardId);
      if (result.success && result.board) {
        setBoardProjects(result.board.projects);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch board details",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch board details",
      });
    } finally {
      setIsFetchingProjects(false);
    }

    setBoardToDelete({
      teamId,
      boardId,
      name,
    });
    setIsDeleteBoardDialogOpen(true);
  };

  const handleDeleteBoard = async (teamId: string, boardId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteJiraBoard(teamId, boardId);

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

        if (result.teams) {
          setTeams(result.teams);
        }
        setIsDeleteBoardDialogOpen(false);
        setBoardToDelete(null);
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
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => setIsAddTeamDialogOpen(true)}
          data-testid="add-team-button"
        >
          <Plus className="w-4 h-4 mr-2" />
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
                    data-testid={`edit-team-button-${team.name}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setNewBoard((prev) => ({ ...prev, teamId: team.id }));
                      setIsAddBoardDialogOpen(true);
                    }}
                    data-testid={`add-board-button-${team.name}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTeamToDelete(team);
                      setIsDeleteDialogOpen(true);
                    }}
                    data-testid={`delete-team-button-${team.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
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
                            onClick={() => {
                              handleDeleteBoardClick(
                                team.id,
                                board.id,
                                board.name
                              );
                            }}
                            data-testid={`delete-board-button-${team.name}-${board.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
          <form onSubmit={handleCreateTeam}>
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
              >
                {isPending ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddBoardDialogOpen}
        onOpenChange={setIsAddBoardDialogOpen}
      >
        <DialogContent>
          <form onSubmit={handleAddJiraBoard}>
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
              >
                {isPending ? "Adding..." : "Add Board"}
              </Button>
            </DialogFooter>
          </form>
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
            <Button
              variant="destructive"
              onClick={handleDeleteTeam}
              data-testid="confirm-delete-team"
            >
              Delete Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateTeam}>
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
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="update-team-submit"
                disabled={isPending}
              >
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteBoardDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteBoardDialogOpen(open);
          if (!open) {
            setBoardProjects([]);
            setShowFullList(false);
          }
        }}
      >
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
            <Button
              variant="outline"
              onClick={() => setIsDeleteBoardDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                boardToDelete &&
                handleDeleteBoard(boardToDelete.teamId, boardToDelete.boardId)
              }
              data-testid="confirm-delete-board"
              disabled={boardProjects.length > 0 || isFetchingProjects}
            >
              Delete Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
