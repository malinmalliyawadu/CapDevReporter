"use client";

import * as React from "react";
import { use, useState } from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { AddTeamDialog } from "./dialogs/add-team-dialog";
import { AddBoardDialog } from "./dialogs/add-board-dialog";
import { DeleteTeamDialog } from "./dialogs/delete-team-dialog";
import { EditTeamDialog } from "./dialogs/edit-team-dialog";
import { DeleteBoardDialog } from "./dialogs/delete-board-dialog";

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
  const teams = use(initialTeamsPromise);

  // Dialog states
  const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
  const [isAddBoardDialogOpen, setIsAddBoardDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteBoardDialogOpen, setIsDeleteBoardDialogOpen] = useState(false);

  // Selected items
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<{
    teamId: string;
    boardId: string;
    name: string;
  } | null>(null);

  // Selected team ID for adding a board
  const [selectedTeamId, setSelectedTeamId] = useState("");

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
                      setSelectedTeamId(team.id);
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
                              setBoardToDelete({
                                teamId: team.id,
                                boardId: board.id,
                                name: board.name,
                              });
                              setIsDeleteBoardDialogOpen(true);
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

      <AddTeamDialog
        isOpen={isAddTeamDialogOpen}
        onOpenChange={setIsAddTeamDialogOpen}
      />

      <AddBoardDialog
        isOpen={isAddBoardDialogOpen}
        onOpenChange={setIsAddBoardDialogOpen}
        teamId={selectedTeamId}
      />

      <DeleteTeamDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        team={teamToDelete}
      />

      <EditTeamDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        team={selectedTeam}
      />

      <DeleteBoardDialog
        isOpen={isDeleteBoardDialogOpen}
        onOpenChange={setIsDeleteBoardDialogOpen}
        boardToDelete={boardToDelete}
      />
    </div>
  );
}
