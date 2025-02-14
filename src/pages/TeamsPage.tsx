import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teams } from "@/data/teams";
import { jiraBoards } from "@/data/jiraBoards";
import { Team } from "@/types/team";
import { EditTeamDialog } from "@/components/dialogs/EditTeamDialog";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function TeamsPage() {
  const [teamsList, setTeamsList] = useState(teams);
  const [newTeam, setNewTeam] = useState<Omit<Team, "id">>({
    name: "",
    jiraBoard: "",
  });
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleInputChange = (field: keyof Omit<Team, "id">, value: string) => {
    setNewTeam((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.jiraBoard) {
      alert("Please fill in all required fields");
      return;
    }

    if (
      teamsList.some(
        (team) => team.name.toLowerCase() === newTeam.name.trim().toLowerCase()
      )
    ) {
      alert("This team name already exists");
      return;
    }

    const team = {
      id: Math.max(...teamsList.map((team) => team.id)) + 1,
      name: newTeam.name.trim(),
      jiraBoard: newTeam.jiraBoard,
    };

    setTeamsList((prev) => [...prev, team]);
    setNewTeam({ name: "", jiraBoard: "" });
  };

  const handleEditTeam = (editedTeam: Team) => {
    setTeamsList((prev) =>
      prev.map((team) => (team.id === editedTeam.id ? editedTeam : team))
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Teams" description="Manage your teams." />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                type="text"
                placeholder="Engineering Team"
                value={newTeam.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="jira-board">Jira Board</Label>
              <Select
                value={newTeam.jiraBoard}
                onValueChange={(value) => handleInputChange("jiraBoard", value)}
              >
                <SelectTrigger id="jira-board">
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
          <Button
            className="mt-4"
            onClick={handleAddTeam}
            disabled={!newTeam.name.trim() || !newTeam.jiraBoard}
          >
            Add Team
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Team Name</TableHead>
                <TableHead>Jira Board</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {teamsList.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.id}</TableCell>
                <TableCell>{team.name}</TableCell>
                <TableCell>
                  {
                    jiraBoards.find((board) => board.id === team.jiraBoard)
                      ?.name
                  }
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTeam(team)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <ConfirmDeleteButton />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>

      {editingTeam && (
        <EditTeamDialog
          team={editingTeam}
          onSave={handleEditTeam}
          open={!!editingTeam}
          onOpenChange={(open) => !open && setEditingTeam(null)}
        />
      )}
    </div>
  );
}
