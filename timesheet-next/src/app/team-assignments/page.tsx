"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { PageHeader } from "@/components/ui/page-header";
import { LayoutGrid } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  team: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
  description: string;
}

export default function TeamAssignmentsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/team-assignments");
      const data = await response.json();
      setEmployees(data.employees);
      setTeams(data.teams);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load team assignments");
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !selectedTeam) {
      toast.error("Please select both employee and team");
      return;
    }

    try {
      const response = await fetch("/api/team-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          teamId: selectedTeam,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update team assignment");
      }

      await fetchData();
      toast.success("Team assignment updated successfully");
      setSelectedEmployee("");
      setSelectedTeam("");
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      console.error("Failed to update team assignment:", error);
      toast.error("Failed to update team assignment");
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
            <LayoutGrid className="h-6 w-6 text-orange-500" />
            Team Assignments
          </span>
        }
        description="Manage team memberships and assignments."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Assign Employee to Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker date={startDate} onSelect={setStartDate} />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker date={endDate} onSelect={setEndDate} />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select Team" />
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
          <Button className="mt-4" onClick={handleSubmit}>
            Add Assignment
          </Button>
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
                <TableHead>Employee</TableHead>
                <TableHead>Current Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.team.name}</TableCell>
                  <TableCell>{employee.role.name}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement delete functionality
                        toast.error("Delete functionality not implemented yet");
                      }}
                    >
                      Delete
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
