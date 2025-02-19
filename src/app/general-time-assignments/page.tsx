"use client";

import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
}

interface GeneralTimeAssignment {
  id: string;
  roleId: string;
  timeTypeId: string;
  hoursPerWeek: number;
  role: Role;
  timeType: TimeType;
}

export default function GeneralTimeAssignmentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    roleId: "",
    timeTypeId: "",
    hoursPerWeek: 0,
  });

  const { data, isLoading, refetch } =
    trpc.generalTimeAssignments.getAll.useQuery();
  const createMutation = trpc.generalTimeAssignments.create.useMutation({
    onSuccess: () => {
      refetch();
      setNewAssignment({ roleId: "", timeTypeId: "", hoursPerWeek: 0 });
      setIsDialogOpen(false);
      toast.success("Assignment added successfully");
    },
    onError: (error) => {
      console.error("Failed to add assignment:", error);
      toast.error("Failed to add assignment");
    },
  });

  const deleteMutation = trpc.generalTimeAssignments.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Assignment deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete assignment:", error);
      toast.error("Failed to delete assignment");
    },
  });

  const assignments = data?.assignments ?? [];
  const roles = data?.roles ?? [];
  const timeTypes = data?.timeTypes ?? [];

  const handleAdd = async () => {
    if (
      !newAssignment.roleId ||
      !newAssignment.timeTypeId ||
      newAssignment.hoursPerWeek <= 0
    ) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    createMutation.mutate(newAssignment);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <span className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-orange-500" />
                General Time Assignments
              </span>
            }
            description="Manage general time hours per week based on role."
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Assignment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Select
                  value={newAssignment.roleId}
                  onValueChange={(value) =>
                    setNewAssignment({ ...newAssignment, roleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: Role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newAssignment.timeTypeId}
                  onValueChange={(value) =>
                    setNewAssignment({ ...newAssignment, timeTypeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Time Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeTypes.map((type: TimeType) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min={0}
                  value={newAssignment.hoursPerWeek || ""}
                  onChange={(e) =>
                    setNewAssignment({
                      ...newAssignment,
                      hoursPerWeek: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Hours per week"
                />

                <Button onClick={handleAdd} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={6} cols={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-500" />
              General Time Assignments
            </span>
          }
          description="Manage general time hours per week based on role."
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Assignment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Select
                value={newAssignment.roleId}
                onValueChange={(value) =>
                  setNewAssignment({ ...newAssignment, roleId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role: Role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newAssignment.timeTypeId}
                onValueChange={(value) =>
                  setNewAssignment({ ...newAssignment, timeTypeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Time Type" />
                </SelectTrigger>
                <SelectContent>
                  {timeTypes.map((type: TimeType) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={0}
                value={newAssignment.hoursPerWeek || ""}
                onChange={(e) =>
                  setNewAssignment({
                    ...newAssignment,
                    hoursPerWeek: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="Hours per week"
              />

              <Button onClick={handleAdd} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Time Type</TableHead>
                <TableHead>Hours Per Week</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment: GeneralTimeAssignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>{assignment.role.name}</TableCell>
                  <TableCell>{assignment.timeType.name}</TableCell>
                  <TableCell>{assignment.hoursPerWeek}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
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
    </div>
  );
}
