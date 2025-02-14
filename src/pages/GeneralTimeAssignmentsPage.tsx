import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
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

export function GeneralTimeAssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AdminTimeAssignment[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    roleId: "",
    hoursPerWeek: 0,
    timeType: "",
  });
  const { toast } = useToast();

  // Load assignments (replace with your actual data fetching)
  useEffect(() => {
    setAssignments(generalTimeAssignments);
  }, [user]);

  const handleAdd = () => {
    if (
      !newAssignment.roleId ||
      !newAssignment.timeType ||
      newAssignment.hoursPerWeek <= 0
    ) {
      toast({ description: "Please fill in all fields correctly" });
      return;
    }

    const assignment: AdminTimeAssignment = {
      id: assignments.length + 1,
      userId: user!.id,
      roleId: newAssignment.roleId,
      hoursPerWeek: newAssignment.hoursPerWeek,
      timeType: newAssignment.timeType,
    };

    setAssignments([...assignments, assignment]);
    setNewAssignment({ roleId: "", hoursPerWeek: 0, timeType: "" });
    toast({ description: "Assignment added successfully" });
  };

  const handleDelete = (id: number) => {
    setAssignments(assignments.filter((assignment) => assignment.id !== id));
    toast({ description: "Assignment deleted successfully" });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="General Time Assignments"
        description="Manage general time hours per week based on role."
      />

      {/* Add new assignment form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, roleId: value })
              }
              value={newAssignment.roleId}
            >
              <SelectTrigger className="w-[250px]">
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
                setNewAssignment({ ...newAssignment, timeType: value })
              }
              value={newAssignment.timeType}
            >
              <SelectTrigger className="w-[250px]">
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
              min={40}
              value={newAssignment.hoursPerWeek}
              onChange={(e) =>
                setNewAssignment({
                  ...newAssignment,
                  hoursPerWeek: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Hours per week"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <Button variant="default" onClick={handleAdd}>
              <Clock className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="font-bold">
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
