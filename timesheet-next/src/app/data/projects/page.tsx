"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { Pencil, Trash2, ClipboardList } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RouterOutputs } from "@/utils/trpc";

type Project = RouterOutputs["project"]["getAll"][number];

interface EditProjectDialogProps {
  project: Project;
  onSave: (project: Project) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: RouterOutputs["team"]["getAll"];
}

function EditProjectDialog({
  project,
  onSave,
  open,
  onOpenChange,
  teams,
}: EditProjectDialogProps) {
  const [editedProject, setEditedProject] = useState<Project>(project);

  const handleSave = () => {
    onSave(editedProject);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Make changes to the project details here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="edit-project-name">Project Name</Label>
            <Input
              id="edit-project-name"
              value={editedProject.name}
              onChange={(e) =>
                setEditedProject({ ...editedProject, name: e.target.value })
              }
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="edit-project-description">Description</Label>
            <Input
              id="edit-project-description"
              value={editedProject.description ?? ""}
              onChange={(e) =>
                setEditedProject({
                  ...editedProject,
                  description: e.target.value || null,
                })
              }
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="edit-project-team">Team</Label>
            <Select
              value={editedProject.teamId}
              onValueChange={(value) =>
                setEditedProject({ ...editedProject, teamId: value })
              }
            >
              <SelectTrigger id="edit-project-team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
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

export default function ProjectsPage() {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const { data: projects, isLoading: isLoadingProjects } =
    trpc.project.getAll.useQuery();
  const { data: teams, isLoading: isLoadingTeams } =
    trpc.team.getAll.useQuery();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: null as string | null,
    teamId: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
      setIsAddDialogOpen(false);
      setNewProject({ name: "", description: null, teamId: "" });
      toast({
        title: "Success",
        description: "Project created successfully",
      });
    },
  });

  const updateProject = trpc.project.update.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
      setEditingProject(null);
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => {
      utils.project.getAll.invalidate();
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProject.name.trim() || !newProject.teamId) {
      toast({
        title: "Error",
        description: "Project name and team are required",
        variant: "destructive",
      });
      return;
    }

    createProject.mutate(newProject);
  };

  const handleUpdateProject = (project: Project) => {
    updateProject.mutate({
      id: project.id,
      name: project.name,
      description: project.description,
      teamId: project.teamId,
    });
  };

  if (isLoadingProjects || isLoadingTeams) {
    return <div>Loading...</div>;
  }

  if (!teams) {
    return <div>No teams found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-indigo-500" />
            Projects
          </span>
        }
        description="Manage your projects and their assignments."
      />

      <div className="mb-6 flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="project-description">Description</Label>
                <Input
                  id="project-description"
                  value={newProject.description ?? ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value || null,
                    })
                  }
                  placeholder="Enter project description"
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="project-team">Team</Label>
                <Select
                  value={newProject.teamId}
                  onValueChange={(value) =>
                    setNewProject({ ...newProject, teamId: value })
                  }
                >
                  <SelectTrigger id="project-team">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleCreateProject}
                disabled={createProject.isPending}
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Time Entries</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description}</TableCell>
                  <TableCell>{project.team.name}</TableCell>
                  <TableCell>{project.timeEntries.length}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProject(project)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you absolutely sure?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will
                              permanently delete this project and all associated
                              time entries.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex justify-end gap-4">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              variant="destructive"
                              onClick={() => deleteProject.mutate(project.id)}
                              disabled={deleteProject.isPending}
                            >
                              {deleteProject.isPending
                                ? "Deleting..."
                                : "Delete"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editingProject && teams && (
        <EditProjectDialog
          project={editingProject}
          onSave={handleUpdateProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          teams={teams}
        />
      )}
    </div>
  );
}
