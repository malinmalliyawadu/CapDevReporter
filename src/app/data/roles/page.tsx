"use client";

import { trpc } from "@/utils/trpc";
import { useState } from "react";
import { Drama } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";

export default function RolesPage() {
  const [newRoleName, setNewRoleName] = useState("");

  const { data: roles, refetch: refetchRoles } = trpc.role.getAll.useQuery();
  const { mutate: createRole } = trpc.role.create.useMutation({
    onSuccess: () => {
      refetchRoles();
      setNewRoleName("");
    },
  });
  const { mutate: deleteRole } = trpc.role.delete.useMutation({
    onSuccess: () => refetchRoles(),
  });

  const handleAddRole = () => {
    // Validate role name
    if (!newRoleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    // Check for duplicate role names
    if (
      roles?.some(
        (role) => role.name.toLowerCase() === newRoleName.trim().toLowerCase()
      )
    ) {
      alert("This role already exists");
      return;
    }

    createRole({
      name: newRoleName.trim(),
    });
  };

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Drama className="h-6 w-6 text-purple-500" />
            Roles
          </span>
        }
        description="Manage employee roles and responsibilities."
      />

      <Card>
        <CardHeader>
          <CardTitle>Add New Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                type="text"
                placeholder="Software Engineer"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4"
            onClick={handleAddRole}
            disabled={!newRoleName.trim()}
          >
            Add Role
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles?.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {role.employees.length} employees
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => deleteRole({ id: role.id })}
                      disabled={role.employees.length > 0}
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
