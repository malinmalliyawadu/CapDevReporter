import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, ListTodo, Trash2 } from "lucide-react";
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

interface AdminTimeAssignment {
  id: string;
  roleId: string;
  userId: string;
  hoursPerWeek: number;
  timeType: string;
}

interface Role {
  id: string;
  name: string;
}

// Mock data - replace with your actual data source
const roles: Role[] = [
  { id: "0", name: "All" },
  { id: "1", name: "Developer" },
  { id: "2", name: "Designer" },
  { id: "3", name: "Product Manager" },
];

// Add time type options after the roles array
const timeTypes = [
  { id: "admin", name: "Admin" },
  { id: "friday-update", name: "Friday Update" },
  { id: "learning-and-development", name: "Learning and Development" },
];

export function GeneralTimeAssignmentsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
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
    // Mock data - replace with actual API call
    const mockAssignments: AdminTimeAssignment[] = [
      {
        id: "1",
        roleId: "1",
        userId: user!.id,
        hoursPerWeek: 20,
        timeType: "admin",
      },
      {
        id: "2",
        roleId: "0",
        userId: user!.id,
        hoursPerWeek: 10,
        timeType: "friday-update",
      },
      {
        id: "3",
        roleId: "0",
        userId: user!.id,
        hoursPerWeek: 10,
        timeType: "learning-and-development",
      },
    ];
    setAssignments(mockAssignments);
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
      id: Math.random().toString(36).substr(2, 9),
      userId: user!.id,
      roleId: newAssignment.roleId,
      hoursPerWeek: newAssignment.hoursPerWeek,
      timeType: newAssignment.timeType,
    };

    setAssignments([...assignments, assignment]);
    setNewAssignment({ roleId: "", hoursPerWeek: 0, timeType: "" });
    toast({ description: "Assignment added successfully" });
  };

  const handleUpdate = (id: string, hoursPerWeek: number) => {
    setAssignments(
      assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, hoursPerWeek } : assignment
      )
    );
    setEditingId(null);
    toast({ description: "Assignment updated successfully" });
  };

  const handleDelete = (id: string) => {
    setAssignments(assignments.filter((assignment) => assignment.id !== id));
    toast({ description: "Assignment deleted successfully" });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">General Time</h1>
        <p className="text-muted-foreground">
          Manage general time hours per week based on role.
        </p>
      </div>

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
                  <SelectItem key={role.id} value={role.id}>
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
                  <SelectItem key={type.id} value={type.id}>
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
                      timeTypes.find((type) => type.id === assignment.timeType)
                        ?.name
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
