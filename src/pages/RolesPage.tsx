import { useState } from "react";
import { Drama } from "lucide-react";
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
import { PageHeader } from "@/components/ui/page-header";
import { roles } from "@/data/roles";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";

export function RolesPage() {
  const [rolesList, setRolesList] = useState(roles);
  const [newRoleName, setNewRoleName] = useState("");

  const handleAddRole = () => {
    // Validate role name
    if (!newRoleName.trim()) {
      alert("Please enter a role name");
      return;
    }

    // Check for duplicate role names
    if (
      rolesList.some(
        (role) => role.name.toLowerCase() === newRoleName.trim().toLowerCase()
      )
    ) {
      alert("This role already exists");
      return;
    }

    // Create new role
    const newRole = {
      id: Math.max(...rolesList.map((role) => role.id)) + 1,
      name: newRoleName.trim(),
    };

    // Add to list
    setRolesList((prev) => [...prev, newRole]);

    // Reset input
    setNewRoleName("");
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Drama className="h-6 w-6 text-purple-500" />
            Roles
          </span>
        }
        description="Manage employee roles and responsibilities."
      />

      <Card className="mb-8">
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
                <TableHead>ID</TableHead>
                <TableHead>Role Name</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {rolesList.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
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
