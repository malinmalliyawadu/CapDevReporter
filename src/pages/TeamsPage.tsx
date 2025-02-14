import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

interface NewTeam {
  name: string;
  jiraBoard: string;
}

export function TeamsPage() {
  const [teamsList, setTeamsList] = useState(teams);
  const [newTeam, setNewTeam] = useState<NewTeam>({
    name: "",
    jiraBoard: "",
  });

  const handleInputChange = (field: keyof NewTeam, value: string) => {
    setNewTeam((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddTeam = () => {
    // Validate required fields
    if (!newTeam.name || !newTeam.jiraBoard) {
      alert("Please fill in all required fields");
      return;
    }

    // Check for duplicate team names
    if (
      teamsList.some(
        (team) => team.name.toLowerCase() === newTeam.name.trim().toLowerCase()
      )
    ) {
      alert("This team name already exists");
      return;
    }

    // Create new team
    const team = {
      id: Math.max(...teamsList.map((team) => team.id)) + 1,
      name: newTeam.name.trim(),
      jiraBoard: newTeam.jiraBoard,
    };

    // Add to list
    setTeamsList((prev) => [...prev, team]);

    // Reset form
    setNewTeam({
      name: "",
      jiraBoard: "",
    });
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
                <TableHead className="w-[100px]">Actions</TableHead>
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
                  <ConfirmDeleteButton />
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
