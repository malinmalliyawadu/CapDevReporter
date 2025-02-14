import { useState, useEffect } from "react";
import { Timer, Plus, Trash2, Pencil } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { AdminTimeAssignment } from "@/types/adminTimeAssignment";
import { generalTimeAssignments } from "@/data/generalTimeAssignments";
import { roles } from "@/data/roles";
import { timeTypes } from "@/data/timeTypes";
import { EditAssignmentModal } from "@/components/EditAssignmentModal";

export function GeneralTimeAssignmentsPage() {
  const [assignments, setAssignments] = useState<AdminTimeAssignment[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    roleId: 0,
    hoursPerWeek: 0,
    timeTypeId: 0,
  });
  const [editingAssignment, setEditingAssignment] =
    useState<AdminTimeAssignment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setAssignments(generalTimeAssignments);
  }, []);

  const handleAdd = () => {
    if (
      !newAssignment.roleId ||
      !newAssignment.timeTypeId ||
      newAssignment.hoursPerWeek <= 0
    ) {
      toast({ description: "Please fill in all fields correctly" });
      return;
    }

    const assignment: AdminTimeAssignment = {
      id: assignments.length + 1,
      roleId: newAssignment.roleId,
      hoursPerWeek: newAssignment.hoursPerWeek,
      timeTypeId: newAssignment.timeTypeId,
    };

    setAssignments([...assignments, assignment]);
    setNewAssignment({ roleId: 0, hoursPerWeek: 0, timeTypeId: 0 });
    toast({ description: "Assignment added successfully" });
  };

  const handleDelete = (id: number) => {
    setAssignments(assignments.filter((assignment) => assignment.id !== id));
    toast({ description: "Assignment deleted successfully" });
  };

  const handleEdit = (assignment: AdminTimeAssignment) => {
    setAssignments(
      assignments.map((a) => (a.id === assignment.id ? assignment : a))
    );
    setEditingAssignment(null);
    toast({ description: "Assignment updated successfully" });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Timer className="h-6 w-6 text-rose-500" />
            General Time Assignments
          </span>
        }
        description="Manage general time hours per week based on role."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Add New Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            <Select
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, roleId: Number(value) })
              }
              value={String(newAssignment.roleId || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                setNewAssignment({
                  ...newAssignment,
                  timeTypeId: Number(value),
                })
              }
              value={String(newAssignment.timeTypeId || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Time Type" />
              </SelectTrigger>
              <SelectContent>
                {timeTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
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
                  hoursPerWeek: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Hours per week"
            />

            <Button onClick={handleAdd} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </CardContent>
      </Card>

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
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {roles.find((role) => role.id === assignment.roleId)?.name}
                  </TableCell>
                  <TableCell>
                    {
                      timeTypes.find(
                        (type) => type.id === assignment.timeTypeId
                      )?.name
                    }
                  </TableCell>
                  <TableCell>{assignment.hoursPerWeek}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingAssignment(assignment)}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditAssignmentModal
        assignment={editingAssignment}
        open={!!editingAssignment}
        onOpenChange={(open) => !open && setEditingAssignment(null)}
        onSave={handleEdit}
      />
    </div>
  );
}
