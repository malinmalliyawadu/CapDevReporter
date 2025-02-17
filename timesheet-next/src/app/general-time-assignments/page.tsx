"use client";

import { useState, useEffect } from "react";
import { Timer, Plus, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

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
  const [assignments, setAssignments] = useState<GeneralTimeAssignment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [timeTypes, setTimeTypes] = useState<TimeType[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    roleId: "",
    timeTypeId: "",
    hoursPerWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/general-time-assignments");
      const data = await response.json();
      setAssignments(data.assignments);
      setRoles(data.roles);
      setTimeTypes(data.timeTypes);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load general time assignments");
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (
      !newAssignment.roleId ||
      !newAssignment.timeTypeId ||
      newAssignment.hoursPerWeek <= 0
    ) {
      toast.error("Please fill in all fields correctly");
      return;
    }

    try {
      const response = await fetch("/api/general-time-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAssignment),
      });

      if (!response.ok) {
        throw new Error("Failed to create assignment");
      }

      await fetchData();
      setNewAssignment({ roleId: "", timeTypeId: "", hoursPerWeek: 0 });
      toast.success("Assignment added successfully");
    } catch (error) {
      console.error("Failed to add assignment:", error);
      toast.error("Failed to add assignment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/general-time-assignments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete assignment");
      }

      await fetchData();
      toast.success("Assignment deleted successfully");
    } catch (error) {
      console.error("Failed to delete assignment:", error);
      toast.error("Failed to delete assignment");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

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
          <CardTitle>Add New Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
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
                {roles.map((role) => (
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
                {timeTypes.map((type) => (
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
