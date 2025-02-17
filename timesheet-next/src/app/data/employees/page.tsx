"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface NewEmployee {
  name: string;
  payrollId: string;
  roleId: string;
  hoursPerWeek: string;
  teamId: string;
}

export default function EmployeesPage() {
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: "",
    payrollId: "",
    roleId: "",
    teamId: "",
    hoursPerWeek: "40",
  });

  const { data: employees, refetch: refetchEmployees } =
    trpc.employee.getAll.useQuery();
  const { data: roles } = trpc.role.getAll.useQuery();
  const { data: teams } = trpc.team.getAll.useQuery();
  const { mutate: createEmployee } = trpc.employee.create.useMutation({
    onSuccess: () => {
      refetchEmployees();
      // Reset form
      setNewEmployee({
        name: "",
        payrollId: "",
        roleId: "",
        teamId: "",
        hoursPerWeek: "40",
      });
    },
  });
  const { mutate: deleteEmployee } = trpc.employee.delete.useMutation({
    onSuccess: () => refetchEmployees(),
  });

  const handleInputChange = (field: keyof NewEmployee, value: string) => {
    setNewEmployee((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddEmployee = () => {
    // Validate required fields
    if (
      !newEmployee.name ||
      !newEmployee.payrollId ||
      !newEmployee.roleId ||
      !newEmployee.teamId
    ) {
      alert("Please fill in all required fields");
      return;
    }

    createEmployee({
      name: newEmployee.name,
      payrollId: newEmployee.payrollId,
      roleId: parseInt(newEmployee.roleId),
      teamId: parseInt(newEmployee.teamId),
      hoursPerWeek: parseInt(newEmployee.hoursPerWeek) || 40,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <User className="h-6 w-6 text-green-500" />
            Employees
          </span>
        }
        description="Manage your employee directory."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add New Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={newEmployee.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="payroll-id">Payroll ID</Label>
              <Input
                id="payroll-id"
                type="text"
                placeholder="123456"
                value={newEmployee.payrollId}
                onChange={(e) => handleInputChange("payrollId", e.target.value)}
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newEmployee.roleId}
                onValueChange={(value) => handleInputChange("roleId", value)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="team">Team</Label>
              <Select
                value={newEmployee.teamId}
                onValueChange={(value) => handleInputChange("teamId", value)}
              >
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="hours">Hours per Week</Label>
              <Input
                id="hours"
                type="number"
                placeholder="40"
                min="0"
                max="168"
                value={newEmployee.hoursPerWeek}
                onChange={(e) =>
                  handleInputChange("hoursPerWeek", e.target.value)
                }
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleAddEmployee}>
            Add Employee
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Payroll ID</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[150px]">Hours per Week</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.payrollId}</TableCell>
                  <TableCell>{employee.team.name}</TableCell>
                  <TableCell>{employee.role.name}</TableCell>
                  <TableCell>{employee.hoursPerWeek}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => deleteEmployee({ id: employee.id })}
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
