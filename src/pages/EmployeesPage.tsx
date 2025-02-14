import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/ui/page-header";
import { employees } from "@/data/employees";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { roles } from "@/data/roles";
import { teams } from "@/data/teams";
import { useState } from "react";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

interface NewEmployee {
  name: string;
  payrollId: string;
  roleId: string;
  hoursPerWeek: string;
}

export function EmployeesPage() {
  const [employeesList, setEmployeesList] = useState(employees);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: "",
    payrollId: "",
    roleId: "",
    hoursPerWeek: "40",
  });

  const handleInputChange = (field: keyof NewEmployee, value: string) => {
    setNewEmployee((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddEmployee = () => {
    // Validate required fields
    if (!newEmployee.name || !newEmployee.payrollId || !newEmployee.roleId) {
      alert("Please fill in all required fields");
      return;
    }

    // Create new employee object
    const employee = {
      id: employeesList.length + 1,
      name: newEmployee.name,
      payrollId: newEmployee.payrollId,
      roleId: parseInt(newEmployee.roleId),
      hoursPerWeek: parseInt(newEmployee.hoursPerWeek) || 40,
      teamId: 1, // Default team, you might want to make this selectable too
    };

    // Add to list
    setEmployeesList((prev) => [...prev, employee]);

    // Reset form
    setNewEmployee({
      name: "",
      payrollId: "",
      roleId: "",
      hoursPerWeek: "40",
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader title="Employees" description="Manage your employees." />

      <Card className="mb-8">
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
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
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
            {employeesList.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{employee.payrollId}</TableCell>
                <TableCell>
                  {teams.find((t) => t.id === employee.teamId)?.name}
                </TableCell>
                <TableCell>
                  {roles.find((r) => r.id === employee.roleId)?.name}
                </TableCell>
                <TableCell>{employee.hoursPerWeek}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton />
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
