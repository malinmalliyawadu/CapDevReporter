"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { User, RefreshCw, Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<{
    id: string;
    data: NewEmployee;
  } | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);

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
  const { mutate: syncEmployees } = trpc.employee.sync.useMutation({
    onSuccess: () => {
      refetchEmployees();
      setLastSynced(new Date());
      toast.success("Employees synced with iPayroll");
      setIsSyncing(false);
    },
    onError: () => {
      toast.error("Failed to sync employees");
      setIsSyncing(false);
    },
  });
  const { mutate: updateEmployee } = trpc.employee.update.useMutation({
    onSuccess: () => {
      refetchEmployees();
      setEditingEmployee(null);
      toast.success("Employee updated successfully");
    },
    onError: () => {
      toast.error("Failed to update employee");
    },
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
      roleId: newEmployee.roleId,
      teamId: newEmployee.teamId,
      hoursPerWeek: parseInt(newEmployee.hoursPerWeek) || 40,
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    syncEmployees();
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee) return;

    if (
      !editingEmployee.data.name ||
      !editingEmployee.data.payrollId ||
      !editingEmployee.data.roleId ||
      !editingEmployee.data.teamId
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    updateEmployee({
      id: editingEmployee.id,
      name: editingEmployee.data.name,
      payrollId: editingEmployee.data.payrollId,
      roleId: editingEmployee.data.roleId,
      teamId: editingEmployee.data.teamId,
      hoursPerWeek: parseInt(editingEmployee.data.hoursPerWeek) || 40,
    });
  };

  const handleEditInputChange = (field: keyof NewEmployee, value: string) => {
    if (!editingEmployee) return;
    setEditingEmployee({
      ...editingEmployee,
      data: {
        ...editingEmployee.data,
        [field]: value,
      },
    });
  };

  const startEditing = (employee: any) => {
    setEditingEmployee({
      id: employee.id,
      data: {
        name: employee.name,
        payrollId: employee.payrollId,
        roleId: employee.roleId,
        teamId: employee.teamId,
        hoursPerWeek: employee.hoursPerWeek.toString(),
      },
    });
  };

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <User className="h-6 w-6 text-green-500" />
            Employees
          </span>
        }
        description="Manage your employee directory."
      />

      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString("en-NZ")}
            </span>
          )}
          <Button onClick={handleSync} disabled={isSyncing}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`}
            />
            Sync with iPayroll
          </Button>
        </div>
      </div>

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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => setEmployeeToDelete(employee.id)}
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

      <Dialog
        open={!!editingEmployee}
        onOpenChange={() => setEditingEmployee(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editingEmployee?.data.name}
                onChange={(e) => handleEditInputChange("name", e.target.value)}
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-payroll-id">Payroll ID</Label>
              <Input
                id="edit-payroll-id"
                value={editingEmployee?.data.payrollId}
                onChange={(e) =>
                  handleEditInputChange("payrollId", e.target.value)
                }
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={editingEmployee?.data.roleId}
                onValueChange={(value) =>
                  handleEditInputChange("roleId", value)
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-team">Team</Label>
              <Select
                value={editingEmployee?.data.teamId}
                onValueChange={(value) =>
                  handleEditInputChange("teamId", value)
                }
              >
                <SelectTrigger id="edit-team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="edit-hours">Hours per Week</Label>
              <Input
                id="edit-hours"
                type="number"
                min="0"
                max="168"
                value={editingEmployee?.data.hoursPerWeek}
                onChange={(e) =>
                  handleEditInputChange("hoursPerWeek", e.target.value)
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!employeeToDelete}
        onOpenChange={() => setEmployeeToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this employee? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmployeeToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (employeeToDelete) {
                  deleteEmployee({ id: employeeToDelete });
                  setEmployeeToDelete(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
