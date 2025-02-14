import { useState } from "react";
import { CardHeader } from "@/components/ui/card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Select, SelectContent, SelectValue } from "@/components/ui/select";
import { SelectItem, SelectTrigger } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { PageHeader } from "@/components/ui/page-header";
import { teams } from "@/data/teams";
import { employees } from "@/data/employees";
import { teamAssignments } from "@/data/teamAssignments";
import { format } from "date-fns";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { LayoutGrid } from "lucide-react";

export function TeamAssignmentsPage() {
  const [assignments, setAssignments] = useState(teamAssignments);

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
              <Select>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={String(employee.id)}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="start-date">Start Date</Label>
              <DatePicker />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="end-date">End Date</Label>
              <DatePicker />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label>Team</Label>
              <Select>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select Team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button className="mt-4">Add Assignment</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const employee = employees.find(
                  (e) => e.id === assignment.employeeId
                );
                const team = teams.find((t) => t.id === assignment.teamId);
                return (
                  <TableRow key={assignment.id}>
                    <TableCell>{employee?.name}</TableCell>
                    <TableCell>{team?.name}</TableCell>
                    <TableCell>
                      {format(new Date(assignment.startDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.endDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <ConfirmDeleteButton />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
