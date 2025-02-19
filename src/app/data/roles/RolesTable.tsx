"use client";

import * as React from "react";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Role {
  id: string;
  name: string;
  employees: any[];
}

interface RolesTableProps {
  initialRoles: Role[];
}

export function RolesTable({ initialRoles }: RolesTableProps) {
  const { toast } = useToast();
  const [roles, setRoles] = useState(initialRoles);
  const [newRoleName, setNewRoleName] = useState("");
  const [open, setOpen] = useState(false);

  const handleAddRole = async () => {
    try {
      // Validate role name
      if (!newRoleName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a role name",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate role names
      if (
        roles.some(
          (role) => role.name.toLowerCase() === newRoleName.trim().toLowerCase()
        )
      ) {
        toast({
          title: "Error",
          description: "This role already exists",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });

      if (!response.ok) throw new Error("Failed to create role");

      const rolesResponse = await fetch("/api/roles");
      const updatedRoles = await rolesResponse.json();
      setRoles(updatedRoles);
      setNewRoleName("");
      setOpen(false);

      toast({
        title: "Success",
        description: "Role created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete role");

      const rolesResponse = await fetch("/api/roles");
      const updatedRoles = await rolesResponse.json();
      setRoles(updatedRoles);

      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add New Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
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
            <DialogFooter>
              <Button onClick={handleAddRole} disabled={!newRoleName.trim()}>
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-100">
                    {role.employees.length} employees
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => handleDeleteRole(role.id)}
                    disabled={role.employees.length > 0}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No roles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
