"use client";

import * as React from "react";
import { use, useState } from "react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { createRole, deleteRole } from "./actions";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Role {
  id: string;
  name: string;
  employees: {
    id: string;
    name: string;
  }[];
}

interface RolesTableProps {
  initialRolesPromise: Promise<Role[]>;
}

export function RolesTable({ initialRolesPromise }: RolesTableProps) {
  const { toast } = useToast();
  const initialRoles = use(initialRolesPromise);
  const [roles, setRoles] = useState(initialRoles);
  const [newRoleName, setNewRoleName] = useState("");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRole = async () => {
    try {
      setIsLoading(true);

      if (!newRoleName.trim()) {
        toast({
          title: "Error",
          description: "Role name is required",
          variant: "destructive",
        });
        return;
      }

      if (
        roles.some(
          (role) => role.name.toLowerCase() === newRoleName.trim().toLowerCase()
        )
      ) {
        toast({
          title: "Error",
          description: "Role already exists",
          variant: "destructive",
        });
        return;
      }

      const result = await createRole(newRoleName);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setRoles((prev) => [...prev, result.data!]);
      setNewRoleName("");
      setOpen(false);

      toast({
        title: "Success",
        description: "Role created successfully",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      setIsLoading(true);
      const result = await deleteRole(id);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      setRoles((prev) => prev.filter((role) => role.id !== id));

      toast({
        title: "Success",
        description: "Role deleted successfully",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  type="text"
                  placeholder="Software Engineer"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddRole}
                disabled={!newRoleName.trim() || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Role Name</TableHead>
              <TableHead className="w-[40%]">Employees</TableHead>
              <TableHead className="w-[20%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow
                key={role.id}
                data-role-id={role.id}
                className="transition-colors hover:bg-muted/50"
              >
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors">
                    {role.employees.length} employees
                  </span>
                </TableCell>
                <TableCell>
                  {role.employees.length > 0 ? (
                    <Button
                      variant="ghost"
                      className="text-muted-foreground"
                      disabled
                      title="Cannot delete role with assigned employees"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this role? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRole(role.id)}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {roles.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No roles found. Create your first role to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
