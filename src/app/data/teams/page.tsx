"use client";

import { useState } from "react";
import { Pencil, Users, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RouterOutputs, trpc } from "@/trpc/client";

type Team = RouterOutputs["team"]["getAll"][number];

export default function TeamsPage() {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const { data: teams, isLoading } = trpc.team.getAll.useQuery();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const createTeam = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      setIsAddDialogOpen(false);
      setNewTeam({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Team created successfully",
      });
    },
  });

  const updateTeam = trpc.team.update.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      setSelectedTeam(null);
      toast({
        title: "Success",
        description: "Team updated successfully",
      });
    },
  });

  const deleteTeam = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.getAll.invalidate();
      toast({
        title: "Success",
        description: "Team deleted successfully",
      });
    },
  });

  const handleCreateTeam = () => {
    if (!newTeam.name.trim()) {
      toast({
        title: "Error",
        description: "Team name is required",
        variant: "destructive",
      });
      return;
    }

    createTeam.mutate(newTeam);
  };

  const handleUpdateTeam = () => {
    if (!selectedTeam) return;

    updateTeam.mutate({
      id: selectedTeam.id,
      name: selectedTeam.name,
      description: selectedTeam.description ?? undefined,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            Teams
          </span>
        }
        description="Manage your teams and their configurations."
      />

      <div className="mb-6 flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Team</Button>
          </DialogTrigger>
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
              <Button
                onClick={handleCreateTeam}
                disabled={createTeam.isPending}
              >
                {createTeam.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams?.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.description}</TableCell>
                  <TableCell>{team.employees.length}</TableCell>
                  <TableCell>{team.projects.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog
                        open={selectedTeam?.id === team.id}
                        onOpenChange={(open) => !open && setSelectedTeam(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTeam(team)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Team</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="edit-team-name">Team Name</Label>
                              <Input
                                id="edit-team-name"
                                value={selectedTeam?.name}
                                onChange={(e) =>
                                  setSelectedTeam((prev) =>
                                    prev
                                      ? { ...prev, name: e.target.value }
                                      : null
                                  )
                                }
                              />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="edit-description">
                                Description
                              </Label>
                              <Input
                                id="edit-description"
                                value={selectedTeam?.description ?? ""}
                                onChange={(e) =>
                                  setSelectedTeam((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          description: e.target.value,
                                        }
                                      : null
                                  )
                                }
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              onClick={handleUpdateTeam}
                              disabled={updateTeam.isPending}
                            >
                              {updateTeam.isPending
                                ? "Updating..."
                                : "Update Team"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to delete this team?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the team and remove all
                              associations.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteTeam.mutate(team.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteTeam.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
